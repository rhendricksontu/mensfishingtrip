"use client";

import { useState } from "react";

// Expandable "View Check-in Details for <Cabin>" toggle. Renders nothing when a
// cabin has no check-in details.
export default function CabinCheckin({
  name,
  details,
}: {
  name: string;
  details: string | null;
}) {
  const [open, setOpen] = useState(false);
  if (!details?.trim()) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
      >
        {open ? "Hide" : "View"} Check-in Details for {name}
      </button>
      {open && (
        <p className="mt-2 whitespace-pre-line text-sm text-brand-600">{details}</p>
      )}
    </div>
  );
}
