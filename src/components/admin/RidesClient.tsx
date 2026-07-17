"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignPassenger, unassignPassenger } from "@/app/admin/actions";
import { formatPhone, normalizePhone } from "@/lib/utils";
import PhoneLink from "@/components/PhoneLink";
import type { Attendee, Ride } from "@/lib/types";

interface RidePassenger {
  ride_id: string;
  attendee_id: string;
}

// One ride per driver covers both going and coming — we assume the same car
// both ways, so we only track the "to_trip" ride here.
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

  // A driver's passengers (the single ride, both directions).
  function passengersFor(driver: Attendee) {
    const ride = rides.find((r) => r.driver_id === driver.id && r.direction === "to_trip");
    return ride ? passengersOf(ride.id) : [];
  }

  // Everyone seated in a car (drivers excluded).
  const seated = new Set<string>();
  drivers.forEach((d) => passengersFor(d).forEach((p) => seated.add(p.id)));

  const unplaced = attendees.filter((a) => !a.willing_to_drive && !seated.has(a.id));
  const emptyDrivers = drivers.filter((d) => passengersFor(d).length === 0);

  return (
    <div className="space-y-6">
      {unplaced.length > 0 && (
        <div className="card border border-dashed border-amber-200 bg-amber-50/40 text-sm">
          <p className="font-semibold text-amber-800">Unassigned Passengers</p>
          <ul className="mt-1.5 space-y-1 text-brand-600">
            {unplaced.map((a) => (
              <li key={a.id}>
                <span className="font-medium text-brand-800">{a.name}</span>
                <PhoneLink phone={a.phone} className="ml-2 text-xs text-brand-400 underline" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {emptyDrivers.length > 0 && (
        <div className="card border border-dashed border-amber-200 bg-amber-50/40 text-sm">
          <p className="font-semibold text-amber-800">Drivers with No Passengers</p>
          <ul className="mt-1.5 space-y-1 text-brand-600">
            {emptyDrivers.map((d) => (
              <li key={d.id}>
                <span className="font-medium text-brand-800">{d.name}</span>
                <PhoneLink phone={d.phone} className="ml-2 text-xs text-brand-400 underline" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-700">Ride Assignments</h2>

        {drivers.length === 0 && (
          <p className="text-sm text-brand-400">
            No drivers yet. People who pick &ldquo;Driver&rdquo; and offer seats appear here.
          </p>
        )}

        {drivers.map((driver) => {
          const passengers = passengersFor(driver);
          // Drivers can't be someone else's passenger.
          const candidates = attendees.filter(
            (a) => a.id !== driver.id && !a.willing_to_drive && !seated.has(a.id)
          );
          return (
            <RideCard
              key={driver.id}
              driver={driver}
              passengers={passengers}
              candidates={candidates}
            />
          );
        })}
      </section>
    </div>
  );
}

function RideCard({
  driver,
  passengers,
  candidates,
}: {
  driver: Attendee;
  passengers: Attendee[];
  candidates: Attendee[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  const seatsLeft = driver.seat_capacity - passengers.length;
  const over = seatsLeft < 0;

  return (
    <div className={`card space-y-3 ${pending ? "opacity-60" : ""}`}>
      <div>
        <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
          Driver
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-bold text-brand-800">{driver.name}</h3>
          <a
            href={`tel:${normalizePhone(driver.phone)}`}
            className="text-brand-400 underline decoration-brand-300 underline-offset-2 hover:text-brand-700"
          >
            {formatPhone(driver.phone)}
          </a>
        </div>
        <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
          {passengers.length}/{driver.seat_capacity} Seats
        </span>
      </div>

      {driver.departure_time && (
        <div className="space-y-0.5 text-xs text-brand-500">
          <p>Preferred Departure: {driver.departure_time}</p>
        </div>
      )}

      {passengers.length > 0 ? (
        <ul className="divide-y divide-brand-50">
          {passengers.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                <span className="font-medium text-brand-800">{p.name}</span>
                <PhoneLink phone={p.phone} className="ml-2 text-xs text-brand-400 underline" />
              </span>
              <button
                onClick={() => run(() => unassignPassenger(driver.id, "to_trip", p.id))}
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
            run(() => assignPassenger(driver.id, "to_trip", id));
          }}
        >
          <option value="">+ Add Passenger…</option>
          {candidates.map((a) => {
            const prefs = [
              a.departure_time,
              a.preferred_driver ? `prefers ${a.preferred_driver}` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <option key={a.id} value={a.id}>
                {a.name} · {formatPhone(a.phone)}
                {prefs ? ` · ${prefs}` : ""}
              </option>
            );
          })}
        </select>
      )}
    </div>
  );
}
