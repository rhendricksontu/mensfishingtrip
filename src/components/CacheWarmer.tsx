"use client";

import { useEffect } from "react";

// Proactively caches pages (and agenda image attachments) while online so the
// app works offline even if the user hasn't opened those tabs/images yet.
//
// Runs on load, on reconnect, and every 30s while online:
//  - Pages are re-fetched each cycle, so the cached copy stays current — a
//    change made before going offline is captured (NetworkFirst updates cache).
//  - Images are fetched only if missing (they never change once uploaded).
// A fetch that failed on weak signal is simply retried next cycle. We fetch the
// full HTML document (not router.prefetch, which pollutes Next's client Router
// Cache); the service worker caches it for offline navigation.
export default function CacheWarmer({
  routes,
  assets = [],
}: {
  routes: string[];
  assets?: string[];
}) {
  useEffect(() => {
    const hasCaches =
      typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;
    if ((!routes.length && !assets.length) || !hasCaches) return;

    let cancelled = false;

    const warm = async () => {
      if (!navigator.onLine) return;
      // Pages: always re-fetch to keep the offline copy fresh.
      for (const url of routes) {
        if (cancelled) return;
        fetch(url, { credentials: "include" }).catch(() => {});
      }
      // Images: cross-origin Storage assets, no-cors (mirrors an <img> load so
      // the SW's CacheFirst rule stores them). Fetch only if not already cached.
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

    const t = setTimeout(warm, 2000); // let the current page settle first
    const id = setInterval(warm, 30000); // keep catching up while online
    const onOnline = () => warm();
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      clearTimeout(t);
      clearInterval(id);
      window.removeEventListener("online", onOnline);
    };
  }, [routes, assets]);

  return null;
}
