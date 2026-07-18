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

    const refresh = () => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine !== false &&
        !isEditing()
      ) {
        router.refresh();
      }
    };

    const hasCaches = typeof caches !== "undefined";
    // Re-fetch page documents (keeps offline copy fresh) and any un-cached
    // images. Documents are what the app loads for offline navigation.
    const warm = async () => {
      if (navigator.onLine === false) return;
      for (const url of routes) {
        if (cancelled) return;
        fetch(url, { credentials: "include" }).catch(() => {});
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
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onForeground);

    return () => {
      cancelled = true;
      clearInterval(liveId);
      clearInterval(warmId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onForeground);
    };
  }, [enabled, skip, routes, assets, router]);

  return null;
}
