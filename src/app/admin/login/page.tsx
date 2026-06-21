import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import AdminAuthForm from "@/components/AdminAuthForm";

export const metadata = { title: "Organizer Login" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const admin = await getAdminUser();
  if (admin) redirect("/admin");

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-pine-800">Organizer Login</h1>
        <p className="mt-1 text-pine-600">
          For trip organizers only. This area shows payments and ride tracking.
        </p>
      </div>
      <AdminAuthForm />
    </div>
  );
}
