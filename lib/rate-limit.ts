export const RATE_LIMITS = {
  read:{max:120,windowMs:60_000},
  write:{max:30,windowMs:60_000},
  register:{max:5,windowMs:900_000},
  auth:{max:12,windowMs:900_000},
  authIp:{max:40,windowMs:900_000},
  authGlobal:{max:200,windowMs:900_000},
} as const;
export type LimitScope = keyof typeof RATE_LIMITS;

export async function consumeLimit(db:D1Database,userId:string,scope:LimitScope,now=Date.now()) {
  const policy=RATE_LIMITS[scope];
  const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`${scope}:${userId}`));
  const key=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
  // One atomic upsert counts simultaneous requests across Worker instances.
  // Retain only recent counters; bounded cleanup runs on subsequent activity.
  const results=await db.batch([
    db.prepare("DELETE FROM request_limits WHERE key IN (SELECT key FROM request_limits WHERE resets_at < ? ORDER BY resets_at LIMIT 100)").bind(now-86_400_000),
    db.prepare(`INSERT INTO request_limits (key,count,resets_at) VALUES (?,1,?)
      ON CONFLICT(key) DO UPDATE SET
        count=CASE WHEN request_limits.resets_at <= ? THEN 1 ELSE request_limits.count+1 END,
        resets_at=CASE WHEN request_limits.resets_at <= ? THEN excluded.resets_at ELSE request_limits.resets_at END
      RETURNING count,resets_at`).bind(key,now+policy.windowMs,now,now),
  ]);
  const row=results[1].results[0] as {count:number;resets_at:number}|undefined;
  if (!row || !Number.isSafeInteger(row.count) || !Number.isSafeInteger(row.resets_at)) throw new Error("Rate limit unavailable");
  const allowed=row.count<=policy.max;
  if (row.count===policy.max+1) {
    // One diagnostic event per blocked window, without identity or form data.
    console.warn(JSON.stringify({event:"rate_limit_exceeded",scope,at:new Date(now).toISOString()}));
  }
  return {allowed,retryAfter:Math.max(1,Math.ceil((row.resets_at-now)/1000))};
}
