"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Keeps server-rendered content (and the nav) fresh for a user who leaves the
// tab open. We can't use Supabase realtime here (RLS exposes nothing to the
// browser), so we re-fetch on an interval and — for an instant feel — whenever
// the tab regains focus. router.refresh() preserves scroll and input.
//
// Network-aware for the field (weak rural signal): we skip ticks when the tab
// is hidden or the device is offline, refresh promptly when the connection
// returns, and don't poll on a timer under data-saver (focus/reconnect only).
//
// `activePrefixes` limits polling to matching routes (omit to always poll where
// the component is rendered).
export default function LiveRefresh({
  enabled = true,
  intervalMs = 10000,
  activePrefixes,
}: {
  enabled?: boolean;
  intervalMs?: number;
  activePrefixes?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inScope =
    !activePrefixes ||
    activePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const active = enabled && inScope;

  useEffect(() => {
    if (!active) return;

    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine !== false) {
        router.refresh();
      }
    };

    // Don't burn a thin/metered connection on a timer under data-saver — only
    // refresh when the user returns to the tab or the connection comes back.
    const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
    const id = conn?.saveData ? null : setInterval(refresh, intervalMs);

    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [router, intervalMs, active]);

  return null;
}
