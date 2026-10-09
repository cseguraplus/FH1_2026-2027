import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { createEmailAuth, safeAuthNext, verifiedEmailUser } from "@/lib/email-auth";
import { linkExistingProfile } from "@/lib/account-link";
import { database, json } from "@/lib/server";
import { consumeLimit } from "@/lib/rate-limit";
import { readBoundedJson, RequestBodyError } from "@/lib/request-body";
export const dynamic = "force-dynamic";

const email = z.string().trim().email().max(254).transform(value=>value.toLowerCase());
const newPassword = z.string().min(12).max(128);
const schema = z.discriminatedUnion("action",[
  z.object({action:z.literal("signup"),email,password:newPassword,next:z.string().max(800).optional()}).strict(),
  z.object({action:z.literal("signin"),email,password:z.string().min(1).max(128),next:z.string().max(800).optional()}).strict(),
  z.object({action:z.literal("recover"),email}).strict(),
  z.object({action:z.literal("password"),password:newPassword}).strict(),
  z.object({action:z.literal("signout")}).strict(),
  z.object({action:z.literal("link")}).strict(),
]);

export async function GET(request:Request) {
  try {
    const auth=createEmailAuth(request);
    if (!auth) return json({configured:false,email:null,canLink:false});
    const user=auth.hasSessionCookie ? await verifiedEmailUser(auth) : null;
    const legacy=await getChatGPTUser();
    const profile=legacy ? await database().prepare("SELECT name FROM profiles WHERE user_id = ?").bind(legacy.userId).first<{name:string}>() : null;
    return auth.apply(json({configured:true,email:user?.email ?? null,canLink:!!(user&&profile),legacyName:user&&profile ? profile.name : null}));
  } catch { return json({error:"No pudimos comprobar tu acceso. Intenta nuevamente."},503); }
}

export async function POST(request:Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({error:"Origen de solicitud no válido."},403);
  let respond=json;
  try {
    const auth=createEmailAuth(request);
    if (!auth) return json({error:"El acceso por correo todavía no está disponible. Conserva tu acceso actual."},503);
    respond=(data,status=200,headers={})=>auth.apply(json(data,status,headers));
    // The global quota remains effective even if a proxy doesn't forward a
    // trustworthy client IP. Account quotas add a separate guessing boundary.
    const global=await consumeLimit(database(),"email-auth","authGlobal");
    const ip=request.headers.get("cf-connecting-ip");
    const perIp=ip ? await consumeLimit(database(),ip,"authIp") : global;
    if (!global.allowed || !perIp.allowed) return respond({error:"Espera unos minutos antes de volver a intentarlo."},429,{"Retry-After":String(Math.max(global.retryAfter,perIp.retryAfter))});
    const parsed=schema.safeParse(await readBoundedJson(request));
    if (!parsed.success) return respond({error:"Revisa el correo y los campos. La nueva contraseña debe tener entre 12 y 128 caracteres."},400);
    const input=parsed.data;
    if ("email" in input) {
      const limit=await consumeLimit(database(),input.email,"auth");
      if (!limit.allowed) return respond({error:"Espera unos minutos antes de volver a intentarlo."},429,{"Retry-After":String(limit.retryAfter)});
    }
    if (input.action === "signup") {
      const next=safeAuthNext(input.next);
      const callback=new URL("/auth/callback",request.url); callback.searchParams.set("next",next);
      const {data,error}=await auth.client.auth.signUp({email:input.email,password:input.password,options:{emailRedirectTo:callback.toString()}});
      if (error) return respond({error:"No pudimos iniciar el registro. Intenta más tarde o recupera el acceso si ya tienes cuenta."},400);
      // Email confirmation must stay enabled in the provider configuration.
      // Even a misconfigured provider cannot grant an unverified profile.
      if (data.session && !data.user?.email_confirmed_at) await auth.client.auth.signOut({scope:"local"});
      return respond({ok:true,message:"Revisa tu correo para confirmar tu cuenta. Abre el enlace en este mismo navegador. Si ya tienes cuenta, inicia sesión o recupera tu contraseña."});
    }
    if (input.action === "signin") {
      const {error}=await auth.client.auth.signInWithPassword({email:input.email,password:input.password});
      const user=error ? null : await verifiedEmailUser(auth);
      if (!user) return respond({error:"No pudimos iniciar sesión. Revisa tus datos y confirma tu correo."},401);
      return respond({ok:true,next:safeAuthNext(input.next)});
    }
    if (input.action === "recover") {
      const callback=new URL("/auth/callback",request.url); callback.searchParams.set("next","/acceso?mode=password");
      const {error}=await auth.client.auth.resetPasswordForEmail(input.email,{redirectTo:callback.toString()});
      if (error) return respond({error:"No pudimos procesar la solicitud. Intenta más tarde."},503);
      return respond({ok:true,message:"Si el correo corresponde a una cuenta, recibirás un enlace para cambiar tu contraseña. Ábrelo en este mismo navegador."});
    }
    if (input.action === "signout") {
      const {error}=await auth.client.auth.signOut({scope:"local"});
      if (error) return respond({error:"No pudimos cerrar la sesión. Intenta nuevamente."},503);
      // Also close any old Sites session so it cannot silently sign the user
      // back into their legacy profile after the email session ends.
      const legacy=await getChatGPTUser();
      return respond({ok:true,next:legacy?"/signout-with-chatgpt?return_to=%2F":"/"});
    }
    const user=await verifiedEmailUser(auth);
    if (!user) return respond({error:"Inicia sesión para continuar."},401);
    const limit=await consumeLimit(database(),user.id,"write");
    if (!limit.allowed) return respond({error:"Espera un momento e inténtalo de nuevo."},429,{"Retry-After":String(limit.retryAfter)});
    if (input.action === "password") {
      const {error}=await auth.client.auth.updateUser({password:input.password});
      if (error) return respond({error:"No pudimos cambiar la contraseña. Solicita un enlace nuevo e inténtalo otra vez."},400);
      const {error:logoutError}=await auth.client.auth.signOut({scope:"global"});
      if (logoutError) return respond({error:"La contraseña cambió, pero no pudimos cerrar las demás sesiones. Vuelve a iniciar sesión y revisa tu acceso."},503);
      return respond({ok:true,next:"/acceso?mode=signin&changed=1"});
    }
    const legacy=await getChatGPTUser();
    if (!legacy) return respond({error:"Abre primero tu acceso anterior para verificar que el perfil te pertenece."},401);
    const result=await linkExistingProfile(database(),user.id,legacy.userId);
    return respond(result,result.status);
  } catch (error) {
    if (error instanceof RequestBodyError) return respond({error:error.message},error.status);
    return respond({error:"No pudimos completar la solicitud. Intenta nuevamente."},503);
  }
}
