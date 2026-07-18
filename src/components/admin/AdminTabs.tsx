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

const NAV_ID = "admin-tabs-scroller";
const SCROLL_KEY = "adminTabsScroll";

// Restores the tab bar's horizontal scroll DURING HTML parsing — before the
// first paint — on every full-page tab load, so the bar is already where the
// user left it and never visibly jumps/bounces afterward. (useLayoutEffect runs
// after the server-rendered paint, which is too late and causes the bounce.)
const RESTORE_SCRIPT =
  `try{var e=document.getElementById(${JSON.stringify(NAV_ID)}),` +
  `v=sessionStorage.getItem(${JSON.stringify(SCROLL_KEY)});` +
  `if(e&&v)e.scrollLeft=+v;}catch(_){}`;

export default function AdminTabs() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // Save the scroll position as the user scrolls, so the inline restore script
  // can put it back on the next tab load.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(nav.scrollLeft));
      } catch {
        /* ignore */
      }
    };
    nav.addEventListener("scroll", onScroll, { passive: true });
    return () => nav.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        id={NAV_ID}
        ref={navRef}
        className="-mx-4 flex gap-1 overflow-x-auto px-4 py-1.5"
      >
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            // Full-page load (plain <a>), not client-side routing, so the tab
            // opens from the service-worker cache offline with no RSC fetch.
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
      {/* Positioned right after the bar so it runs as soon as the bar is parsed. */}
      <script dangerouslySetInnerHTML={{ __html: RESTORE_SCRIPT }} />
    </>
  );
}
