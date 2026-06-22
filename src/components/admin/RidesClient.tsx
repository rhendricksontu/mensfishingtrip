"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createRide,
  updateRide,
  deleteRide,
  addPassenger,
  removePassenger,
} from "@/app/admin/actions";
import { formatPhone } from "@/lib/utils";
import type { Attendee, Ride, RideDirection } from "@/lib/types";

interface RidePassenger {
  ride_id: string;
  attendee_id: string;
}

const DIRECTIONS: { key: RideDirection; label: string }[] = [
  { key: "to_trip", label: "Heading to Broken Bow" },
  { key: "from_trip", label: "Coming home" },
];

export default function RidesClient({
  attendees,
  rides,
  ridePassengers,
}: {
  attendees: Attendee[];
  rides: Ride[];
  ridePassengers: RidePassenger[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const byId = new Map(attendees.map((a) => [a.id, a]));

  const refresh = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className={`space-y-8 ${pending ? "opacity-70" : ""}`}>
      {DIRECTIONS.map((dir) => {
        const dirRides = rides.filter((r) => r.direction === dir.key);
        const assignedIds = new Set<string>();
        dirRides.forEach((r) => {
          if (r.driver_id) assignedIds.add(r.driver_id);
          ridePassengers
            .filter((p) => p.ride_id === r.id)
            .forEach((p) => assignedIds.add(p.attendee_id));
        });
        const unaccounted = attendees.filter((a) => !assignedIds.has(a.id));
        const drivers = attendees.filter((a) => a.willing_to_drive);

        return (
          <section key={dir.key} className="space-y-3">
            <h2 className="text-lg font-bold text-brand-700">
              {dir.label}
            </h2>

            {dirRides.map((ride) => {
              const driver = ride.driver_id ? byId.get(ride.driver_id) : null;
              const passengers = ridePassengers
                .filter((p) => p.ride_id === ride.id)
                .map((p) => byId.get(p.attendee_id))
                .filter(Boolean) as Attendee[];
              const seatsLeft =
                driver && driver.seat_capacity
                  ? driver.seat_capacity - passengers.length
                  : null;

              return (
                <div key={ride.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-brand-800">
                        {driver ? driver.name : "Unknown driver"}&apos;s car
                      </h3>
                      {driver && (
                        <a href={`tel:${driver.phone}`} className="text-sm text-brand-600 underline">
                          {formatPhone(driver.phone)}
                        </a>
                      )}
                      {seatsLeft !== null && (
                        <span className="ml-2 text-xs text-brand-500">
                          {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Delete this ride?")) refresh(() => deleteRide(ride.id));
                      }}
                      className="text-xs text-brand-400 underline hover:text-red-600"
                    >
                      delete
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <TimeField
                      label="Departs"
                      value={ride.depart_time ?? ""}
                      onSave={(v) => refresh(() => updateRide(ride.id, { depart_time: v || null }))}
                    />
                    <TimeField
                      label="Arrives"
                      value={ride.arrive_time ?? ""}
                      onSave={(v) => refresh(() => updateRide(ride.id, { arrive_time: v || null }))}
                    />
                  </div>

                  <div>
                    <span className="label">Passengers</span>
                    {passengers.length === 0 ? (
                      <p className="text-sm text-brand-400">No passengers yet.</p>
                    ) : (
                      <ul className="flex flex-wrap gap-1.5">
                        {passengers.map((p) => (
                          <li key={p.id} className="badge bg-brand-100 text-brand-700">
                            {p.name}
                            <button
                              onClick={() => refresh(() => removePassenger(ride.id, p.id))}
                              className="ml-1.5 text-brand-400 underline hover:text-red-600"
                              aria-label={`Remove ${p.name}`}
                            >
                              remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <AddPassenger
                      candidates={unaccounted}
                      onAdd={(id) => refresh(() => addPassenger(ride.id, id))}
                    />
                  </div>

                  <TimeField
                    label="Notes"
                    value={ride.notes ?? ""}
                    placeholder="Meeting spot, stops, etc."
                    onSave={(v) => refresh(() => updateRide(ride.id, { notes: v || null }))}
                  />
                </div>
              );
            })}

            <AddRide
              drivers={drivers}
              onAdd={(driverId) => refresh(() => createRide(driverId, dir.key))}
            />

            {unaccounted.length > 0 && (
              <div className="card border border-dashed border-amber-200 bg-amber-50/40 text-sm">
                <span className="font-semibold text-amber-800">
                  {unaccounted.length} not in a car for this fishing trip:
                </span>{" "}
                <span className="text-brand-600">
                  {unaccounted
                    .map((a) => a.name + (a.needs_ride ? " (needs ride)" : ""))
                    .join(", ")}
                </span>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function TimeField({
  label,
  value,
  onSave,
  placeholder,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
}) {
  const [v, setV] = useState(value);
  return (
    <div>
      <span className="label">{label}</span>
      <input
        className="input"
        value={v}
        placeholder={placeholder ?? "e.g. Fri 3:00 PM"}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onSave(v)}
      />
    </div>
  );
}

function AddPassenger({
  candidates,
  onAdd,
}: {
  candidates: Attendee[];
  onAdd: (id: string) => void;
}) {
  const [val, setVal] = useState("");
  if (candidates.length === 0) return null;
  return (
    <div className="mt-2 flex gap-2">
      <select className="input" value={val} onChange={(e) => setVal(e.target.value)}>
        <option value="">+ Add Passenger…</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.needs_ride ? " (needs ride)" : ""}
          </option>
        ))}
      </select>
      <button
        className="btn-secondary"
        disabled={!val}
        onClick={() => {
          if (val) {
            onAdd(val);
            setVal("");
          }
        }}
      >
        Add
      </button>
    </div>
  );
}

function AddRide({
  drivers,
  onAdd,
}: {
  drivers: Attendee[];
  onAdd: (driverId: string) => void;
}) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2">
      <select className="input" value={val} onChange={(e) => setVal(e.target.value)}>
        <option value="">+ New Car: Choose Driver…</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.seat_capacity} seats)
          </option>
        ))}
      </select>
      <button
        className="btn-primary"
        disabled={!val}
        onClick={() => {
          if (val) {
            onAdd(val);
            setVal("");
          }
        }}
      >
        Add Car
      </button>
    </div>
  );
}
