"use client";

import { useEffect } from "react";

// Route error boundary. If a client-side navigation errored while offline (its
// data fetch couldn't reach the network), a full reload loads the cached
// document for this URL instead of leaving a raw error screen.
export default function Error() {
  useEffect(() => {
    // Reload when the connection returns (serves the cached/fresh document).
    const reload = () => window.location.reload();
    window.addEventListener("online", reload);

    // If we're actually online (the crash wasn't a dropped network), reload now
    // — loop-guarded so a real error can't spin.
    const key = "offlineReloadAt";
    const last = Number(sessionStorage.getItem(key) || "0");
    if (navigator.onLine !== false && Date.now() - last > 5000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
    return () => window.removeEventListener("online", reload);
  }, []);

  return (
    <div className="card text-center">
      <p className="font-semibold text-brand-800">You&apos;re Offline</p>
      <p className="mt-1 text-sm text-brand-500">
        Once you&apos;re reconnected, the page will reload.
      </p>
    </div>
  );
}
