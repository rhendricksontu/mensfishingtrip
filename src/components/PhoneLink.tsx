"use client";

import { useEffect, useRef, useState } from "react";
import { formatPhone, normalizePhone } from "@/lib/utils";

// A tappable phone number. Tapping opens a small menu to Call or Text, since a
// plain tel: link only offers a call. Pass `className` to match surrounding
// text; omit for the default link look.
export default function PhoneLink({
  phone,
  className,
}: {
  phone: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const digits = normalizePhone(phone);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={
          className ?? "text-brand-600 underline decoration-brand-300 underline-offset-2"
        }
      >
        {formatPhone(phone)}
      </button>
      {open && (
        <span className="absolute left-0 top-full z-20 mt-1 flex overflow-hidden rounded-lg bg-white text-sm shadow-lg ring-1 ring-brand-200">
          <a
            href={`tel:${digits}`}
            className="px-4 py-1.5 font-medium text-brand-700 hover:bg-brand-50"
          >
            Call
          </a>
          <a
            href={`sms:${digits}`}
            className="border-l border-brand-100 px-4 py-1.5 font-medium text-brand-700 hover:bg-brand-50"
          >
            Text
          </a>
        </span>
      )}
    </span>
  );
}
