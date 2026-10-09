type Principal = {userId:string;email:string};

export async function isSiteAdmin(db:D1Database,user:Principal,ownerEmail?:string):Promise<boolean> {
  const read=()=>db.prepare("SELECT user_id FROM site_admin WHERE role = 'owner'").first<{user_id:string}>();
  let owner=await read();
  // Only the known, platform-authenticated owner's email can bootstrap this
  // binding. Sin FH_OWNER_EMAIL configurado nadie puede crearlo. Once established, email changes never grant or transfer the role.
  if (!owner && ownerEmail && user.email.toLowerCase()===ownerEmail.trim().toLowerCase()) {
    await db.prepare("INSERT INTO site_admin (role,user_id,bound_at) VALUES ('owner',?,?) ON CONFLICT(role) DO NOTHING")
      .bind(user.userId,new Date().toISOString()).run();
    owner=await read();
  }
  return owner?.user_id===user.userId;
}
