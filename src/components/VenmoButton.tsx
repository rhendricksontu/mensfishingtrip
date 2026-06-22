"use client";

import { useEffect, useState } from "react";
import { PAYMENT } from "@/lib/config";

// On mobile we open the Venmo app directly (deep link) so the pre-filled note
// keeps its spaces; the venmo.com web link re-encodes them as "+". Desktop
// (no app) falls back to the web link.
export default function VenmoButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [href, setHref] = useState(PAYMENT.venmoUrl);

  useEffect(() => {
    if (/iphone|ipad|ipod|android/i.test(navigator.userAgent)) {
      setHref(PAYMENT.venmoDeepLink);
    }
  }, []);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
