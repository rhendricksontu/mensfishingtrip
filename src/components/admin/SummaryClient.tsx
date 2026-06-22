"use client";

import { useState } from "react";
import Link from "next/link";
import { SESSION_LABELS, RIDE_PREF_LABELS } from "@/lib/config";
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
  const byId = new Map(attendees.map((a) => [a.id, a]));
  const sorted = [...attendees].sort((a, b) => a.name.localeCompare(b.name));

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

  return (
    <ul className="space-y-2">
      {sorted.map((a) => {
        const open = openId === a.id;
        const s = summaryFor(a);
        const needsAttention = s.cabinUnassigned || s.fishingUnassigned || s.rideUnassigned;
        return (
          <li
            key={a.id}
            className={`card ${needsAttention ? "border-l-4 border-amber-400" : ""}`}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : a.id)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="font-bold text-brand-800">{a.name}</span>
              <span className="text-xs font-medium text-brand-500 underline">
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
                  value={s.paid ? "Paid" : "Unpaid"}
                  highlight={!s.paid}
                />
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// "Unassigned" value that links to the tab where you can fix it.
function FixLink({ href }: { href: string }) {
  return (
    <Link href={href} className="font-semibold text-amber-700 underline">
      Unassigned
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
