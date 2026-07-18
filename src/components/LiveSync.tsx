"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Long forms we never yank out from under someone.
const SKIP_PREFIXES = ["/rsvp", "/login", "/reset"];

function isEditing(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

// One coordinated loop for freshness + offline readiness:
//
//   When the app comes to the foreground (open / tab focus / reconnect):
//     1. refresh once  → pull the latest data
//     2. warm the cache → prepare every page/image for offline
//   Then it settles into normal operation: refresh every 10s (live updates)
//   and re-warm every 30s (keep the offline copy current).
//
// Guards: skip while hidden, offline, or mid-edit; form pages are skipped.
export default function LiveSync({
  enabled = true,
  routes = [],
  assets = [],
}: {
  enabled?: boolean;
  routes?: string[];
  assets?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const skip = SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!enabled || skip) return;
    let cancelled = false;
    // Tracked via events so we stop refreshing the instant the network drops,
    // not just on the next navigator.onLine read (which can lag/be unreliable).
    let online = navigator.onLine !== false;

    const refresh = () => {
      if (
        online &&
        navigator.onLine !== false &&
        document.visibilityState === "visible" &&
        !isEditing()
      ) {
        router.refresh();
      }
    };

    const hasCaches = typeof caches !== "undefined";
    // Fetch an immutable asset (chunk/image) only if it isn't already cached —
    // they're content-hashed, so once is forever. Avoids re-downloading them.
    const cacheIfMissing = async (url: string, opts: RequestInit) => {
      if (!hasCaches) return;
      try {
        if (!(await caches.match(url))) fetch(url, opts).catch(() => {});
      } catch {
        /* ignore */
      }
    };

    // Warm each page for offline: re-fetch the HTML document (so the offline
    // copy stays current), and cache the JS/CSS it references + images — but
    // only the ones not already cached, since those never change.
    const warm = async () => {
      if (!online || navigator.onLine === false) return;
      for (const url of routes) {
        if (cancelled) return;
        try {
          const res = await fetch(url, { credentials: "include" });
          const type = res.headers.get("content-type") || "";
          if (!res.ok || !type.includes("text/html")) continue;
          const html = await res.text();
          const seen = new Set<string>();
          for (const m of html.matchAll(/["'](\/_next\/static\/[^"']+?\.(?:js|css))["']/g)) {
            if (seen.has(m[1])) continue;
            seen.add(m[1]);
            if (cancelled) return;
            await cacheIfMissing(m[1], {});
          }
        } catch {
          /* ignore */
        }
      }
      for (const url of assets) {
        if (cancelled) return;
        await cacheIfMissing(url, { mode: "no-cors" });
      }
    };

    // Foreground: latest first, then prepare for offline.
    const onForeground = () => {
      refresh();
      void warm();
    };

    onForeground(); // initial run
    // Live updates on the page you're viewing: every 10s.
    const liveId = setInterval(refresh, 10000);
    // Offline prep (re-cache page documents): slow — every 2 min, plus on
    // foreground/reconnect. Immutable assets aren't re-fetched at all.
    const warmId = setInterval(() => void warm(), 120000);

    const onVisible = () => {
      if (document.visibilityState === "visible") onForeground();
    };
    const onOnline = () => {
      online = true;
      onForeground();
    };
    const onOffline = () => {
      online = false; // stop refreshing immediately
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      cancelled = true;
      clearInterval(liveId);
      clearInterval(warmId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enabled, skip, routes, assets, router]);

  return null;
}
