"use client";

import { useEffect } from "react";

// Root error boundary — catches errors the route-level error.tsx can't (e.g. a
// failed router.refresh() that re-renders the layout when the network drops).
// When offline, reload once (loop-guarded) so the cached document loads instead
// of a raw "application error". Must render its own <html>/<body>.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const key = "offlineReloadAt";
      const last = Number(sessionStorage.getItem(key) || "0");
      if (Date.now() - last > 4000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
        return;
      }
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
          <p style={{ fontWeight: 600 }}>Something went wrong.</p>
          <p style={{ fontSize: "0.875rem", color: "#5f7185", marginTop: "0.25rem" }}>
            If you&apos;re offline, this page may not be saved yet.
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
