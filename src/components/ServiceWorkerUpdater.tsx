"use client";

import { useEffect } from "react";

// Keeps an installed (home-screen) PWA on the latest code without reinstalling.
// Two parts:
//  1. Actively check for a new service worker (i.e. a new deploy) on load and
//     every time the app regains focus, so updates are picked up promptly.
//  2. When the new worker activates and takes control, reload once so the app
//     runs the new code. We only reload on an UPDATE (a controller already
//     existed), not the first install, and guard against reload loops.
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

    // Ask the browser to re-check /sw.js for a newer version.
    const checkForUpdate = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {});
    };
    checkForUpdate();
    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return null;
}
