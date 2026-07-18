"use client";

import { useEffect } from "react";

// Root error boundary — catches errors the route-level error.tsx can't (e.g. a
// failed router.refresh() that re-renders the layout when the network drops).
// When offline, reload once (loop-guarded) so the cached document loads instead
// of a raw "application error". Must render its own <html>/<body>.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
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
          <p style={{ fontWeight: 600 }}>Reconnecting…</p>
          <p style={{ fontSize: "0.875rem", color: "#5f7185", marginTop: "0.25rem" }}>
            One moment — if this stays, tap below.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #c4ccd6",
              background: "white",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
