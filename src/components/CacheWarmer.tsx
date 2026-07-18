"use client";

import { useEffect } from "react";

// Proactively caches pages (and agenda image attachments) while online so the
// app works offline even if the user hasn't opened those tabs/images yet. Runs
// once per session (and again when a connection returns), quietly in the
// background. We fetch the full HTML document (not router.prefetch, which would
// pollute Next's client Router Cache with stale copies); the service worker
// caches it, and offline client-side navigation falls back to that document.
export default function CacheWarmer({
  routes,
  assets = [],
}: {
  routes: string[];
  assets?: string[];
}) {
  useEffect(() => {
    if ((!routes.length && !assets.length) || !("serviceWorker" in navigator)) return;

    const warm = () => {
      if (!navigator.onLine) return;
      if (sessionStorage.getItem("cacheWarmed") === "1") return;
      sessionStorage.setItem("cacheWarmed", "1");
      for (const r of routes) {
        fetch(r, { credentials: "include" }).catch(() => {});
      }
      // Cross-origin Storage images: no-cors so the request mirrors an <img>
      // load, which the service worker's CacheFirst rule stores for offline.
      for (const a of assets) {
        fetch(a, { mode: "no-cors" }).catch(() => {});
      }
    };

    // Let the current page settle first, then warm; also warm on reconnect.
    const t = setTimeout(warm, 3000);
    const onOnline = () => {
      sessionStorage.removeItem("cacheWarmed");
      warm();
    };
    window.addEventListener("online", onOnline);
    return () => {
      clearTimeout(t);
      window.removeEventListener("online", onOnline);
    };
  }, [routes, assets]);

  return null;
}
