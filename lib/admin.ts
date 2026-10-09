type Principal = {userId:string;email:string};
const OWNER_EMAIL = "servivomx@gmail.com";

export async function isSiteAdmin(db:D1Database,user:Principal):Promise<boolean> {
  const read=()=>db.prepare("SELECT user_id FROM site_admin WHERE role = 'owner'").first<{user_id:string}>();
  let owner=await read();
  // Only the known, platform-authenticated owner's email can bootstrap this
  // binding. Once established, email changes never grant or transfer the role.
  if (!owner && user.email.toLowerCase()===OWNER_EMAIL) {
    await db.prepare("INSERT INTO site_admin (role,user_id,bound_at) VALUES ('owner',?,?) ON CONFLICT(role) DO NOTHING")
      .bind(user.userId,new Date().toISOString()).run();
    owner=await read();
  }
  return owner?.user_id===user.userId;
}
