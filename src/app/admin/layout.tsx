import { getAdminUser } from "@/lib/auth";
import AdminTabs from "@/components/admin/AdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();

  // Login page renders without the admin chrome.
  if (!admin) return <>{children}</>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-brand-800">Organizer Dashboard</h1>

      <AdminTabs />

      {children}
    </div>
  );
}
