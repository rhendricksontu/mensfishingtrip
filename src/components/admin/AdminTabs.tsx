"use client";

import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";

const TABS = [
  { href: "/admin/summary", label: "Summary" },
  { href: "/admin/ar", label: "AR" },
  { href: "/admin/rides", label: "Rides" },
  { href: "/admin/cabins", label: "Cabins" },
  { href: "/admin/fishing", label: "Fishing" },
  { href: "/admin/volunteers", label: "Volunteers" },
  { href: "/admin/activities", label: "Activities" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          // Full-page load (plain <a>), not client-side routing, so the tab opens
          // from the service-worker cache offline with no RSC fetch to fail.
          <a
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={classNames(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ring-1",
              active
                ? "bg-brand-700 text-cream ring-brand-700"
                : "bg-white text-brand-700 ring-brand-100 hover:bg-brand-50"
            )}
          >
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
