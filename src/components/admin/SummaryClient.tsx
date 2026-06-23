"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SESSION_LABELS, RIDE_PREF_LABELS } from "@/lib/config";
import { setAttendeeRole } from "@/app/admin/actions";
import PhoneLink from "@/components/PhoneLink";
import type { Attendee, Cabin, FishingGroup, Ride } from "@/lib/types";

interface RidePassenger {
  ride_id: string;
  attendee_id: string;
}

export default function SummaryClient({
  attendees,
  cabins,
  groups,
  rides,
  ridePassengers,
}: {
  attendees: Attendee[];
  cabins: Cabin[];
  groups: FishingGroup[];
  rides: Ride[];
  ridePassengers: RidePassenger[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const byId = new Map(attendees.map((a) => [a.id, a]));

  function toggleAdmin(a: Attendee) {
    start(async () => {
      await setAttendeeRole(a.id, a.role === "admin" ? "member" : "admin");
      router.refresh();
    });
  }
  const needsAttn = (a: Attendee) => {
    const s = summaryFor(a);
    return s.cabinUnassigned || s.fishingUnassigned || s.rideUnassigned || !s.paid;
  };

  // Needs-attention (amber) bubbles to the top; good standing (green) sinks.
  const sorted = [...attendees].sort(
    (a, b) => Number(needsAttn(b)) - Number(needsAttn(a)) || a.name.localeCompare(b.name)
  );

  function summaryFor(me: Attendee) {
    const cabin = cabins.find((c) => c.id === me.cabin_id) || null;
    const group = groups.find((g) => g.id === me.fishing_group_id) || null;
    const session = group?.session ?? me.assigned_session ?? null;
    const isGuide = groups.some((g) => g.guide_attendee_id === me.id);

    // Driver for the trip down. Only rides whose driver is a willing driver
    // count, so stale rows don't show a bogus assignment.
    const dirRides = rides.filter(
      (r) =>
        r.direction === "to_trip" && r.driver_id && byId.get(r.driver_id)?.willing_to_drive
    );
    let driver: string;
    let rideUnassigned = false;
    if (me.willing_to_drive) {
      driver = "Self";
    } else {
      const link = ridePassengers.find(
        (p) => p.attendee_id === me.id && dirRides.some((r) => r.id === p.ride_id)
      );
      const ride = link ? dirRides.find((r) => r.id === link.ride_id) : null;
      const d = ride?.driver_id ? byId.get(ride.driver_id) : null;
      driver = d ? d.name : "Unassigned";
      rideUnassigned = !d;
    }

    // Guides show "Guide"; non-guides only show fishing if they want a guide.
    let fishing: string | null;
    let fishingUnassigned = false;
    if (isGuide) {
      fishing = "Guide";
    } else if (!me.fish_with_guide) {
      fishing = null;
    } else {
      fishing = group
        ? `${group.guide_name || group.name}${session ? ` · ${SESSION_LABELS[session]}` : ""}`
        : session
          ? SESSION_LABELS[session]
          : "Unassigned";
      fishingUnassigned = !group && !session;
    }

    return {
      cabin: cabin ? cabin.name : "Unassigned",
      cabinUnassigned: !cabin,
      fishing,
      fishingUnassigned,
      driver,
      rideUnassigned,
      paid: me.paid,
    };
  }

  if (attendees.length === 0) {
    return <div className="card text-sm text-brand-400">No RSVPs yet.</div>;
  }

  const needsCount = attendees.filter(needsAttn).length;
  const readyCount = attendees.length - needsCount;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="card border-l-4 border-olive-500 py-3">
          <div className="text-2xl font-bold text-olive-600">{readyCount}</div>
          <div className="text-xs font-medium text-brand-500">Good Standing</div>
        </div>
        <div className="card border-l-4 border-amber-400 py-3">
          <div className="text-2xl font-bold text-amber-600">{needsCount}</div>
          <div className="text-xs font-medium text-brand-500">Needs Attention</div>
        </div>
      </div>

      <ul className="space-y-2">
      {sorted.map((a) => {
        const open = openId === a.id;
        const s = summaryFor(a);
        const needsAttention =
          s.cabinUnassigned || s.fishingUnassigned || s.rideUnassigned || !s.paid;
        const isGuide = groups.some((g) => g.guide_attendee_id === a.id);
        return (
          <li
            key={a.id}
            className={`card border-l-4 ${needsAttention ? "border-amber-400" : "border-olive-500"}`}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : a.id)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="flex flex-wrap items-center gap-2">
                {a.role === "admin" && (
                  <span className="text-olive-600" title="Organizer" aria-label="Organizer">
                    ★
                  </span>
                )}
                <span className="font-bold text-brand-800">{a.name}</span>
                {a.is_cabin_host && <Chip>Host</Chip>}
                {isGuide && <Chip>Guide</Chip>}
                {a.willing_to_drive && <Chip>Driver</Chip>}
              </span>
              <span className="shrink-0 text-xs font-medium text-brand-500 underline">
                {open ? "Hide" : "View"}
              </span>
            </button>
            {open && (
              <dl className="mt-3 space-y-1.5 border-t border-brand-50 pt-3 text-sm">
                <Row
                  label="Cell Phone"
                  value={<PhoneLink phone={a.phone} className="font-medium text-brand-800 underline" />}
                />
                <Row label="Emergency Contact" value={a.emergency_contact_name} />
                <Row
                  label="Emergency Phone"
                  value={
                    <PhoneLink
                      phone={a.emergency_contact_phone}
                      className="font-medium text-brand-800 underline"
                    />
                  }
                />
                <Row
                  label="Ride Preference"
                  value={RIDE_PREF_LABELS[a.ride_preference] ?? "Not set"}
                />
                <Row label="Departure" value={a.departure_time || "Not set"} />
                <Row
                  label="Departure/Return Location"
                  value={a.departure_location || "Not set"}
                />
                <Row
                  label="Driver"
                  value={s.rideUnassigned ? <FixLink href="/admin/rides" /> : s.driver}
                  highlight={s.rideUnassigned}
                />
                <Row
                  label="Cabin"
                  value={s.cabinUnassigned ? <FixLink href="/admin/cabins" /> : s.cabin}
                  highlight={s.cabinUnassigned}
                />
                {s.fishing && (
                  <Row
                    label="Fishing"
                    value={s.fishingUnassigned ? <FixLink href="/admin/fishing" /> : s.fishing}
                    highlight={s.fishingUnassigned}
                  />
                )}
                <Row
                  label="Payment"
                  value={s.paid ? "Paid" : <FixLink href="/admin/ar" label="Unpaid" />}
                  highlight={!s.paid}
                />
                <div className="flex items-center justify-between gap-3 pt-1">
                  <dt className="text-brand-500">Organizer</dt>
                  <button
                    type="button"
                    onClick={() => toggleAdmin(a)}
                    disabled={pending}
                    className={`text-xs font-semibold underline disabled:opacity-50 ${
                      a.role === "admin"
                        ? "text-red-600 hover:text-red-700"
                        : "text-olive-700 hover:text-olive-800"
                    }`}
                  >
                    {a.role === "admin" ? "Remove Organizer" : "Make Organizer"}
                  </button>
                </div>
              </dl>
            )}
          </li>
        );
      })}
      </ul>
    </div>
  );
}

// Olive role chip (Host / Guide / Driver).
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-olive-600 px-2 py-0.5 text-xs font-semibold text-cream">
      {children}
    </span>
  );
}

// A flagged value that links to the tab where you can fix it.
function FixLink({ href, label = "Unassigned" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="font-semibold text-amber-700 underline">
      {label}
    </Link>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={highlight ? "font-semibold text-amber-700" : "text-brand-500"}>{label}</dt>
      <dd
        className={`text-right font-medium ${highlight ? "font-semibold text-amber-700" : "text-brand-800"}`}
      >
        {value}
      </dd>
    </div>
  );
}
