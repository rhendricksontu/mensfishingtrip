"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// A status pill that doubles as a manual sync. It cheaply polls /api/version
// (a few bytes) to detect when the server has newer data than what's on screen,
// showing "Online — Tap to Sync". Tapping pulls the update (router.refresh),
// after which `version` (the rendered value) catches up and it reads "Synced".
export default function SyncIndicator({ version }: { version: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [online, setOnline] = useState(true);
  const [latest, setLatest] = useState(version);

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
    const id = setInterval(check, 15000);
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

  const outOfSync = online && latest > version;
  const label = !online
    ? "Offline"
    : pending
      ? "Syncing…"
      : outOfSync
        ? "Online: Tap to Sync"
        : "Online: Synced";
  const dot = !online
    ? "bg-red-500 shadow-[0_0_5px_1px_#ef4444]"
    : pending || outOfSync
      ? "bg-amber-400 shadow-[0_0_5px_1px_#fbbf24]"
      : "bg-green-500 shadow-[0_0_5px_1px_#22c55e]";

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
