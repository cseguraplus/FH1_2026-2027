export const emailProfileId = (subject:string) => `fh-email:${subject}`;

export async function linkedProfileId(db:D1Database,subject:string) {
  const link = await db.prepare("SELECT user_id FROM auth_links WHERE provider_subject = ?").bind(subject).first<{user_id:string}>();
  return link?.user_id ?? emailProfileId(subject);
}

export async function linkExistingProfile(db:D1Database,subject:string,legacyId:string) {
  const profile = await db.prepare("SELECT user_id FROM profiles WHERE user_id = ?").bind(legacyId).first();
  if (!profile) return {ok:false,status:409,error:"Esta cuenta anterior no tiene un perfil FH que vincular."};
  const existing = await db.prepare("SELECT provider_subject,user_id FROM auth_links WHERE provider_subject = ? OR user_id = ?").bind(subject,legacyId).all<{provider_subject:string;user_id:string}>();
  if (existing.results.some(row => row.provider_subject !== subject || row.user_id !== legacyId)) return {ok:false,status:409,error:"El perfil ya está vinculado a otro acceso. Contacta a administración."};
  if (existing.results.length) return {ok:true,status:200};
  const duplicate = await db.prepare("SELECT user_id FROM profiles WHERE user_id = ?").bind(emailProfileId(subject)).first();
  if (duplicate) return {ok:false,status:409,error:"El acceso por correo ya tiene un perfil. Contacta a administración para revisar la vinculación."};
  // Both identities are authenticated by the caller. No name/email matching,
  // account ID supplied by the browser, or reassignment of existing networks.
  const results=await db.batch([
    db.prepare("INSERT INTO auth_links (provider_subject,user_id,created_at) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = ?)").bind(subject,legacyId,new Date().toISOString(),emailProfileId(subject)),
    db.prepare("INSERT INTO audit (id,actor_id,subject_id,action,created_at) SELECT ?,?,?,?,? WHERE changes() = 1").bind(crypto.randomUUID(),legacyId,legacyId,"link_email_access",new Date().toISOString()),
  ]);
  if (!results[0].meta.changes) return {ok:false,status:409,error:"El acceso ya tiene un perfil. Contacta a administración para revisar la vinculación."};
  return {ok:true,status:200};
}
