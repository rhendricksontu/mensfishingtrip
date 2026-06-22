"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAttendee } from "@/app/admin/actions";
import { PAYMENT } from "@/lib/config";
import PhoneLink from "@/components/PhoneLink";
import type { Attendee } from "@/lib/types";

export default function ARClient({ attendees }: { attendees: Attendee[] }) {
  const total = attendees.length;
  const paidCount = attendees.filter((a) => a.paid).length;
  const unpaidCount = total - paidCount;
  const outstanding = unpaidCount * PAYMENT.amount;

  // Unpaid first (so outstanding rises to the top), then alphabetical.
  const sorted = [...attendees].sort(
    (a, b) => Number(a.paid) - Number(b.paid) || a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Paid" value={`${paidCount}/${total}`} tone="good" />
        <Stat label="Outstanding" value={`$${outstanding}`} tone={outstanding ? "warn" : "good"} />
      </div>

      {total === 0 ? (
        <div className="card text-sm text-brand-400">No RSVPs yet.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((a) => (
            <ARRow key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function ARRow({ a }: { a: Attendee }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function save(patch: Parameters<typeof updateAttendee>[1]) {
    start(async () => {
      await updateAttendee(a.id, patch);
      router.refresh();
    });
  }

  return (
    <div className={`card ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-bold text-brand-800">{a.name}</h3>
          <PhoneLink phone={a.phone} className="text-brand-400 underline" />
        </div>
        <label className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
          <input
            type="checkbox"
            checked={a.paid}
            onChange={(e) => save({ paid: e.target.checked })}
            className="h-5 w-5 rounded text-brand-600"
          />
          <span
            className={`text-sm font-semibold ${a.paid ? "text-brand-700" : "text-amber-700"}`}
          >
            {a.paid ? "Paid" : "Unpaid"}
          </span>
        </label>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-brand-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-brand-800";
  return (
    <div className="card py-4">
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs font-medium text-brand-500">{label}</div>
    </div>
  );
}
