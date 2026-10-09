#!/usr/bin/env python3
"""Valida un export JSON normalizado localmente. Solo lectura; no usa red.
Uso: python3 validate_export.py export.json
Salida: conteos y categorías de error sin datos personales. Exit 0 válido / 2 inválido.
"""
import argparse
from collections import Counter
from datetime import datetime
import hashlib
import json
from pathlib import Path
import uuid

TABLES = ("profiles", "progress", "auth_links", "audit", "site_admin", "request_limits")
LESSONS = {"bienvenida", "producto", "invitacion", "acompanamiento", "comisiones", "finanzas"}

def is_uuid(v):
    try:
        return isinstance(v, str) and str(uuid.UUID(v)) == v.lower()
    except (ValueError, AttributeError, TypeError):
        return False

def timestamp(v):
    if not isinstance(v, str):
        return False
    try:
        return datetime.fromisoformat(v.replace("Z", "+00:00")).tzinfo is not None
    except ValueError:
        return False

def string(v):
    return isinstance(v, str) and bool(v.strip())

def validate(data):
    errors = Counter()
    warnings = Counter()
    counts = {}
    if not isinstance(data, dict) or data.get("format_version") != 1:
        return {"ok": False, "errors": {"invalid_format_version": 1}, "warnings": {}, "counts": {}}
    tables = data.get("tables")
    auth = data.get("auth_subjects")
    if not isinstance(tables, dict):
        return {"ok": False, "errors": {"missing_tables": 1}, "warnings": {}, "counts": {}}
    for name in TABLES:
        rows = tables.get(name)
        if not isinstance(rows, list) or not all(isinstance(r, dict) for r in rows):
            errors["invalid_table_" + name] += 1
        else:
            counts[name] = len(rows)
    if not isinstance(auth, list) or not all(is_uuid(a) for a in auth):
        errors["invalid_auth_inventory"] += 1
    if errors:
        return {"ok": False, "errors": dict(errors), "warnings": {}, "counts": counts}
    if len(set(auth)) != len(auth):
        errors["duplicate_auth_subject"] += 1
    authset = set(auth)
    profiles = tables["profiles"]
    ids = set()
    public_ids = set()
    referrals = set()
    parents = {}
    for p in profiles:
        uid = p.get("user_id")
        public = p.get("public_id")
        referral = p.get("referral_code")
        if not string(uid):
            errors["invalid_profile_user_id"] += 1
            continue
        if uid in ids:
            errors["duplicate_profile_user_id"] += 1
        ids.add(uid)
        if not is_uuid(public):
            errors["invalid_public_id"] += 1
        elif public in public_ids:
            errors["duplicate_public_id"] += 1
        else:
            public_ids.add(public)
        if not string(referral):
            errors["invalid_referral_code"] += 1
        elif referral in referrals:
            errors["duplicate_referral_code"] += 1
        else:
            referrals.add(referral)
        if not string(p.get("name")) or not isinstance(p.get("city"), str):
            errors["invalid_profile_fields"] += 1
        for flag in ("founder", "wants_founder"):
            if type(p.get(flag)) is not int or p[flag] not in (0, 1):
                errors["invalid_profile_flag"] += 1
        if not string(p.get("consent_version")) or not timestamp(p.get("created_at")):
            errors["invalid_profile_evidence"] += 1
        parent = p.get("sponsor_id")
        if parent is not None and not string(parent):
            errors["invalid_sponsor_type"] += 1
        else:
            parents[uid] = parent
    counts["founders"] = sum(p.get("founder") == 1 for p in profiles)
    counts["auth_accounts"] = len(auth)
    if counts["founders"] > 10:
        errors["founder_limit_exceeded"] += 1
    for child, parent in parents.items():
        if parent is not None and parent not in ids:
            errors["orphan_sponsor"] += 1
    # Iterative graph walk handles deep networks without recursion limits.
    completed = set()
    for start in parents:
        path = set()
        node = start
        while node is not None and node in parents and node not in completed:
            if node in path:
                errors["sponsor_cycle"] += 1
                break
            path.add(node)
            node = parents[node]
        completed.update(path)

    subject_to_user = {}
    user_to_subject = {}
    for link in tables["auth_links"]:
        subject, uid = link.get("provider_subject"), link.get("user_id")
        if not is_uuid(subject) or not string(uid):
            errors["invalid_auth_link"] += 1
            continue
        if subject in subject_to_user:
            errors["duplicate_link_subject"] += 1
        if uid in user_to_subject:
            errors["duplicate_link_user"] += 1
        subject_to_user[subject] = uid
        user_to_subject[uid] = subject
        if subject not in authset:
            errors["link_without_auth_account"] += 1
        if uid not in ids:
            errors["link_without_profile"] += 1
        if not timestamp(link.get("created_at")):
            errors["invalid_link_time"] += 1
    resolved = dict(subject_to_user)
    for uid in ids:
        if uid.startswith("fh-email:"):
            subject = uid[len("fh-email:"):]
            if not is_uuid(subject) or subject not in authset:
                errors["email_profile_without_auth"] += 1
                continue
            if subject in resolved and resolved[subject] != uid:
                errors["identity_collision"] += 1
            if uid in user_to_subject and user_to_subject[uid] != subject:
                errors["identity_collision"] += 1
            resolved[subject] = uid
        elif uid not in user_to_subject:
            warnings["legacy_profile_unlinked"] += 1
    counts["auth_without_profile"] = len(authset - set(resolved))
    seen_progress = set()
    for p in tables["progress"]:
        uid, lesson = p.get("user_id"), p.get("lesson_id")
        if not string(uid) or not string(lesson):
            errors["invalid_progress_fields"] += 1
            continue
        key = (uid, lesson)
        if key in seen_progress:
            errors["duplicate_progress"] += 1
        seen_progress.add(key)
        if uid not in ids:
            errors["orphan_progress"] += 1
        if lesson not in LESSONS:
            warnings["unknown_legacy_lesson"] += 1
        if not timestamp(p.get("completed_at")):
            errors["invalid_progress_time"] += 1
    audit_ids = set()
    for a in tables["audit"]:
        aid = a.get("id")
        if not string(aid):
            errors["invalid_audit_id"] += 1
        elif aid in audit_ids:
            errors["duplicate_audit_id"] += 1
        else:
            audit_ids.add(aid)
        if not all(string(a.get(k)) for k in ("actor_id", "subject_id", "action")) or not timestamp(a.get("created_at")):
            errors["invalid_audit_fields"] += 1
    roles = set()
    for a in tables["site_admin"]:
        role = a.get("role")
        if not string(role):
            errors["invalid_admin_role"] += 1
        elif role in roles:
            errors["duplicate_admin_role"] += 1
        else:
            roles.add(role)
        if not string(a.get("user_id")) or not timestamp(a.get("bound_at")):
            errors["invalid_admin_fields"] += 1
        elif a["user_id"] not in ids:
            warnings["admin_without_profile_requires_review"] += 1
    # Ephemeral request limits are counted only and will not be migrated.
    expected = data.get("expected_counts")
    if expected is not None:
        if not isinstance(expected, dict) or any(type(expected.get(t)) is not int for t in TABLES):
            errors["invalid_expected_counts"] += 1
        else:
            for t in TABLES:
                if expected[t] != counts[t]:
                    errors["count_mismatch_" + t] += 1
    return {"ok": not errors, "errors": dict(errors), "warnings": dict(warnings), "counts": counts}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", type=Path)
    args = parser.parse_args()
    try:
        if args.path.stat().st_size > 250 * 1024 * 1024:
            raise ValueError("size")
        raw = args.path.read_bytes()
        result = validate(json.loads(raw))
        result["sha256"] = hashlib.sha256(raw).hexdigest()
    except (OSError, ValueError, TypeError, KeyError):
        result = {"ok": False, "errors": {"unreadable_or_malformed_export": 1}}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result["ok"] else 2)

if __name__ == "__main__":
    main()
