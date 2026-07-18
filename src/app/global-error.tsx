"use client";

import { useEffect } from "react";

// Root error boundary — catches errors the route-level error.tsx can't (e.g. a
// failed router.refresh() that re-renders the layout when the network drops).
// When offline, reload once (loop-guarded) so the cached document loads instead
// of a raw "application error". Must render its own <html>/<body>.
export default function GlobalError() {
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
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          color: "#202d3a",
        }}
      >
        <div>
          <p style={{ fontWeight: 600 }}>You&apos;re Offline</p>
          <p style={{ fontSize: "0.875rem", color: "#5f7185", marginTop: "0.25rem" }}>
            Once you&apos;re reconnected, the page will reload.
          </p>
        </div>
      </body>
    </html>
  );
}
