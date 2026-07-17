"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keeps a server-rendered page fresh for a user who leaves the tab open. We
// can't use Supabase realtime here (RLS exposes nothing to the browser), so we
// re-fetch the server component on an interval and — for an instant feel —
// whenever the tab regains focus. router.refresh() preserves scroll and input.
export default function LiveRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
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
  }, [router, intervalMs]);

  return null;
}
