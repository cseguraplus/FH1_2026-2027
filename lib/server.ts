import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isSiteAdmin } from "@/lib/admin";
import { createEmailAuth, verifiedEmailUser } from "@/lib/email-auth";
import { linkedProfileId } from "@/lib/account-link";
export async function authorize(request?:Request) {
  const auth = request ? createEmailAuth(request) : null;
  const apply = (response:Response) => auth ? auth.apply(response) : response;
  if (auth?.hasSessionCookie) {
    const emailUser = await verifiedEmailUser(auth);
    if (!emailUser) return {user:null,apply};
    const userId = await linkedProfileId(database(),emailUser.id);
    // Email can never bootstrap administration. Only an already-bound FH ID
    // retains that role after an explicitly verified account link.
    const owner = await database().prepare("SELECT user_id FROM site_admin WHERE role = 'owner'").first<{user_id:string}>();
    return {user:{userId,email:emailUser.email!,fullName:null,isAdmin:owner?.user_id === userId,authMethod:"email" as const},apply};
  }
  const user = await getChatGPTUser();
  return {user:user ? {...user,isAdmin:await isSiteAdmin(database(),user,env.FH_OWNER_EMAIL),authMethod:"legacy" as const} : null,apply};
}
export function database() {
  if (!env.DB) throw new Error("La base de datos no está disponible.");
  return env.DB;
}
export function json(data:unknown,status=200,extraHeaders:Record<string,string>={}) {
  return Response.json(data,{status,headers:{
    "Cache-Control":"private, no-store, max-age=0",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer",
    "Cross-Origin-Resource-Policy":"same-origin",
    "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
    ...extraHeaders,
  }});
}
export type Profile = {user_id:string;public_id:string;name:string;city:string;referral_code:string;sponsor_id:string|null;wants_founder:number;founder:number;created_at:string};
export const correctAnswers:Record<string,number> = {bienvenida:1,producto:2,invitacion:0,acompanamiento:1,comisiones:2,finanzas:0};
