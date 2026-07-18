"use client";

import { useEffect } from "react";

// Route error boundary. If a client-side navigation errored while offline (its
// data fetch couldn't reach the network), a full reload loads the cached
// document for this URL instead of leaving a raw error screen.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // A failed background refresh as the network drops can crash the render
    // before navigator.onLine flips. Reload (serves the cached document) rather
    // than trusting navigator.onLine; loop-guarded so a real error can't spin.
    const key = "offlineReloadAt";
    const last = Number(sessionStorage.getItem(key) || "0");
    if (Date.now() - last > 5000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  }, []);

  return (
    <div className="card text-center">
      <p className="font-semibold text-brand-800">Reconnecting…</p>
      <p className="mt-1 text-sm text-brand-500">
        One moment — if this stays, tap below.
      </p>
      <button onClick={reset} className="btn-secondary mt-3">
        Try Again
      </button>
    </div>
  );
}
