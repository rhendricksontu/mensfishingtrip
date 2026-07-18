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

  // Full-page tab nav resets the scroller to the left. Instead of correcting to
  // the active tab, just keep the bar wherever the user left it: restore the
  // saved position before paint (no bounce) and save it as they scroll.
  useBrowserLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const KEY = "adminTabsScroll";
    const saved = sessionStorage.getItem(KEY);
    if (saved !== null) nav.scrollLeft = Number(saved) || 0;
    const onScroll = () => sessionStorage.setItem(KEY, String(nav.scrollLeft));
    nav.addEventListener("scroll", onScroll, { passive: true });
    return () => nav.removeEventListener("scroll", onScroll);
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
