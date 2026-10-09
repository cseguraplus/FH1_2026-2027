import { getChatGPTUser } from "./chatgpt-auth";
import Workspace from "./workspace";
import { emailAuthConfig } from "@/lib/email-auth";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user=await getChatGPTUser();
  return <Workspace initialSignedIn={!!user} accountName={user?.fullName ?? ""} emailAccess={!!emailAuthConfig()}/>;
}
