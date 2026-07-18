"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Proactively caches the member pages while online so the whole app works
// offline even if the user hasn't opened those tabs yet. Runs once per session
// (and again when a connection returns), quietly in the background. The service
// worker's NetworkFirst "trip-pages" rule caches what we fetch here.
export default function CacheWarmer({ routes }: { routes: string[] }) {
  const router = useRouter();

  useEffect(() => {
    if (!routes.length || !("serviceWorker" in navigator)) return;

    const warm = () => {
      if (!navigator.onLine) return;
      if (sessionStorage.getItem("cacheWarmed") === "1") return;
      sessionStorage.setItem("cacheWarmed", "1");
      for (const r of routes) {
        // Cache the full HTML document (covers cold offline loads)...
        fetch(r, { credentials: "include" }).catch(() => {});
        // ...and the RSC payload (covers offline client-side navigation).
        try {
          router.prefetch(r);
        } catch {
          /* prefetch is best-effort */
        }
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
  }, [routes, router]);

  return null;
}
