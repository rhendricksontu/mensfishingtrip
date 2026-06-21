"use client";

import { useEffect, useState } from "react";
import { googleMapsUrl, appleMapsUrl } from "@/lib/utils";

// Opens the device's native maps app: Apple Maps on iPhone/iPad,
// Google Maps elsewhere. Defaults to Google (works for SSR/Android/desktop)
// and upgrades to Apple Maps on Apple touch devices after mount.
export default function MapLink({
  place,
  className,
  children,
}: {
  place: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [href, setHref] = useState(() => googleMapsUrl(place));

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setHref(isIOS ? appleMapsUrl(place) : googleMapsUrl(place));
  }, [place]);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
