"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode="signup"|"signin"|"recover"|"password"|"link";
type AccessStatus={email:string|null;canLink:boolean;legacyName?:string|null};
export default function AccessForm({configured}:{configured:boolean}) {
  const [mode,setMode]=useState<Mode>("signup"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
  const [visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[next,setNext]=useState("/"),[sponsor,setSponsor]=useState("");
  const [notice,setNotice]=useState<{text:string;error:boolean}|null>(null),[status,setStatus]=useState<AccessStatus>({email:null,canLink:false});
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const selected=params.get("mode");
    if(selected&&["signup","signin","recover","password","link"].includes(selected))setMode(selected as Mode);
    const destination=params.get("next")??"/";setNext(destination);
    try {setSponsor(new URL(destination,window.location.origin).searchParams.get("ref")?.slice(0,24)??"");}catch{}
    if(params.has("error"))setNotice({text:"El enlace no es válido o ya venció. Solicita otro y ábrelo en este mismo navegador.",error:true});
    if(params.has("changed"))setNotice({text:"Tu contraseña cambió. Inicia sesión con la nueva.",error:false});
    if(configured)void fetch("/api/auth",{cache:"no-store"}).then(async r=>{if(r.ok)setStatus(await r.json());}).catch(()=>{});
  },[configured]);
  function select(value:Mode){setMode(value);setPassword("");setConfirm("");setNotice(null);}
  async function send(action:string,fields:Record<string,unknown>={}){
    setBusy(true);setNotice(null);
    try{
      const response=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...fields})});
      const result=await response.json() as {error?:string;message?:string;next?:string};
      if(!response.ok)throw new Error(result.error??"No pudimos completar la solicitud.");
      if(action==="link"){window.location.assign("/");return;}
      if(result.next){window.location.assign(result.next);return;}
      setPassword("");setConfirm("");setNotice({text:result.message??"Listo.",error:false});
    }catch(error){setNotice({text:error instanceof Error?error.message:"No pudimos completar la solicitud.",error:true});}
    finally{setBusy(false);}
  }
  const loginMode=mode==="link"?"signin":mode;
  const title=mode==="recover"?"Recupera tu acceso.":mode==="password"?"Elige una nueva contraseña.":mode==="link"?"Conserva tu organización.":mode==="signin"?"Qué gusto verte de nuevo.":"Tu siguiente paso empieza aquí.";
  const legacyReturn="/signin-with-chatgpt?return_to="+encodeURIComponent("/acceso?mode=link");
  return <main className="access-page">
    <section className="access-story">
      <Link href="/" className="access-logo"><img src="/brand/fh-logo-pine.svg" width={850} height={198} alt="F Health"/></Link>
      <div><p className="eyebrow">F HEALTH · MÉXICO</p><h1>Aprende.<br/>Comparte.<br/><strong>Crece.</strong></h1><p>Una cuenta para tu formación, tus invitaciones y la comunidad que estás construyendo.</p></div>
      <ul><li><CheckCircle2 size={21}/> Registro gratuito</li><li><CheckCircle2 size={21}/> Tu progreso, en un solo lugar</li><li><CheckCircle2 size={21}/> Tu enlace y tu organización</li></ul>
    </section>
    <section className="access-panel" aria-labelledby="access-title">
      <Link className="text-link access-back" href="/">Volver a F Health</Link>
      <div className="access-card">
        <span className="access-mark"><LockKeyhole size={25}/></span>
        <p className="eyebrow">TU CUENTA F HEALTH</p><h2 id="access-title">{title}</h2>
        <p>{mode==="link"?"Vincula tu perfil existente a tu correo. Conservaremos tu organización, enlace y avance.":mode==="recover"?"Te enviaremos un enlace para crear una nueva contraseña.":mode==="password"?"Usa una frase larga que recuerdes y que no utilices en otros sitios.":"Entra con tu correo y contraseña."}</p>
        {!configured&&<div className="access-message" role="status"><Mail size={21}/><p>Estamos habilitando el acceso por correo. Tu acceso actual sigue disponible en la página principal.</p></div>}
        {notice&&<div className={`access-message ${notice.error?"error":""}`} role={notice.error?"alert":"status"}><p>{notice.text}</p></div>}
        {mode==="link"&&status.canLink?<div className="access-link-confirm"><ShieldCheck size={28}/><h3>{status.legacyName}</h3><p>Tu perfil quedará vinculado a <strong>{status.email}</strong>.</p><Button disabled={busy||!configured} className="wide" onClick={()=>void send("link")}>{busy?<Loader2 className="spin" size={18}/>:"Vincular mi perfil existente"}</Button></div>:<>
          {(mode==="signup"||mode==="signin")&&<Tabs value={mode} onValueChange={value=>select(value as Mode)}><TabsList className="access-tabs"><TabsTrigger value="signup">Crear cuenta</TabsTrigger><TabsTrigger value="signin">Iniciar sesión</TabsTrigger></TabsList></Tabs>}
          {sponsor&&<p className="ref-note">Invitación: <strong>{sponsor}</strong></p>}
          <form className="access-form" onSubmit={event=>{
            event.preventDefault();
            if((loginMode==="signup"||mode==="password")&&password!==confirm){setNotice({text:"Las contraseñas no coinciden.",error:true});return;}
            const target=mode==="link"?"/acceso?mode=link":next;
            void send(loginMode,mode==="recover"?{email}:mode==="password"?{password}:{email,password,next:target});
          }}>
            {mode!=="password"&&<><label htmlFor="access-email">Correo electrónico</label><input id="access-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} placeholder="nombre@correo.com" disabled={busy}/></>}
            {mode!=="recover"&&<><label htmlFor="access-password">{mode==="password"?"Nueva contraseña":"Contraseña"}</label><div className="access-password"><input id="access-password" type={visible?"text":"password"} autoComplete={loginMode==="signin"?"current-password":"new-password"} required minLength={loginMode==="signin"?1:12} maxLength={128} value={password} onChange={event=>setPassword(event.target.value)} disabled={busy} aria-describedby={loginMode!=="signin"?"password-hint":undefined}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?"Ocultar contraseña":"Mostrar contraseña"}>{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>{loginMode!=="signin"&&<small id="password-hint">Al menos 12 caracteres. Puedes usar una frase.</small>}</>}
            {(loginMode==="signup"||mode==="password")&&<><label htmlFor="access-confirm">Confirma la contraseña</label><input id="access-confirm" type={visible?"text":"password"} autoComplete="new-password" required minLength={12} maxLength={128} value={confirm} onChange={event=>setConfirm(event.target.value)} disabled={busy}/></>}
            <Button type="submit" className="wide" disabled={!configured||busy}>{busy?<><Loader2 className="spin" size={18}/>Un momento…</>:mode==="recover"?"Enviar enlace":mode==="password"?"Guardar contraseña":loginMode==="signin"?"Entrar a mi cuenta":"Crear mi cuenta gratuita"}</Button>
          </form>
          {loginMode==="signin"&&<button type="button" className="text-link access-secondary" onClick={()=>select("recover")}>Olvidé mi contraseña</button>}
          {mode==="recover"&&<button type="button" className="text-link access-secondary" onClick={()=>select("signin")}>Volver al inicio de sesión</button>}
          {mode==="link"&&<div className="access-existing"><p>Primero entra con tu nueva cuenta de correo. Después confirma tu acceso anterior para vincular ambos.</p><a href={legacyReturn} target="_top" className="text-link">Confirmar mi perfil anterior</a><button type="button" className="text-link access-secondary" onClick={()=>{select("signup");setNext("/acceso?mode=link");}}>Crear mi acceso por correo</button></div>}
        </>}
        {mode!=="link"&&<div className="access-existing"><p>¿Ya tienes una organización en FH?</p><a href="/acceso?mode=link" className="text-link">Vincular mi perfil existente</a></div>}
        <p className="access-privacy"><ShieldCheck size={17}/>Tu correo y contraseña no se muestran a tu organización.</p>
      </div>
    </section>
  </main>;
}
