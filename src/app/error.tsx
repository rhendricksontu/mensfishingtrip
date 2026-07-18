"use client";

import { useEffect } from "react";

// Route error boundary. If a client-side navigation errored while offline (its
// data fetch couldn't reach the network), a full reload loads the cached
// document for this URL instead of leaving a raw error screen.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const key = "offlineReloadAt";
      const last = Number(sessionStorage.getItem(key) || "0");
      if (Date.now() - last > 4000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      }
    }
  }, []);

  return (
    <div className="card text-center">
      <p className="font-semibold text-brand-800">Something went wrong.</p>
      <p className="mt-1 text-sm text-brand-500">
        If you&apos;re offline, this page may not be saved yet.
      </p>
      <button onClick={reset} className="btn-secondary mt-3">
        Try Again
      </button>
    </div>
  );
}
