import { env } from "cloudflare:workers";
import { createServerClient, parseCookieHeader, serializeCookieHeader, type CookieOptions } from "@supabase/ssr";

export const AUTH_COOKIE = "fh-auth";
export function emailAuthConfig() {
  const config = env as Cloudflare.Env;
  if (config.FH_AUTH_MODE !== "email" || !config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) return null;
  const url = new URL(config.SUPABASE_URL);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/") throw new Error("Invalid authentication configuration");
  return { url: url.origin, key: config.SUPABASE_PUBLISHABLE_KEY };
}

// Only local product routes may be callback destinations. Never accept an origin
// or redirect back into the authentication callback itself.
export function safeAuthNext(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://fh.invalid");
    if (url.origin !== "https://fh.invalid" || !["/", "/acceso"].includes(url.pathname)) return "/";
    return url.pathname + url.search + url.hash;
  } catch { return "/"; }
}

export function createEmailAuth(request: Request) {
  const config = emailAuthConfig();
  if (!config) return null;
  const incoming = parseCookieHeader(request.headers.get("cookie") ?? "").map(c => ({name:c.name,value:c.value ?? ""}));
  const pending = new Map<string, {name:string;value:string;options:CookieOptions}>();
  // One client per request. Tokens stay in HttpOnly cookies, never browser JS,
  // localStorage, application logs, Notion, or the profile database.
  const client = createServerClient(config.url, config.key, {
    cookieOptions: {name:AUTH_COOKIE,path:"/",httpOnly:true,secure:new URL(request.url).protocol === "https:",sameSite:"lax"},
    cookies: {
      getAll: () => incoming,
      setAll: updates => {
        for (const update of updates) {
          pending.set(update.name, update);
          const old = incoming.find(c => c.name === update.name);
          if (old) old.value = update.value; else incoming.push({name:update.name,value:update.value});
        }
      },
    },
    auth: {autoRefreshToken:false,detectSessionInUrl:false},
  });
  return {
    client,
    hasSessionCookie: incoming.some(c => c.name === AUTH_COOKIE || /^fh-auth\.\d+$/.test(c.name)),
    apply(response:Response) {
      response=new Response(response.body,{status:response.status,statusText:response.statusText,headers:new Headers(response.headers)});
      for (const cookie of pending.values()) response.headers.append("Set-Cookie", serializeCookieHeader(cookie.name,cookie.value,cookie.options));
      response.headers.set("Cache-Control","private, no-store, max-age=0");
      response.headers.set("Vary","Cookie");
      response.headers.set("Referrer-Policy","no-referrer");
      return response;
    },
  };
}

export async function verifiedEmailUser(auth:NonNullable<ReturnType<typeof createEmailAuth>>) {
  const {data,error} = await auth.client.auth.getUser();
  if (error) {
    if (error.status === 400 || error.status === 401 || error.status === 403 || error.name === "AuthSessionMissingError") return null;
    throw new Error("Authentication unavailable");
  }
  if (!data.user?.id || !data.user.email || !data.user.email_confirmed_at) return null;
  return data.user;
}
