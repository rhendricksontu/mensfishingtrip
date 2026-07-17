"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setVisibility } from "@/app/admin/actions";
import type { VisibilityKey } from "@/lib/types";

export default function VisibilityToggle({
  settingKey,
  initial,
  label,
}: {
  settingKey: VisibilityKey;
  initial: boolean;
  label: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next); // optimistic
    start(async () => {
      const res = await setVisibility(settingKey, next);
      if (!res.ok) {
        setOn(!next);
        alert("Could not update visibility. Please try again.");
      }
      router.refresh();
    });
  }

  return (
    <div className="card flex items-center justify-between gap-3">
      <div>
        <p className="font-semibold text-brand-800">{label}</p>
        <p className="text-xs text-brand-500">
          {on
            ? "Visible on each attendee's My Fishing Trip page."
            : "Hidden from attendees until you turn this on."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={toggle}
        disabled={pending}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          on ? "bg-olive-600" : "bg-brand-200"
        } ${pending ? "opacity-60" : ""}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
