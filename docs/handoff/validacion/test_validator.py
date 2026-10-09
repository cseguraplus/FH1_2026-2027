import copy
import json
from pathlib import Path
import unittest
from validate_export import validate

BASE=json.loads((Path(__file__).parent/"fixture.json").read_text())

class ValidationTests(unittest.TestCase):
    def changed(self):
        return copy.deepcopy(BASE)
    def test_valid(self):
        r=validate(BASE); self.assertTrue(r["ok"]); self.assertEqual(r["counts"]["profiles"],2)
    def test_cycle(self):
        d=self.changed();d["tables"]["profiles"][0]["sponsor_id"]="legacy-demo-2"
        self.assertIn("sponsor_cycle",validate(d)["errors"])
    def test_orphan(self):
        d=self.changed();d["tables"]["profiles"][1]["sponsor_id"]="missing"
        self.assertIn("orphan_sponsor",validate(d)["errors"])
    def test_duplicate_code(self):
        d=self.changed();d["tables"]["profiles"][1]["referral_code"]="FHDEMO0001"
        self.assertIn("duplicate_referral_code",validate(d)["errors"])
    def test_duplicate_uuid(self):
        d=self.changed();d["tables"]["profiles"][1]["public_id"]=d["tables"]["profiles"][0]["public_id"]
        self.assertIn("duplicate_public_id",validate(d)["errors"])
    def test_invalid_time(self):
        d=self.changed();d["tables"]["profiles"][0]["created_at"]="2026-10-07"
        self.assertIn("invalid_profile_evidence",validate(d)["errors"])
    def test_missing_table(self):
        d=self.changed();del d["tables"]["audit"]
        self.assertFalse(validate(d)["ok"])
    def test_orphan_progress(self):
        d=self.changed();d["tables"]["progress"][0]["user_id"]="missing"
        self.assertIn("orphan_progress",validate(d)["errors"])
    def test_identity_collision(self):
        d=self.changed();p=copy.deepcopy(d["tables"]["profiles"][1])
        p.update(user_id="fh-email:"+d["auth_subjects"][0],public_id="00000000-0000-4000-8000-000000000003",referral_code="FHDEMO0003")
        d["tables"]["profiles"].append(p)
        self.assertIn("identity_collision",validate(d)["errors"])
    def test_unknown_auth(self):
        d=self.changed();d["auth_subjects"]=[]
        self.assertIn("link_without_auth_account",validate(d)["errors"])
    def test_bad_types(self):
        d=self.changed();d["tables"]["profiles"][0]["sponsor_id"]=[]
        self.assertFalse(validate(d)["ok"])
    def test_counts(self):
        d=self.changed();d["expected_counts"]={k:len(v) for k,v in d["tables"].items()};d["expected_counts"]["profiles"]=300
        self.assertIn("count_mismatch_profiles",validate(d)["errors"])
    def test_no_identity_in_output(self):
        out=json.dumps(validate(BASE));self.assertNotIn("legacy-demo",out);self.assertNotIn("Alumno",out)
    def test_deep_graph(self):
        d=self.changed();d["tables"]["profiles"]=[]
        for i in range(1500):
            d["tables"]["profiles"].append(dict(user_id="u"+str(i),public_id="00000000-0000-4000-8000-"+str(i).zfill(12),name="Ficticio",city="",referral_code="DEMO"+str(i),sponsor_id="u"+str(i-1) if i else None,wants_founder=0,founder=0,consent_version="demo",created_at="2026-10-07T00:00:00Z"))
        d["tables"]["auth_links"]=[];d["tables"]["progress"]=[];d["tables"]["site_admin"]=[]
        self.assertTrue(validate(d)["ok"])
if __name__=="__main__":
    unittest.main()
