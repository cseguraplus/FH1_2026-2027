import { database, authorize, json, type Profile } from "@/lib/server";
import { consumeLimit } from "@/lib/rate-limit";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { logError, requestId } from "@/lib/log";
export const dynamic = "force-dynamic";
export async function GET(request?:Request) {
  let respond = json;
  try {
    const access = await authorize(request);
    respond = (data,status=200,headers={}) => access.apply(json(data,status,headers));
    const user = access.user;
    if (!user) return respond({error:"Inicia sesión para continuar."},401);
    const db = database();
    const limit=await consumeLimit(db,user.userId,"read");
    if (!limit.allowed) return respond({error:"Has realizado muchas consultas. Espera un momento e inténtalo de nuevo."},429,{"Retry-After":String(limit.retryAfter)});
    const [profile, totals] = await Promise.all([
      db.prepare("SELECT user_id,public_id,name,city,referral_code,sponsor_id,wants_founder,founder,created_at FROM profiles WHERE user_id = ?").bind(user.userId).first<Profile>(),
      db.prepare("SELECT COUNT(*) AS registered, COALESCE(SUM(founder),0) AS founders FROM profiles").first(),
    ]);
    if (!profile) {
      const legacy=user.authMethod === "email" ? await getChatGPTUser() : null;
      const previous=legacy ? await db.prepare("SELECT user_id FROM profiles WHERE user_id = ?").bind(legacy.userId).first() : null;
      return respond({profile:null,isAdmin:user.isAdmin,authMethod:user.authMethod,needsLink:!!previous,totals,progress:[],network:[],applicants:[]});
    }
    const results = await db.batch([
      db.prepare("SELECT lesson_id, completed_at FROM progress WHERE user_id = ?").bind(user.userId),
      db.prepare(`WITH RECURSIVE tree(user_id, depth) AS (
        SELECT user_id, 1 FROM profiles WHERE sponsor_id = ?
        UNION ALL SELECT p.user_id, tree.depth + 1 FROM profiles p JOIN tree ON p.sponsor_id = tree.user_id WHERE tree.depth < 3
      ) SELECT p.public_id, p.name, p.city, p.founder, p.created_at, tree.depth,
        (SELECT COUNT(*) FROM progress q WHERE q.user_id = p.user_id) AS completed
        FROM tree JOIN profiles p ON p.user_id = tree.user_id ORDER BY tree.depth, p.created_at DESC`).bind(user.userId),
      db.prepare("SELECT name,referral_code FROM profiles WHERE user_id = ?").bind(profile.sponsor_id ?? ""),
      ...(user.isAdmin ? [db.prepare(`SELECT public_id,name,city,wants_founder,founder,created_at,
        (SELECT COUNT(*) FROM progress q WHERE q.user_id = p.user_id) AS completed
        FROM profiles p WHERE wants_founder = 1 OR founder = 1 ORDER BY founder DESC, created_at`)] : []),
    ]);
    const applicants = results[3]?.results ?? [];
    // Only fields required by the interface may leave the server. New database
    // columns must never become API fields implicitly.
    return respond({profile:{
      public_id:profile.public_id,name:profile.name,city:profile.city,
      referral_code:profile.referral_code,wants_founder:profile.wants_founder,
      founder:profile.founder,created_at:profile.created_at,
    },isAdmin:user.isAdmin,authMethod:user.authMethod,totals,progress:results[0].results,network:results[1].results,sponsor:results[2].results[0] ?? null,applicants});
  } catch (error) { const id=requestId(request); logError("state",error,id); return respond({error:"No pudimos cargar tu espacio. Intenta nuevamente."},503,{"X-Request-Id":id}); }
}
