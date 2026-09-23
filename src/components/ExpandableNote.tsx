"use client";

import { useState } from "react";

// A "View <label>" / "Hide <label>" toggle that reveals free-text details.
// Renders nothing when there are no details.
export default function ExpandableNote({
  label,
  details,
  className = "",
}: {
  label: string;
  details: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!details?.trim()) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
      >
        {open ? "Hide" : "View"} {label}
      </button>
      {open && (
        <p className="mt-2 whitespace-pre-line text-sm text-brand-600">{details}</p>
      )}
    </div>
  );
}
