"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// A near-invisible sync helper. It polls /api/version (a few bytes) and, when
// the server has newer data than what's on screen, AUTO-refreshes so changes —
// e.g. your coffee being marked ready — appear on their own, no tap needed. It
// shows NOTHING while synced or mid-sync. Only two things ever render: "Offline"
// when the device is offline, and a manual "Tap to Sync" fallback if the app has
// been out of sync for 30s+ (i.e. auto-refresh didn't resolve it).
export default function SyncIndicator({ version }: { version: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [online, setOnline] = useState(true);
  const [latest, setLatest] = useState(version);
  // Whether the out-of-sync state has persisted long enough to offer a manual tap.
  const [showTap, setShowTap] = useState(false);
  // The version we've already auto-refreshed for, so we don't loop on one change.
  const refreshedFor = useRef(version);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // After a sync/refresh the page re-renders with a newer `version` — treat that
  // as the new baseline so the indicator reads "Synced".
  useEffect(() => {
    setLatest((prev) => (version > prev ? version : prev));
  }, [version]);

  // Lightweight change check — only while visible and online.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (document.visibilityState !== "visible" || navigator.onLine === false) return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data?.version === "number") setLatest(data.version);
      } catch {
        /* ignore */
      }
    };
    check();
    const id = setInterval(check, 10000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, []);

  // Auto-refresh when the server has newer data — but only while online and the
  // tab is visible, and only once per new version (guarded so a failed refresh
  // can't spin). A refresh that succeeds re-renders with a newer `version`,
  // which settles this back to "Synced".
  useEffect(() => {
    if (!online || pending) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (latest > version && refreshedFor.current !== latest) {
      refreshedFor.current = latest;
      start(() => router.refresh());
    }
  }, [latest, version, online, pending, router]);

  const outOfSync = online && latest > version;

  // Only offer a manual "Tap to Sync" if we've stayed out of sync for 30s+ (i.e.
  // auto-refresh didn't clear it). While synced or mid-sync, keep it hidden.
  useEffect(() => {
    if (!outOfSync || pending) {
      setShowTap(false);
      return;
    }
    const id = setTimeout(() => setShowTap(true), 30000);
    return () => clearTimeout(id);
  }, [outOfSync, pending]);

  // Render nothing unless offline, or stuck out of sync long enough to tap.
  const mode = !online ? "offline" : outOfSync && showTap ? "tap" : null;
  if (!mode) return null;

  const label = mode === "offline" ? "Offline" : "Tap to Sync";
  const dot =
    mode === "offline"
      ? "bg-red-500 shadow-[0_0_5px_1px_#ef4444]"
      : "bg-amber-400 shadow-[0_0_5px_1px_#fbbf24]";

  return (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={() => start(() => router.refresh())}
        disabled={pending || !online}
        aria-label="Sync"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-brand-400 hover:text-brand-700 disabled:opacity-60"
      >
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </button>
    </div>
  );
}
