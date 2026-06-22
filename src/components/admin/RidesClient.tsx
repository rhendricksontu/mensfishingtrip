"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignPassenger,
  removePassenger,
  unassignPassenger,
  seedReturnFromDown,
} from "@/app/admin/actions";
import { formatPhone, normalizePhone } from "@/lib/utils";
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
  // Coming Home is collapsed by default; To Broken Bow is the priority.
  const [showReturn, setShowReturn] = useState(false);

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

        const isReturn = dir.key === "from_trip";
        const collapsed = isReturn && !showReturn;

        return (
          <section key={dir.key} className="space-y-3">
            {isReturn ? (
              <button
                type="button"
                onClick={() => setShowReturn((s) => !s)}
                className="flex w-full items-center justify-between gap-2"
              >
                <h2 className="text-lg font-bold text-brand-700">{dir.label}</h2>
                <span className="whitespace-nowrap text-xs font-medium text-brand-500 underline">
                  {showReturn ? "Hide" : "Show"}
                </span>
              </button>
            ) : (
              <h2 className="text-lg font-bold text-brand-700">{dir.label}</h2>
            )}

            {!collapsed && (
              <>
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
                <p className="font-semibold text-amber-800">Unassigned Passengers</p>
                <ul className="mt-1.5 space-y-1 text-brand-600">
                  {unplaced.map((a) => (
                    <li key={a.id}>
                      <span className="font-medium text-brand-800">{a.name}</span>
                      <span className="ml-2 text-xs text-brand-400">{formatPhone(a.phone)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
              </>
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
  const over = seatsLeft < 0;

  return (
    <div className={`card space-y-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {!editing && (
            <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
              Driver
            </span>
          )}
          <h3 className="font-bold text-brand-800">{driver.name}</h3>
          {!editing && (
            <>
              <a
                href={`tel:${normalizePhone(driver.phone)}`}
                className="block text-sm text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
              >
                {formatPhone(driver.phone)}
              </a>
              <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
                {passengers.length}/{driver.seat_capacity} Seats
              </span>
            </>
          )}
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
          {((direction === "to_trip" && driver.departure_time) || driver.departure_location) && (
            <div className="space-y-0.5 text-xs text-brand-500">
              {direction === "to_trip" && driver.departure_time && (
                <p>Preferred Departure: {driver.departure_time}</p>
              )}
              {driver.departure_location && (
                <p>Departure/Return Location: {driver.departure_location}</p>
              )}
            </div>
          )}
          {inherited && (
            <p className="text-xs font-medium text-brand-500">Same as the ride to Broken Bow</p>
          )}
          {passengers.length > 0 ? (
            <ul className="divide-y divide-brand-50">
              {passengers.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    <span className="font-medium text-brand-800">{p.name}</span>
                    <span className="ml-2 text-xs text-brand-400">{formatPhone(p.phone)}</span>
                  </span>
                  <button
                    onClick={() => run(() => unassignPassenger(driver.id, direction, p.id))}
                    className="text-xs text-brand-400 underline hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-brand-400">No passengers assigned.</p>
          )}

          {seatsLeft > 0 && candidates.length > 0 && (
            <select
              className="input"
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                run(async () => {
                  if (inherited) await seedReturnFromDown(driver.id);
                  await assignPassenger(driver.id, direction, id);
                });
              }}
            >
              <option value="">+ Add Passenger…</option>
              {candidates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {formatPhone(a.phone)}
                </option>
              ))}
            </select>
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
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div>
            <span className="label">Assign a Passenger</span>
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
                  {a.name} · {formatPhone(a.phone)}
                  {a.needs_ride ? " (needs ride)" : ""}
                </option>
              ))}
            </select>
          </div>

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
