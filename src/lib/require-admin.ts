import "server-only";
import { redirect } from "next/navigation";
import { getAdminUser, type AdminUser } from "@/lib/auth";

// Use at the top of any protected admin page/action.
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return admin;
}
