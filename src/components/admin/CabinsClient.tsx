"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCabin,
  updateCabin,
  deleteCabin,
  updateAttendee,
} from "@/app/admin/actions";
import { formatPhone } from "@/lib/utils";
import type { Attendee, Cabin } from "@/lib/types";

export default function CabinsClient({
  cabins,
  attendees,
}: {
  cabins: Cabin[];
  attendees: Attendee[];
}) {
  const unassigned = attendees.filter((a) => !a.cabin_id);

  return (
    <div className="space-y-4">
      {cabins.map((c) => (
        <CabinCard
          key={c.id}
          cabin={c}
          occupants={attendees.filter((a) => a.cabin_id === c.id)}
          unassigned={unassigned}
        />
      ))}
      <AddCabin />
    </div>
  );
}

function CabinCard({
  cabin,
  occupants,
  unassigned,
}: {
  cabin: Cabin;
  occupants: Attendee[];
  unassigned: Attendee[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  const hasHost = occupants.some((a) => a.is_cabin_host);
  const over = cabin.capacity > 0 && occupants.length > cabin.capacity;

  return (
    <div className={`card space-y-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <input
          className="input flex-1 font-semibold"
          defaultValue={cabin.name}
          onBlur={(e) =>
            e.target.value.trim() &&
            e.target.value !== cabin.name &&
            run(() => updateCabin(cabin.id, { name: e.target.value.trim() }))
          }
        />
        <button
          onClick={() => {
            if (confirm(`Delete ${cabin.name}? Occupants will be unassigned.`)) {
              run(() => deleteCabin(cabin.id));
            }
          }}
          className="btn-danger shrink-0"
        >
          Delete
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <span className="label">Address</span>
          <input
            className="input"
            defaultValue={cabin.address ?? ""}
            placeholder="Cabin address"
            onBlur={(e) =>
              e.target.value !== (cabin.address ?? "") &&
              run(() => updateCabin(cabin.id, { address: e.target.value || null }))
            }
          />
        </div>
        <div>
          <span className="label">Capacity</span>
          <input
            type="number"
            min={0}
            className="input sm:w-28"
            defaultValue={cabin.capacity}
            onBlur={(e) =>
              Number(e.target.value) !== cabin.capacity &&
              run(() => updateCabin(cabin.id, { capacity: Number(e.target.value) }))
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className={over ? "font-semibold text-red-600" : "text-brand-500"}>
          {occupants.length}
          {cabin.capacity > 0 ? ` / ${cabin.capacity}` : ""} men
        </span>
        {occupants.length > 0 && !hasHost && (
          <span className="font-medium text-amber-700">No cabin host assigned</span>
        )}
      </div>

      {occupants.length > 0 && (
        <ul className="divide-y divide-brand-50">
          {occupants.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 py-2">
              <div>
                <span className="text-sm font-medium text-brand-800">{a.name}</span>
                <span className="ml-2 text-xs text-brand-400">{formatPhone(a.phone)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    run(() => updateAttendee(a.id, { is_cabin_host: !a.is_cabin_host }))
                  }
                  className={`badge ${
                    a.is_cabin_host
                      ? "bg-olive-600 text-white"
                      : "bg-brand-50 text-brand-500 ring-1 ring-brand-200"
                  }`}
                >
                  {a.is_cabin_host ? "Host" : "Make Host"}
                </button>
                <button
                  onClick={() =>
                    run(() => updateAttendee(a.id, { cabin_id: null, is_cabin_host: false }))
                  }
                  className="text-xs text-brand-400 underline hover:text-red-600"
                >
                  remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <span className="label">Assign a member</span>
        <select
          className="input"
          value=""
          onChange={(e) => {
            if (e.target.value)
              run(() => updateAttendee(e.target.value, { cabin_id: cabin.id }));
          }}
        >
          <option value="">+ Add a member…</option>
          {unassigned.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {unassigned.length === 0 && (
          <p className="mt-1 text-xs text-brand-400">
            Everyone is already assigned to a cabin.
          </p>
        )}
      </div>
    </div>
  );
}

function AddCabin() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState(10);

  function add() {
    if (name.trim().length < 1) return;
    start(async () => {
      await createCabin(name.trim(), capacity, address.trim());
      setName("");
      setAddress("");
      router.refresh();
    });
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-brand-800">Add a Cabin</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Cabin name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="flex items-end gap-3">
        <div>
          <span className="label">Capacity</span>
          <input
            className="input w-28"
            type="number"
            min={0}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>
        <button onClick={add} className="btn-primary" disabled={pending}>
          Add Cabin
        </button>
      </div>
    </div>
  );
}
