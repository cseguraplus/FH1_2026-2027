import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

// Exercise the actual API handlers and their SQL against an isolated SQLite
// database. Only the Sites identity boundary and D1 transport are simulated.
const root=resolve(import.meta.dirname,"..");
const require=createRequire(import.meta.url);
const origin="https://www.fhealth.mx";
const candidate="00000000-0000-4000-8000-000000000007";
function setup(t,{emailAuth=false}={}) {
  const sqlite=new DatabaseSync(":memory:");
  t.after(()=>sqlite.close());
  for(const file of readdirSync(resolve(root,"drizzle")).filter(f=>f.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(resolve(root,"drizzle",file),"utf8"));
  }
  sqlite.exec("ALTER TABLE profiles ADD COLUMN private_note TEXT DEFAULT 'INTERNAL_ONLY'");
  const insert=sqlite.prepare("INSERT INTO profiles (user_id,public_id,name,city,referral_code,sponsor_id,wants_founder,founder,consent_version,created_at) VALUES (?,?,?,?,?,?,?,0,'test','2026-10-05')");
  for (const [index,id,sponsor,wants] of [[1,"owner",null,0],[2,"a",null,0],[3,"a1","a",0],[4,"a2","a1",0],[5,"a3","a2",0],[6,"a4","a3",0],[7,"b",null,1],[8,"b1","b",0]]) {
    insert.run(id,`00000000-0000-4000-8000-${String(index).padStart(12,"0")}`,id,"Ciudad de prueba",`REF${id}`,sponsor,wants);
  }
  sqlite.exec("INSERT INTO progress VALUES ('a','bienvenida','2026-10-05'),('b','producto','2026-10-05')");
  let user=null,emailUser=null,batchTail=Promise.resolve();
  const authCalls=[];
  const adapter={
    prepare(sql) {
      function statement(params=[]) {
        return {
          bind(...values) { return statement(values); },
          async first() { return sqlite.prepare(sql).get(...params)??null; },
          async all() { return {results:sqlite.prepare(sql).all(...params)}; },
          async run() { return {meta:{changes:Number(sqlite.prepare(sql).run(...params).changes)}}; },
          async execute() { return /^\s*(SELECT|WITH)/i.test(sql)||/\bRETURNING\b/i.test(sql)?this.all():this.run(); },
        };
      }
      return statement();
    },
    batch(statements) {
      const operation=batchTail.then(async()=>{
        sqlite.exec("BEGIN");
        try { const results=[];for(const s of statements)results.push(await s.execute());sqlite.exec("COMMIT");return results; }
        catch(error) { sqlite.exec("ROLLBACK");throw error; }
      });
      batchTail=operation.catch(()=>{});
      return operation;
    },
  };
  const cache=new Map();
  function load(file) {
    if(cache.has(file))return cache.get(file).exports;
    const module={exports:{}};cache.set(file,module);
    const code=ts.transpileModule(readFileSync(resolve(root,file),"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
    const dependency=(id)=>{
      if(id==="cloudflare:workers")return {env:{DB:adapter,FH_OWNER_EMAIL:"servivomx@gmail.com",...(emailAuth?{FH_AUTH_MODE:"email",SUPABASE_URL:"https://auth.example.test",SUPABASE_PUBLISHABLE_KEY:"test-publishable-key"}:{})}};
      if(id==="@/app/chatgpt-auth")return {getChatGPTUser:async()=>user};
      if(id==="@supabase/ssr")return {...require(id),createServerClient:(_url,_key,options)=>{
        const cookie=(value)=>options.cookies.setAll([{name:"fh-auth",value,options:{httpOnly:true,secure:true,sameSite:"lax",path:"/",...(value?{}:{maxAge:0})}}]);
        return {auth:{
          async getUser(){authCalls.push({action:"verify"});return {data:{user:emailUser},error:null};},
          async getSession(){throw new Error("Never trust an unverified cookie session");},
          async signUp(input){authCalls.push({action:"signup",callback:input.options.emailRedirectTo});return {data:{session:null,user:null},error:null};},
          async signInWithPassword(){authCalls.push({action:"signin"});cookie("provider-session");return {error:emailUser?null:{status:401}};},
          async resetPasswordForEmail(_email,options){authCalls.push({action:"recover",callback:options.redirectTo});return {error:null};},
          async updateUser(){authCalls.push({action:"password"});return {error:null};},
          async signOut({scope}){authCalls.push({action:"signout",scope});cookie("");return {error:null};},
          async exchangeCodeForSession(code){authCalls.push({action:"exchange"});if(code!=="valid-code")return {error:{status:400}};cookie("provider-session");return {error:null};},
        }};
      }};
      if(id.startsWith("@/"))return load(id.slice(2)+".ts");
      return require(id);
    };
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})(dependency,module,module.exports);
    return module.exports;
  }
  return {
    sqlite,
    login(id,email=`${id}@example.test`) { user=id?{userId:id,email,displayName:id,fullName:id}:null; },
    emailLogin(id,email=`${id}@example.test`,confirmed=true){emailUser=id?{id,email,email_confirmed_at:confirmed?"2026-10-06":null}:null;},
    authCalls,
    get:load("app/api/state/route.ts").GET,
    post:load("app/api/actions/route.ts").POST,
    authGet:load("app/api/auth/route.ts").GET,
    authPost:load("app/api/auth/route.ts").POST,
    callback:load("app/auth/callback/route.ts").GET,
    safeNext:load("lib/email-auth.ts").safeAuthNext,
    limit:(id,scope,now)=>load("lib/rate-limit.ts").consumeLimit(adapter,id,scope,now),
    reloadLimit:()=>cache.delete("lib/rate-limit.ts"),
  };
}
function request(payload,headers={}) {
  return new Request(origin+"/api/actions",{method:"POST",headers:{origin,"content-type":"application/json",...headers},body:typeof payload==="string"?payload:JSON.stringify(payload)});
}
const registration={action:"register",name:"Persona de prueba",city:"",sponsorCode:"",consent:true,wantsFounder:false};

test("anonymous API reads and writes are denied",async t=>{
  const app=setup(t);
  assert.equal((await app.get()).status,401);
  assert.equal((await app.post(request(registration))).status,401);
});
test("member sees only own profile, progress and first three descendant levels",async t=>{
  const app=setup(t);app.login("a");
  const data=await (await app.get()).json();
  assert.equal(data.profile.name,"a");
  assert.deepEqual(data.network.map(p=>[p.name,p.depth]),[["a1",1],["a2",2],["a3",3]]);
  assert.deepEqual(data.progress.map(p=>p.lesson_id),["bienvenida"]);
  assert.deepEqual(data.applicants,[]);
});
test("unrelated branch cannot read other members or their progress",async t=>{
  const app=setup(t);app.login("b");
  const data=await (await app.get()).json();
  assert.deepEqual(data.network.map(p=>p.name),["b1"]);
  assert.deepEqual(data.progress.map(p=>p.lesson_id),["producto"]);
  assert.equal(data.sponsor,null);
});
test("private fields and future database columns never leave the profile API",async t=>{
  const app=setup(t);app.login("a1");
  const response=await app.get(),text=await response.text(),data=JSON.parse(text);
  assert.deepEqual(Object.keys(data.profile).sort(),["public_id","name","city","referral_code","wants_founder","founder","created_at"].sort());
  for(const field of ["user_id","sponsor_id","consent_version","private_note","INTERNAL_ONLY","@example.test"])assert.ok(!text.includes(field));
  assert.equal(response.headers.get("cache-control"),"private, no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"),"nosniff");
  assert.equal(response.headers.get("cross-origin-resource-policy"),"same-origin");
});
test("authenticated but unregistered visitors receive no member records",async t=>{
  const app=setup(t);app.login("new");
  const data=await (await app.get()).json();
  assert.equal(data.profile,null);
  assert.deepEqual([data.progress,data.network,data.applicants],[[],[],[]]);
});
test("non-admin cannot list candidates or approve a known candidate",async t=>{
  const app=setup(t);app.login("a");
  assert.deepEqual((await (await app.get()).json()).applicants,[]);
  assert.equal((await app.post(request({action:"approveFounder",publicId:candidate}))).status,403);
  assert.equal(app.sqlite.prepare("SELECT founder FROM profiles WHERE user_id='b'").get().founder,0);
});
test("administrator can review and approve with an audit record",async t=>{
  const app=setup(t);app.login("owner","servivomx@gmail.com");
  assert.deepEqual((await (await app.get()).json()).applicants.map(p=>p.name),["b"]);
  assert.equal((await app.post(request({action:"approveFounder",publicId:candidate}))).status,200);
  assert.equal(app.sqlite.prepare("SELECT founder FROM profiles WHERE user_id='b'").get().founder,1);
  assert.equal(app.sqlite.prepare("SELECT count(*) AS n FROM audit WHERE actor_id='owner' AND subject_id='b'").get().n,1);
});
test("cross-origin and missing-origin writes are rejected",async t=>{
  const app=setup(t);app.login("new");
  assert.equal((await app.post(request(registration,{origin:"https://unrelated.example"}))).status,403);
  const r=request(registration);r.headers.delete("origin");
  assert.equal((await app.post(r)).status,403);
});
test("unexpected identity or privilege fields are rejected",async t=>{
  const app=setup(t);app.login("new");
  assert.equal((await app.post(request({...registration,userId:"owner",isAdmin:true,founder:1}))).status,400);
  assert.equal(app.sqlite.prepare("SELECT count(*) AS n FROM profiles WHERE user_id='new'").get().n,0);
});
test("non-JSON and declared oversized requests are rejected",async t=>{
  const app=setup(t);app.login("new");
  assert.equal((await app.post(request(registration,{"content-type":"text/plain"}))).status,415);
  assert.equal((await app.post(request(registration,{"content-length":"5001"}))).status,413);
});
test("streaming body is stopped at the byte limit without content-length",async t=>{
  const app=setup(t);app.login("new");let cancelled=false;
  const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(5001));},cancel(){cancelled=true;}});
  const r=new Request(origin+"/api/actions",{method:"POST",headers:{origin,"content-type":"application/json"},body,duplex:"half"});
  assert.equal((await app.post(r)).status,413);assert.equal(cancelled,true);
});
test("SQL-like inputs remain data and cannot choose another account",async t=>{
  const app=setup(t);app.login("new");
  const name="Prueba '); DROP TABLE profiles; --";
  assert.equal((await app.post(request({...registration,name}))).status,200);
  assert.equal(app.sqlite.prepare("SELECT name FROM profiles WHERE user_id='new'").get().name,name);
  assert.equal(app.sqlite.prepare("SELECT count(*) AS n FROM profiles").get().n,9);
});
test("lesson writes belong to current user and cannot target a different identity",async t=>{
  const app=setup(t);app.login("a");
  assert.equal((await app.post(request({action:"completeLesson",lessonId:"producto",answer:2,userId:"b"}))).status,400);
  assert.equal((await app.post(request({action:"completeLesson",lessonId:"producto",answer:2}))).status,200);
  assert.equal(app.sqlite.prepare("SELECT count(*) AS n FROM progress WHERE user_id='b'").get().n,1);
  assert.equal(app.sqlite.prepare("SELECT count(*) AS n FROM progress WHERE user_id='a'").get().n,2);
});
test("database failures do not disclose SQL or private information",async t=>{
  const app=setup(t);app.login("a");app.sqlite.exec("DROP TABLE audit;DROP TABLE progress;DROP TABLE profiles;");
  const response=await app.get();assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{error:"No pudimos cargar tu espacio. Intenta nuevamente."});
});

test("only the known authenticated owner can establish the admin binding",async t=>{
  const app=setup(t);app.login("a");
  assert.equal((await (await app.get()).json()).isAdmin,false);
  assert.equal(app.sqlite.prepare("SELECT count(*) AS n FROM site_admin").get().n,0);
  app.login("owner","servivomx@gmail.com");
  assert.equal((await (await app.get()).json()).isAdmin,true);
  assert.equal(app.sqlite.prepare("SELECT user_id FROM site_admin WHERE role='owner'").get().user_id,"owner");
});
test("email cannot transfer an established administrative role",async t=>{
  const app=setup(t);app.login("owner","servivomx@gmail.com");await app.get();
  app.login("a","servivomx@gmail.com");
  assert.equal((await (await app.get()).json()).isAdmin,false);
  assert.equal((await app.post(request({action:"approveFounder",publicId:candidate}))).status,403);
  app.login("owner","changed@example.test");
  assert.equal((await (await app.get()).json()).isAdmin,true);
});
test("concurrent requests cannot exceed a persistent per-account quota",async t=>{
  const app=setup(t);
  const decisions=await Promise.all(Array.from({length:35},()=>app.limit("burst-account","write",1000)));
  assert.equal(decisions.filter(r=>r.allowed).length,30);
  app.reloadLimit();
  assert.equal((await app.limit("burst-account","write",1001)).allowed,false);
  assert.equal((await app.limit("other-account","write",1001)).allowed,true);
  assert.equal((await app.limit("burst-account","read",1001)).allowed,true);
});
test("quotas reopen at expiration without locking the account",async t=>{
  const app=setup(t);
  for(let i=0;i<5;i++)assert.equal((await app.limit("new","register",1000)).allowed,true);
  const blocked=await app.limit("new","register",1001);
  assert.equal(blocked.allowed,false);assert.equal(blocked.retryAfter,900);
  assert.equal((await app.limit("new","register",901000)).allowed,true);
});
test("rate counters do not store raw account identifiers and expired counters are removed",async t=>{
  const app=setup(t);
  await app.limit("sensitive-user-id","read",1000);
  const row=app.sqlite.prepare("SELECT * FROM request_limits").get();
  assert.match(row.key,/^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(row).includes("sensitive-user-id"));
  app.sqlite.prepare("INSERT INTO request_limits VALUES ('expired',1,1)").run();
  await app.limit("active","read",90_000_000);
  assert.equal(app.sqlite.prepare("SELECT count(*) AS n FROM request_limits WHERE key='expired'").get().n,0);
});
test("write API returns 429 and Retry-After even for repeated malformed bodies",async t=>{
  const app=setup(t);app.login("a");
  for(let i=0;i<30;i++)assert.equal((await app.post(request("invalid"))).status,400);
  const r=await app.post(request("invalid"));
  assert.equal(r.status,429);assert.ok(Number(r.headers.get("retry-after"))>0);
  assert.equal(r.headers.get("cache-control"),"private, no-store, max-age=0");
});
test("registration attempts are throttled without disclosing valid referral codes",async t=>{
  const app=setup(t);app.login("new");
  for(let i=0;i<5;i++)assert.equal((await app.post(request({...registration,sponsorCode:"INVALID"}))).status,400);
  assert.equal((await app.post(request(registration))).status,429);
  assert.equal(app.sqlite.prepare("SELECT count(*) AS n FROM profiles WHERE user_id='new'").get().n,0);
});
test("read API returns 429 when the authenticated account exceeds its quota",async t=>{
  const app=setup(t);app.login("a");
  for(let i=0;i<120;i++)assert.equal((await app.get()).status,200);
  const r=await app.get();assert.equal(r.status,429);assert.ok(Number(r.headers.get("retry-after"))>0);
});
test("unavailable quota or admin storage fails closed",async t=>{
  const app=setup(t);app.login("owner","servivomx@gmail.com");
  app.sqlite.exec("DROP TABLE request_limits");
  assert.equal((await app.get()).status,503);
  assert.equal((await app.post(request(registration))).status,503);
  app.sqlite.exec("DROP TABLE site_admin");
  assert.equal((await app.get()).status,503);
  assert.equal((await app.post(request({action:'approveFounder',publicId:candidate}))).status,503);
});

const emailRequest=(payload)=>request(payload,{cookie:"fh-auth=provider-session"});
test("email access fails closed while provider settings are absent",async t=>{
  const app=setup(t);
  assert.equal((await app.authPost(request({action:"signin",email:"a@example.test",password:"test-password"}))).status,503);
  assert.deepEqual(await (await app.authGet(new Request(origin+"/api/auth"))).json(),{configured:false,email:null,canLink:false});
});
test("forged or unverified email sessions cannot fall back to the owner's legacy session",async t=>{
  const app=setup(t,{emailAuth:true});app.login("owner","servivomx@gmail.com");
  assert.equal((await app.get(emailRequest({}))).status,401);
  app.emailLogin("external","servivomx@gmail.com",false);
  assert.equal((await app.get(emailRequest({}))).status,401);
  assert.equal(app.sqlite.prepare("SELECT count(*) n FROM site_admin").get().n,0);
});
test("a verified email matching the owner does not grant admin or existing profiles",async t=>{
  const app=setup(t,{emailAuth:true});app.emailLogin("external","servivomx@gmail.com");
  const state=await (await app.get(emailRequest({}))).json();
  assert.equal(state.isAdmin,false);assert.equal(state.profile,null);assert.deepEqual(state.network,[]);
  assert.equal(app.sqlite.prepare("SELECT count(*) n FROM site_admin").get().n,0);
  assert.ok(app.authCalls.some(call=>call.action==="verify"));
});
test("email registration preserves referral and exposes only the new owner's profile",async t=>{
  const app=setup(t,{emailAuth:true});app.emailLogin("new-email");
  app.sqlite.prepare("UPDATE profiles SET referral_code='REFA' WHERE user_id='a'").run();
  assert.equal((await app.post(emailRequest({...registration,sponsorCode:"REFa"}))).status,200);
  const state=await (await app.get(emailRequest({}))).json();
  assert.equal(state.profile.name,registration.name);assert.deepEqual(state.network,[]);assert.equal(state.authMethod,"email");
  assert.equal(app.sqlite.prepare("SELECT sponsor_id FROM profiles WHERE user_id='fh-email:new-email'").get().sponsor_id,"a");
});
test("linking requires both verified identities and never accepts a browser-selected target",async t=>{
  const app=setup(t,{emailAuth:true});app.emailLogin("new-email");
  assert.equal((await app.authPost(emailRequest({action:"link"}))).status,401);
  app.login("a");
  assert.equal((await app.authPost(emailRequest({action:"link",userId:"owner"}))).status,400);
  assert.equal(app.sqlite.prepare("SELECT count(*) n FROM auth_links").get().n,0);
});
test("verified account linking preserves the existing network, progress, code and identity",async t=>{
  const app=setup(t,{emailAuth:true});app.login("a");app.emailLogin("new-email");
  const before=app.sqlite.prepare("SELECT * FROM profiles WHERE user_id='a'").get();
  assert.equal((await app.authPost(emailRequest({action:"link"}))).status,200);
  app.login(null);
  const state=await (await app.get(emailRequest({}))).json();
  assert.equal(state.profile.referral_code,before.referral_code);assert.equal(state.profile.public_id,before.public_id);
  assert.deepEqual(state.network.map(row=>row.name),["a1","a2","a3"]);
  assert.deepEqual(state.progress.map(row=>row.lesson_id),["bienvenida"]);assert.deepEqual(state.applicants,[]);
  assert.equal(app.sqlite.prepare("SELECT count(*) n FROM profiles").get().n,8);
});
test("linking is idempotent and cannot reassign an already linked identity",async t=>{
  const app=setup(t,{emailAuth:true});app.login("a");app.emailLogin("new-email");
  assert.equal((await app.authPost(emailRequest({action:"link"}))).status,200);
  assert.equal((await app.authPost(emailRequest({action:"link"}))).status,200);
  app.login("b");assert.equal((await app.authPost(emailRequest({action:"link"}))).status,409);
  assert.equal(app.sqlite.prepare("SELECT count(*) n FROM audit WHERE action='link_email_access'").get().n,1);
});
test("an existing profile prompts linking instead of making a duplicate",async t=>{
  const app=setup(t,{emailAuth:true});app.login("a");app.emailLogin("new-email");
  assert.equal((await (await app.get(emailRequest({}))).json()).needsLink,true);
  assert.equal((await app.post(emailRequest(registration))).status,409);
  assert.equal(app.sqlite.prepare("SELECT count(*) n FROM profiles").get().n,8);
});
test("email login returns protected cookies and never returns tokens to browser JS",async t=>{
  const app=setup(t,{emailAuth:true});app.emailLogin("new-email");
  const response=await app.authPost(request({action:"signin",email:"new@example.test",password:"test-password",next:"/?ref=REFa"}));
  assert.equal(response.status,200);
  const cookie=response.headers.get("set-cookie");for(const flag of ["HttpOnly","Secure","SameSite=Lax"])assert.ok(cookie.includes(flag));
  assert.equal(response.headers.get("cache-control"),"private, no-store, max-age=0");
  assert.deepEqual(await response.json(),{ok:true,next:"/?ref=REFa"});
});
test("authentication rejects cross-origin requests before contacting the provider",async t=>{
  const app=setup(t,{emailAuth:true});
  assert.equal((await app.authPost(request({action:"recover",email:"a@example.test"},{origin:"https://evil.example"}))).status,403);
  assert.equal(app.authCalls.length,0);
});
test("callbacks preserve invitations and reject external or auth-loop destinations",async t=>{
  const app=setup(t,{emailAuth:true});
  for(const value of ["//evil.test","/\\evil.test","https://evil.test","/auth/callback","/signin-with-chatgpt","/api/actions"])assert.equal(app.safeNext(value),"/");
  assert.equal(app.safeNext("/?ref=REFa#inicio"),"/?ref=REFa#inicio");
  const signup=await app.authPost(request({action:"signup",email:"new@example.test",password:"a long test password",next:"/?ref=REFa"}));
  assert.equal(signup.status,200);
  assert.equal(new URL(app.authCalls.find(call=>call.action==="signup").callback).searchParams.get("next"),"/?ref=REFa");
  app.emailLogin("new-email");
  const callback=await app.callback(new Request(origin+"/auth/callback?code=valid-code&next=https%3A%2F%2Fevil.test"));
  assert.equal(callback.status,303);assert.equal(callback.headers.get("location"),origin+"/");
  assert.ok(callback.headers.get("set-cookie").includes("HttpOnly"));
});
test("recovery gives a generic response and never places tokens or emails in redirects",async t=>{
  const app=setup(t,{emailAuth:true});
  const response=await app.authPost(request({action:"recover",email:"unknown@example.test"}));
  assert.equal(response.status,200);assert.ok(!(await response.text()).includes("unknown@example.test"));
  assert.equal(new URL(app.authCalls[0].callback).searchParams.get("next"),"/acceso?mode=password");
});
test("password changes require authentication and sign out provider sessions globally",async t=>{
  const app=setup(t,{emailAuth:true});
  assert.equal((await app.authPost(emailRequest({action:"password",password:"another long test password"}))).status,401);
  app.emailLogin("new-email");
  assert.equal((await app.authPost(emailRequest({action:"password",password:"another long test password"}))).status,200);
  assert.ok(app.authCalls.some(call=>call.action==="signout"&&call.scope==="global"));
});
test("logout clears email cookies and also exits any remaining legacy session",async t=>{
  const app=setup(t,{emailAuth:true});app.emailLogin("new-email");app.login("a");
  const response=await app.authPost(emailRequest({action:"signout"}));
  assert.ok(response.headers.get("set-cookie").includes("Max-Age=0"));
  assert.equal((await response.json()).next,"/signout-with-chatgpt?return_to=%2F");
});
test("new email accounts sign out without navigating through ChatGPT",async t=>{
  const app=setup(t,{emailAuth:true});app.emailLogin("new-email");
  assert.equal((await (await app.authPost(emailRequest({action:"signout"}))).json()).next,"/");
});
