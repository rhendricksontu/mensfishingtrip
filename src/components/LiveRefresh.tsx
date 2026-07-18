"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Long forms we never want yanked out from under someone (the RSVP, login).
const SKIP_PREFIXES = ["/rsvp", "/login", "/reset"];

// True while the user is actively editing, so we can hold off refreshing.
function isEditing(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable
  );
}

// Keeps server-rendered content (and the nav) fresh for a user who leaves the
// tab open. We can't use Supabase realtime here (RLS exposes nothing to the
// browser), so we re-fetch on an interval and — for an instant feel — whenever
// the tab regains focus. router.refresh() preserves scroll and input.
//
// Guards: skip when the tab is hidden, offline, or the user is mid-edit (so an
// organizer isn't interrupted); refresh promptly on reconnect; and don't poll
// on a timer under data-saver (focus/reconnect only).
//
// `activePrefixes` limits polling to matching routes (omit to poll everywhere).
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
  const skipped = SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const inScope =
    !activePrefixes ||
    activePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const active = enabled && inScope && !skipped;

  useEffect(() => {
    if (!active) return;

    const refresh = () => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine !== false &&
        !isEditing()
      ) {
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
