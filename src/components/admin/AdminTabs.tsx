"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
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

// Runs before paint on the client (so the scroll is set with no visible bounce);
// falls back to useEffect on the server to avoid the SSR warning.
const useBrowserLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function AdminTabs() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Full-page nav remounts this with the scroller at the far left. Center the
  // active tab by setting scrollLeft directly, before paint — only the tab bar
  // moves (no page jump) and there's no animated bounce. Clamped so the ends
  // (Summary / Activities) sit flush instead of over-scrolling.
  useBrowserLayoutEffect(() => {
    const nav = navRef.current;
    const tab = activeRef.current;
    if (!nav || !tab) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const target =
      nav.scrollLeft + (tabRect.left - navRect.left) - (nav.clientWidth - tabRect.width) / 2;
    nav.scrollLeft = Math.max(0, target);
  }, []);

  return (
    <nav ref={navRef} className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
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
