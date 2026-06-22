"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAttendee, deleteAttendee, setAttendeePassword, setAttendeeRole } from "@/app/admin/actions";
import { formatPhone } from "@/lib/utils";
import { RIDE_PREF_LABELS, SESSION_LABELS } from "@/lib/config";
import type { Attendee, Cabin, FishingGroup } from "@/lib/types";

export default function RosterClient({
  attendees,
  cabins,
  groups,
}: {
  attendees: Attendee[];
  cabins: Cabin[];
  groups: FishingGroup[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid" | "needs_ride" | "no_cabin">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendees.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q) && !a.phone.includes(q)) return false;
      if (filter === "unpaid") return !a.paid;
      if (filter === "paid") return a.paid;
      if (filter === "needs_ride") return a.needs_ride;
      if (filter === "no_cabin") return !a.cabin_id;
      return true;
    });
  }, [attendees, query, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="input sm:max-w-xs"
          placeholder="Search name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {([
            ["all", "All"],
            ["unpaid", "Unpaid"],
            ["paid", "Paid"],
            ["needs_ride", "Needs Ride"],
            ["no_cabin", "No Cabin"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${
                filter === key
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-brand-600 ring-brand-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ExportButton attendees={attendees} cabins={cabins} groups={groups} />
      </div>

      <p className="text-sm text-brand-500">{filtered.length} shown</p>

      <div className="space-y-3">
        {filtered.map((a) => (
          <AttendeeCard key={a.id} a={a} cabins={cabins} groups={groups} />
        ))}
      </div>
    </div>
  );
}

function AttendeeCard({
  a,
  cabins,
  groups,
}: {
  a: Attendee;
  cabins: Cabin[];
  groups: FishingGroup[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState(a.payment_note ?? "");

  const sessionGroups = groups.filter((g) => g.session === a.assigned_session);

  function save(patch: Parameters<typeof updateAttendee>[1]) {
    start(async () => {
      await updateAttendee(a.id, patch);
      router.refresh();
    });
  }

  return (
    <div className={`card space-y-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-brand-800">{a.name}</h3>
          <a href={`tel:${a.phone}`} className="text-sm text-brand-600 underline">
            {formatPhone(a.phone)}
          </a>
          <p className="text-xs text-brand-500">
            ICE: {a.emergency_contact_name} · {formatPhone(a.emergency_contact_phone)}
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
          <input
            type="checkbox"
            checked={a.paid}
            onChange={(e) => save({ paid: e.target.checked })}
            className="h-5 w-5 rounded text-brand-600"
          />
          <span className={`text-sm font-semibold ${a.paid ? "text-brand-700" : "text-amber-700"}`}>
            {a.paid ? "Paid" : "Unpaid"}
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="badge bg-brand-100 text-brand-700">{RIDE_PREF_LABELS[a.ride_preference]}</span>
        {a.willing_to_drive && (
          <span className="badge bg-blue-100 text-blue-700">Driver · {a.seat_capacity} seats</span>
        )}
        {a.needs_ride && <span className="badge bg-amber-100 text-amber-800">Needs ride</span>}
        {a.departure_time && (
          <span className="badge bg-brand-50 text-brand-600">Leaves: {a.departure_time}</span>
        )}
        {a.departure_location && (
          <span className="badge bg-brand-50 text-brand-600">From: {a.departure_location}</span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Cabin"
          value={a.cabin_id ?? ""}
          onChange={(v) => save({ cabin_id: v || null })}
          options={[{ value: "", label: "Unassigned" }, ...cabins.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <label className="flex items-center gap-2 self-end pb-2.5">
          <input
            type="checkbox"
            checked={a.is_cabin_host}
            disabled={!a.cabin_id}
            onChange={(e) => save({ is_cabin_host: e.target.checked })}
            className="h-5 w-5 rounded text-brand-600 disabled:opacity-40"
          />
          <span className="text-sm text-brand-700">Cabin Host</span>
        </label>
        <Select
          label="Fishing Session"
          value={a.assigned_session ?? ""}
          onChange={(v) =>
            save({
              assigned_session: (v || null) as Attendee["assigned_session"],
              // clear group if session changes
              fishing_group_id: null,
            })
          }
          options={[
            { value: "", label: "Unassigned" },
            { value: "saturday_morning", label: SESSION_LABELS.saturday_morning },
            { value: "saturday_afternoon", label: SESSION_LABELS.saturday_afternoon },
          ]}
        />
        <Select
          label="Fishing Group"
          value={a.fishing_group_id ?? ""}
          disabled={!a.assigned_session}
          onChange={(v) => save({ fishing_group_id: v || null })}
          options={[
            { value: "", label: a.assigned_session ? "Unassigned" : "Pick a Session First" },
            ...sessionGroups.map((g) => ({
              value: g.id,
              label: `${g.name}${g.guide_name ? ` (${g.guide_name})` : ""}`,
            })),
          ]}
        />
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <span className="label">Payment Note (Admin Only)</span>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (a.payment_note ?? "") && save({ payment_note: note || null })}
            placeholder="e.g. paid cash, Venmo 9/12"
          />
        </div>
        <button
          onClick={() => {
            if (confirm(`Delete ${a.name}'s RSVP and login? This cannot be undone.`)) {
              start(async () => {
                await deleteAttendee(a.id);
                router.refresh();
              });
            }
          }}
          className="btn-danger shrink-0"
        >
          Delete
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-brand-50 pt-2 text-xs">
        {a.user_id ? (
          <>
            <span
              className={`badge ${a.role === "admin" ? "bg-olive-600 text-white" : "bg-brand-100 text-brand-700"}`}
            >
              {a.role === "admin" ? "Admin" : "Member"}
            </span>
            <button
              onClick={() => {
                const next = a.role === "admin" ? "member" : "admin";
                const verb = next === "admin" ? "Make this person an organizer (Admin)?" : "Remove organizer access (make Member)?";
                if (confirm(`${a.name}: ${verb}`)) {
                  start(async () => {
                    await setAttendeeRole(a.id, next);
                    router.refresh();
                  });
                }
              }}
              className="text-brand-500 underline hover:text-brand-700"
            >
              {a.role === "admin" ? "Make Member" : "Make Admin"}
            </button>
            <span className="text-brand-200">·</span>
            <button
              onClick={async () => {
                const pw = prompt(`Set a new password for ${a.name} (min 8 chars):`);
                if (!pw) return;
                const res = await setAttendeePassword(a.id, pw);
                alert(res.ok ? "Password updated." : res.error || "Failed.");
              }}
              className="text-brand-500 underline hover:text-brand-700"
            >
              Reset password
            </button>
          </>
        ) : (
          <span className="badge bg-amber-100 text-amber-800">No login account</span>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <select
        className="input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ExportButton({
  attendees,
  cabins,
  groups,
}: {
  attendees: Attendee[];
  cabins: Cabin[];
  groups: FishingGroup[];
}) {
  function exportCsv() {
    const cabinName = (id: string | null) => cabins.find((c) => c.id === id)?.name ?? "";
    const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name ?? "";
    const headers = [
      "Name", "Phone", "Emergency Contact", "Emergency Phone", "Ride Pref",
      "Willing To Drive", "Seats", "Needs Ride", "Departure", "Departure Location",
      "Cabin", "Cabin Host", "Session", "Group", "Paid", "Payment Note",
    ];
    const rows = attendees.map((a) => [
      a.name, a.phone, a.emergency_contact_name, a.emergency_contact_phone,
      a.ride_preference, a.willing_to_drive ? "yes" : "no", a.seat_capacity,
      a.needs_ride ? "yes" : "no", a.departure_time ?? "", a.departure_location ?? "",
      cabinName(a.cabin_id),
      a.is_cabin_host ? "yes" : "no", a.assigned_session ?? "", groupName(a.fishing_group_id),
      a.paid ? "yes" : "no", a.payment_note ?? "",
    ]);
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fishing-trip-roster.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={exportCsv} className="btn-secondary text-sm sm:ml-auto">
      Export CSV
    </button>
  );
}
