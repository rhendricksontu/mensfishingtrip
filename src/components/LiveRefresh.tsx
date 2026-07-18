"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Don't auto-refresh long, in-progress forms out from under someone.
const SKIP_PREFIXES = ["/rsvp", "/login", "/reset"];

// Keeps server-rendered content (and the nav) fresh for a user who leaves the
// tab open. We can't use Supabase realtime here (RLS exposes nothing to the
// browser), so we re-fetch on an interval and — for an instant feel — whenever
// the tab regains focus. router.refresh() preserves scroll and input.
export default function LiveRefresh({
  enabled = true,
  intervalMs = 10000,
}: {
  enabled?: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const active =
    enabled && !SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!active) return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(refreshIfVisible, intervalMs);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [router, intervalMs, active]);

  return null;
}
