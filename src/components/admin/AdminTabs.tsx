"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";

const TABS = [
  { href: "/admin/ar", label: "AR" },
  { href: "/admin/cabins", label: "Cabins" },
  { href: "/admin/fishing", label: "Fishing" },
  { href: "/admin/rides", label: "Rides" },
  { href: "/admin/summary", label: "Summary" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
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
          </Link>
        );
      })}
    </nav>
  );
}
