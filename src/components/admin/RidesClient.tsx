"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignPassenger,
  setRideField,
  removePassenger,
  seedReturnFromDown,
} from "@/app/admin/actions";
import { formatPhone } from "@/lib/utils";
import type { Attendee, Ride, RideDirection } from "@/lib/types";

interface RidePassenger {
  ride_id: string;
  attendee_id: string;
}

const DIRECTIONS: { key: RideDirection; label: string }[] = [
  { key: "to_trip", label: "To Broken Bow" },
  { key: "from_trip", label: "Coming Home" },
];

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function RidesClient({
  attendees,
  rides,
  ridePassengers,
}: {
  attendees: Attendee[];
  rides: Ride[];
  ridePassengers: RidePassenger[];
}) {
  const byId = new Map(attendees.map((a) => [a.id, a]));
  const drivers = attendees.filter((a) => a.willing_to_drive);

  const passengersOf = (rideId: string) =>
    ridePassengers
      .filter((p) => p.ride_id === rideId)
      .map((p) => byId.get(p.attendee_id))
      .filter(Boolean) as Attendee[];

  // A driver's effective passengers for a direction. Coming-home (from_trip)
  // inherits the ride-down passengers until it has its own ride row.
  function effective(driver: Attendee, direction: RideDirection) {
    const ride = rides.find((r) => r.driver_id === driver.id && r.direction === direction) ?? null;
    if (ride) return { ride, passengers: passengersOf(ride.id), inherited: false };
    if (direction === "from_trip") {
      const toRide = rides.find((r) => r.driver_id === driver.id && r.direction === "to_trip");
      return { ride: null, passengers: toRide ? passengersOf(toRide.id) : [], inherited: true };
    }
    return { ride: null, passengers: [] as Attendee[], inherited: false };
  }

  return (
    <div className="space-y-8">
      {DIRECTIONS.map((dir) => {
        // Effective seating for this direction (includes inherited coming-home).
        const seated = new Set<string>();
        drivers.forEach((d) =>
          effective(d, dir.key).passengers.forEach((p) => seated.add(p.id))
        );
        const unplaced = attendees.filter(
          (a) => !a.willing_to_drive && !seated.has(a.id)
        );

        return (
          <section key={dir.key} className="space-y-3">
            <h2 className="text-lg font-bold text-brand-700">{dir.label}</h2>

            {drivers.length === 0 && (
              <p className="text-sm text-brand-400">
                No drivers yet. People who pick &ldquo;Driver&rdquo; and offer seats appear here.
              </p>
            )}

            {drivers.map((driver) => {
              const { ride, passengers, inherited } = effective(driver, dir.key);
              const candidates = attendees.filter(
                (a) => a.id !== driver.id && !seated.has(a.id)
              );
              return (
                <RideCard
                  key={driver.id}
                  driver={driver}
                  direction={dir.key}
                  ride={ride}
                  passengers={passengers}
                  inherited={inherited}
                  candidates={candidates}
                />
              );
            })}

            {unplaced.length > 0 && (
              <div className="card border border-dashed border-amber-200 bg-amber-50/40 text-sm">
                <span className="font-semibold text-amber-800">
                  {unplaced.length} not in a car yet:
                </span>{" "}
                <span className="text-brand-600">
                  {unplaced.map((a) => a.name + (a.needs_ride ? " (needs ride)" : "")).join(", ")}
                </span>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function RideCard({
  driver,
  direction,
  ride,
  passengers,
  inherited,
  candidates,
}: {
  driver: Attendee;
  direction: RideDirection;
  ride: Ride | null;
  passengers: Attendee[];
  inherited: boolean;
  candidates: Attendee[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  // Coming-home that's still inheriting the down ride: copy it before editing.
  function startEditing() {
    if (inherited) run(() => seedReturnFromDown(driver.id));
    setEditing(true);
  }

  const seatsLeft = driver.seat_capacity - passengers.length;

  return (
    <div className={`card space-y-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-brand-800">{driver.name}</h3>
          <a href={`tel:${driver.phone}`} className="text-sm text-brand-600 underline">
            {formatPhone(driver.phone)}
          </a>
          <span className="ml-2 text-xs text-brand-500">
            {passengers.length}/{driver.seat_capacity} seats
            {seatsLeft > 0 ? ` · ${seatsLeft} open` : seatsLeft < 0 ? " · over capacity" : " · full"}
          </span>
        </div>
        {!editing && (
          <button
            onClick={startEditing}
            aria-label="Edit ride"
            className="text-brand-400 hover:text-brand-700"
          >
            <EditIcon />
          </button>
        )}
      </div>

      {/* Read view */}
      {!editing && (
        <>
          {inherited && (
            <p className="text-xs font-medium text-brand-500">Same as the ride to Broken Bow</p>
          )}
          {passengers.length > 0 ? (
            <ul className="divide-y divide-brand-50">
              {passengers.map((p) => (
                <li key={p.id} className="py-2 text-sm font-medium text-brand-800">
                  {p.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-brand-400">No passengers assigned.</p>
          )}
          {direction === "to_trip" && (ride?.depart_time || ride?.arrive_time) && (
            <p className="text-xs text-brand-500">
              {ride?.depart_time ? `Leaves ${ride.depart_time}` : ""}
              {ride?.depart_time && ride?.arrive_time ? " · " : ""}
              {ride?.arrive_time ? `Arrives ${ride.arrive_time}` : ""}
            </p>
          )}
        </>
      )}

      {/* Edit view */}
      {editing && (
        <>
          {passengers.length > 0 && (
            <ul className="divide-y divide-brand-50">
              {passengers.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <span className="text-sm font-medium text-brand-800">{p.name}</span>
                    <span className="ml-2 text-xs text-brand-400">{formatPhone(p.phone)}</span>
                  </div>
                  <button
                    onClick={() => ride && run(() => removePassenger(ride.id, p.id))}
                    className="text-xs text-brand-400 underline hover:text-red-600"
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div>
            <span className="label">Assign a passenger</span>
            <select
              className="input"
              value=""
              onChange={(e) => {
                if (e.target.value)
                  run(() => assignPassenger(driver.id, direction, e.target.value));
              }}
            >
              <option value="">+ Add a passenger…</option>
              {candidates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.needs_ride ? " (needs ride)" : ""}
                </option>
              ))}
            </select>
          </div>

          {direction === "to_trip" && (
            <div className="grid grid-cols-2 gap-3">
              <TimeField
                label="Departs"
                value={ride?.depart_time ?? ""}
                onSave={(v) => run(() => setRideField(driver.id, direction, { depart_time: v || null }))}
              />
              <TimeField
                label="Arrives"
                value={ride?.arrive_time ?? ""}
                onSave={(v) => run(() => setRideField(driver.id, direction, { arrive_time: v || null }))}
              />
            </div>
          )}

          <div className="flex justify-end border-t border-brand-50 pt-3">
            <button onClick={() => setEditing(false)} className="btn-secondary">
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TimeField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div>
      <span className="label">{label}</span>
      <input
        className="input"
        value={v}
        placeholder="e.g. Fri 3:00 PM"
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onSave(v)}
      />
    </div>
  );
}
