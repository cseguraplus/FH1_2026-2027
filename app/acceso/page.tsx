import type { Metadata } from "next";
import AccessForm from "./access-form";
import { emailAuthConfig } from "@/lib/email-auth";
export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"Tu cuenta · F Health",robots:{index:false,follow:false}};
export default function AccessPage() {
  return <AccessForm configured={!!emailAuthConfig()}/>;
}
