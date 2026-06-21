import Link from "next/link";
import { getAdminUser } from "@/lib/auth";
import { signOut } from "@/app/admin/auth-actions";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/roster", label: "Roster" },
  { href: "/admin/cabins", label: "Cabins" },
  { href: "/admin/fishing", label: "Fishing" },
  { href: "/admin/rides", label: "Rides" },
];

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-pine-800">Organizer Dashboard</h1>
          <p className="text-xs text-pine-500">{admin.email}</p>
        </div>
        <form action={signOut}>
          <button className="btn-secondary text-sm">Sign out</button>
        </form>
      </div>

      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-sm font-medium text-pine-700 ring-1 ring-pine-100 hover:bg-pine-50"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
