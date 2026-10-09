import { createEmailAuth, safeAuthNext, verifiedEmailUser } from "@/lib/email-auth";
export const dynamic = "force-dynamic";
export async function GET(request:Request) {
  const url=new URL(request.url);
  const fail=()=>Response.redirect(new URL("/acceso?error=link",url),303);
  let apply=(response:Response)=>response;
  try {
    const auth=createEmailAuth(request);
    if (!auth) return fail();
    apply=auth.apply;
    const code=url.searchParams.get("code");
    if (!code || code.length>2048) return apply(fail());
    const {error}=await auth.client.auth.exchangeCodeForSession(code);
    if (error || !await verifiedEmailUser(auth)) return apply(fail());
    return apply(Response.redirect(new URL(safeAuthNext(url.searchParams.get("next")),url),303));
  } catch { return apply(fail()); }
}
