import { z } from "zod";
import { correctAnswers, database, authorize, json } from "@/lib/server";
import { readBoundedJson, RequestBodyError } from "@/lib/request-body";
import { consumeLimit } from "@/lib/rate-limit";
import { getChatGPTUser } from "@/app/chatgpt-auth";
export const dynamic = "force-dynamic";
const inputSchema = z.discriminatedUnion("action",[
  z.object({action:z.literal("register"),name:z.string().trim().min(2).max(70),city:z.string().trim().max(70).default(""),sponsorCode:z.string().trim().max(24).default(""),consent:z.literal(true),wantsFounder:z.boolean()}).strict(),
  z.object({action:z.literal("completeLesson"),lessonId:z.string().max(40),answer:z.number().int().min(0).max(2)}).strict(),
  z.object({action:z.literal("approveFounder"),publicId:z.string().uuid()}).strict(),
]);
export async function POST(request:Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({error:"Origen de solicitud no válido."},403);
  let user;
  let respond = json;
  try {
    const access=await authorize(request);
    respond=(data,status=200,headers={})=>access.apply(json(data,status,headers));
    user=access.user;
    if (!user) return respond({error:"Inicia sesión para continuar."},401);
    const limit=await consumeLimit(database(),user.userId,"write");
    if (!limit.allowed) return respond({error:"Has realizado muchas solicitudes. Espera un momento e inténtalo de nuevo."},429,{"Retry-After":String(limit.retryAfter)});
  } catch { return respond({error:"No pudimos guardar el cambio. Intenta nuevamente."},503); }
  let raw:unknown;
  try { raw=await readBoundedJson(request); }
  catch (error) {
    if (error instanceof RequestBodyError) return respond({error:error.message},error.status);
    return respond({error:"Solicitud no válida."},400);
  }
  const parsed=inputSchema.safeParse(raw);
  if (!parsed.success) return respond({error:"Revisa los campos y confirma las condiciones."},400);
  const data=parsed.data;
  try {
    const db=database();
    const own=await db.prepare("SELECT user_id FROM profiles WHERE user_id = ?").bind(user.userId).first();
    if (data.action === "register") {
      if (own) return respond({error:"Tu registro ya existe."},409);
      if (user.authMethod === "email") {
        const legacy=await getChatGPTUser();
        const previous=legacy ? await db.prepare("SELECT user_id FROM profiles WHERE user_id = ?").bind(legacy.userId).first() : null;
        if (previous) return respond({error:"Ya tienes un perfil anterior. Vincúlalo desde Tu cuenta para conservar tu organización."},409);
      }
      const limit=await consumeLimit(db,user.userId,"register");
      if (!limit.allowed) return respond({error:"Has alcanzado el límite de intentos de registro. Inténtalo más tarde."},429,{"Retry-After":String(limit.retryAfter)});
      const code=data.sponsorCode.toUpperCase();
      const sponsor=code ? await db.prepare("SELECT user_id FROM profiles WHERE referral_code = ?").bind(code).first<{user_id:string}>() : null;
      if (code && !sponsor) return respond({error:"El código de invitación no existe. Confírmalo con quien te invitó."},400);
      if (sponsor?.user_id === user.userId) return respond({error:"No puedes ser tu propio patrocinador."},400);
      const id=crypto.randomUUID();
      const inserted=await db.prepare("INSERT INTO profiles (user_id,public_id,name,city,referral_code,sponsor_id,wants_founder,founder,consent_version,created_at) SELECT ?,?,?,?,?,?,?,0,?,? WHERE NOT EXISTS (SELECT 1 FROM auth_links WHERE provider_subject = ?)")
        .bind(user.userId,id,data.name,data.city,"FH"+id.replaceAll("-","").slice(0,10).toUpperCase(),sponsor?.user_id ?? null,data.wantsFounder?1:0,"prelaunch-2026-10-v1",new Date().toISOString(),user.authMethod === "email" ? user.userId.replace(/^fh-email:/,"") : "").run();
      if (!inserted.meta.changes) return respond({error:"Tu acceso acaba de vincularse. Actualiza la página para continuar."},409);
      return respond({ok:true});
    }
    if (!own) return respond({error:"Completa primero tu registro gratuito."},409);
    if (data.action === "completeLesson") {
      if (!Object.hasOwn(correctAnswers,data.lessonId)) return respond({error:"Lección no disponible."},404);
      if (correctAnswers[data.lessonId] !== data.answer) return respond({error:"Revisa la lección y vuelve a intentarlo."},422);
      await db.prepare("INSERT INTO progress (user_id,lesson_id,completed_at) VALUES (?,?,?) ON CONFLICT(user_id,lesson_id) DO NOTHING")
        .bind(user.userId,data.lessonId,new Date().toISOString()).run();
      return respond({ok:true});
    }
    if (!user.isAdmin) return respond({error:"Solo administración puede aprobar fundadores."},403);
    const target=await db.prepare("SELECT user_id,founder FROM profiles WHERE public_id = ? AND wants_founder = 1").bind(data.publicId).first<{user_id:string;founder:number}>();
    if (!target) return respond({error:"Solicitud no encontrada."},404);
    if (target.founder) return respond({ok:true});
    const results=await db.batch([
      db.prepare("UPDATE profiles SET founder = 1 WHERE public_id = ? AND founder = 0 AND (SELECT COUNT(*) FROM profiles WHERE founder = 1) < 10").bind(data.publicId),
      db.prepare("INSERT INTO audit (id,actor_id,subject_id,action,created_at) SELECT ?,?,?,?,? WHERE changes() = 1")
        .bind(crypto.randomUUID(),user.userId,target.user_id,"approve_founder",new Date().toISOString()),
    ]);
    if (!results[0].meta.changes) return respond({error:"El Círculo Fundador ya tiene 10 integrantes aprobados."},409);
    return respond({ok:true});
  } catch { return respond({error:"No pudimos guardar el cambio. Intenta nuevamente."},503); }
}
