"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";

const TABS = [
  { href: "/admin/summary", label: "Summary" },
  { href: "/admin/ar", label: "AR" },
  { href: "/admin/coffee", label: "Coffee" },
  { href: "/admin/rides", label: "Rides" },
  { href: "/admin/cabins", label: "Cabins" },
  { href: "/admin/fishing", label: "Fishing" },
  { href: "/admin/volunteers", label: "Volunteers" },
  { href: "/admin/activities", label: "Activities" },
];

export default function AdminTabs() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Full-page nav remounts this and resets the scroll to the left; bring the
  // active tab back into view so it stays put (e.g. Activities on the right).
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, []);

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
            ref={active ? activeRef : undefined}
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
