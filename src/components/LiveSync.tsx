"use client";

import { useEffect } from "react";

// Offline cache-warmer. It does NOT auto-refresh the page (that's now the
// SyncIndicator's tap-to-sync job) — deliberately, so a network drop can't
// crash a background refresh mid-flight. It just keeps the offline copy of the
// member/organizer pages current while online:
//   - re-fetch each page's HTML document (so the offline copy stays fresh)
//   - cache the JS/CSS it references + images, but only if not already cached
//     (they're content-hashed, so once is forever)
// Runs on foreground, on reconnect, and every 2 minutes.
export default function LiveSync({
  enabled = true,
  routes = [],
  assets = [],
}: {
  enabled?: boolean;
  routes?: string[];
  assets?: string[];
}) {
  useEffect(() => {
    const supported =
      typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;
    if (!enabled || (!routes.length && !assets.length) || !supported) return;

    let cancelled = false;
    let online = navigator.onLine !== false;

    const cacheIfMissing = async (url: string, opts: RequestInit) => {
      try {
        if (!(await caches.match(url))) fetch(url, opts).catch(() => {});
      } catch {
        /* ignore */
      }
    };

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
          // Every build asset the page references (js, css, fonts, media…), so
          // it renders fully offline — not just the .js/.css.
          for (const m of html.matchAll(/["'](\/_next\/static\/[^"'?]+?\.[a-z0-9]+)["']/gi)) {
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

    void warm();
    const warmId = setInterval(() => void warm(), 120000);

    const onVisible = () => {
      if (document.visibilityState === "visible") void warm();
    };
    const onOnline = () => {
      online = true;
      void warm();
    };
    const onOffline = () => {
      online = false;
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      cancelled = true;
      clearInterval(warmId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enabled, routes, assets]);

  return null;
}
