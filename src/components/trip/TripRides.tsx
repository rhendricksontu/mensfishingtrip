"use client";

import { useState } from "react";
import PhoneLink from "@/components/PhoneLink";
import type { Attendee, RideDirection } from "@/lib/types";

export interface RideInfo {
  driver: Attendee | null;
  passengers: Attendee[];
  iAmDriver: boolean;
}

// Read-only ride cards for the member, mirroring the organizer Rides cards.
// Coming Home is collapsed by default, like the organizer side.
export default function TripRides({
  toInfo,
  fromInfo,
  meId,
}: {
  toInfo: RideInfo | null;
  fromInfo: RideInfo | null;
  meId: string;
}) {
  const [showReturn, setShowReturn] = useState(false);

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-base font-bold text-brand-700">To Broken Bow</h3>
        <RideView direction="to_trip" info={toInfo} meId={meId} />
      </section>

      <section className="space-y-2">
        <button
          type="button"
          onClick={() => setShowReturn((s) => !s)}
          className="flex w-full items-center justify-between gap-2"
        >
          <h3 className="text-base font-bold text-brand-700">Coming Home</h3>
          <span className="whitespace-nowrap text-xs font-medium text-brand-500 underline">
            {showReturn ? "Hide" : "Show"}
          </span>
        </button>
        {showReturn && <RideView direction="from_trip" info={fromInfo} meId={meId} />}
      </section>
    </div>
  );
}

function RideView({
  direction,
  info,
  meId,
}: {
  direction: RideDirection;
  info: RideInfo | null;
  meId: string;
}) {
  if (!info || !info.driver) {
    return <p className="card text-sm text-brand-400">No ride arranged yet.</p>;
  }

  const driver = info.driver;
  const passengers = info.passengers;
  const seatsLeft = driver.seat_capacity - passengers.length;
  const over = seatsLeft < 0;

  return (
    <div className="card space-y-3">
      <div>
        <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
          Driver
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-bold text-brand-800">
            {driver.name}
            {driver.id === meId && " (You)"}
          </h3>
          <PhoneLink phone={driver.phone} />
        </div>
        <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
          {passengers.length}/{driver.seat_capacity} Seats
        </span>
      </div>

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

      {passengers.length > 0 ? (
        <ul className="divide-y divide-brand-50">
          {passengers.map((p) => (
            <li key={p.id} className="py-2 text-sm">
              <span className="font-medium text-brand-800">
                {p.name}
                {p.id === meId && " (You)"}
              </span>{" "}
              <PhoneLink phone={p.phone} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-400">No passengers assigned yet.</p>
      )}
    </div>
  );
}
