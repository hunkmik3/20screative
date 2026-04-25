import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import AdminUploader from "./AdminUploader";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!verifyToken(token)) {
    redirect("/admin/login");
  }
  return <AdminUploader />;
}
