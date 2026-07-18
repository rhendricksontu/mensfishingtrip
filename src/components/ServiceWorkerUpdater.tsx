"use client";

import { useEffect } from "react";

// When a new deploy's service worker activates and takes control, reload once so
// the app runs the new code instead of the previously cached version. Without
// this, an installed (home-screen) PWA can keep serving stale code across
// launches. We only reload on an UPDATE (a controller already existed), not on
// the first install, and guard against reload loops.
export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;

    const onControllerChange = () => {
      if (reloading || !hadController) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
