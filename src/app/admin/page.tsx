import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

// The Organizer area opens on AR; /admin just forwards there.
export default async function AdminIndexPage() {
  await requireAdmin();
  redirect("/admin/ar");
}
