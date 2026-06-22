"use client";

import { useEffect, useState } from "react";

function encodePlace(place: string): string {
  return encodeURIComponent(place.replace(/·/g, " ").replace(/\s+/g, " ").trim());
}

// One tap opens the device's native maps app with driving directions from the
// user's current location. Uses platform URL schemes so the app launches
// directly (instead of a web map). Falls back to web directions on desktop.
export default function MapLink({
  place,
  className,
  children,
}: {
  place: string;
  className?: string;
  children: React.ReactNode;
}) {
  const q = encodePlace(place);
  const webDir = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  const [href, setHref] = useState(webDir);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    if (isIOS) {
      // Apple Maps app, driving directions from current location.
      setHref(`maps://?daddr=${q}&dirflg=d`);
    } else if (isAndroid) {
      // Google Maps turn-by-turn navigation.
      setHref(`google.navigation:q=${q}`);
    } else {
      setHref(webDir);
    }
  }, [q, webDir]);

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
