"use client";

import { useEffect, useRef, useState } from "react";
import { googleMapsUrl, appleMapsUrl, wazeUrl } from "@/lib/utils";

// Tapping shows a small chooser so the user can open the place in their
// preferred maps app. Using each app's deep link (in the same tab, no
// target=_blank) reliably hands off to the native app when installed.
export default function MapLink({
  place,
  className,
  children,
}: {
  place: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const options = [
    { label: "Apple Maps", href: appleMapsUrl(place) },
    { label: "Google Maps", href: googleMapsUrl(place) },
    { label: "Waze", href: wazeUrl(place) },
  ];

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {children}
      </button>
      {open && (
        <span className="absolute left-0 z-50 mt-1 flex w-44 flex-col overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-brand-200">
          <span className="border-b border-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-500">
            Open in…
          </span>
          {options.map((o) => (
            <a
              key={o.label}
              href={o.href}
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              {o.label}
            </a>
          ))}
        </span>
      )}
    </span>
  );
}
