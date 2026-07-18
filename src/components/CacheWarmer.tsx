"use client";

import { useEffect } from "react";

// Proactively caches pages (and agenda image attachments) while online so the
// app works offline even if the user hasn't opened those tabs/images yet.
//
// Reliability: rather than warming once and hoping every fetch lands, we check
// what's actually in the cache and (re)fetch only what's missing — on load,
// on reconnect, and periodically while online. So a fetch that failed on weak
// signal simply gets retried next cycle until everything is stored. We fetch
// the full HTML document (not router.prefetch, which pollutes Next's client
// Router Cache); the service worker caches it for offline navigation.
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

    // Fetch only targets not already cached, so repeat runs are cheap and any
    // previously-failed fetch is retried until it succeeds.
    const warm = async () => {
      if (!navigator.onLine) return;
      const targets: { url: string; opts: RequestInit }[] = [
        ...routes.map((url) => ({ url, opts: { credentials: "include" as const } })),
        // Cross-origin Storage images: no-cors mirrors an <img> load so the
        // service worker's CacheFirst rule stores them for offline.
        ...assets.map((url) => ({ url, opts: { mode: "no-cors" as const } })),
      ];
      for (const { url, opts } of targets) {
        if (cancelled) return;
        try {
          const hit = await caches.match(url);
          if (!hit) fetch(url, opts).catch(() => {});
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
