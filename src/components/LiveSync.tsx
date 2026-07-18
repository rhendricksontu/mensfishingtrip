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
    // Warm each page for offline: cache the HTML document AND the JS/CSS chunks
    // it references (parsed from the HTML) — otherwise a page you never opened
    // online is missing its chunks and throws on load. Also cache un-cached
    // images. Re-runs keep the document fresh; cached chunks are served
    // instantly so re-fetching them is cheap.
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
            fetch(m[1]).catch(() => {});
          }
        } catch {
          /* ignore */
        }
      }
      if (!hasCaches) return;
      for (const url of assets) {
        if (cancelled) return;
        try {
          const hit = await caches.match(url);
          if (!hit) fetch(url, { mode: "no-cors" }).catch(() => {});
        } catch {
          /* ignore */
        }
      }
    };

    // Foreground: latest first, then prepare for offline.
    const onForeground = () => {
      refresh();
      void warm();
    };

    onForeground(); // initial run
    const liveId = setInterval(refresh, 10000);
    const warmId = setInterval(() => void warm(), 30000);

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
