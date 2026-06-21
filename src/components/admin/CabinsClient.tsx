"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCabin, updateAttendee } from "@/app/admin/actions";
import { formatPhone } from "@/lib/utils";
import type { Attendee, Cabin } from "@/lib/types";

export default function CabinsClient({
  cabins,
  attendees,
}: {
  cabins: Cabin[];
  attendees: Attendee[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(10);

  const unassigned = attendees.filter((a) => !a.cabin_id);

  function toggleHost(a: Attendee) {
    start(async () => {
      await updateAttendee(a.id, { is_cabin_host: !a.is_cabin_host });
      router.refresh();
    });
  }

  function addCabin() {
    if (name.trim().length < 1) return;
    start(async () => {
      await createCabin(name.trim(), capacity);
      setName("");
      router.refresh();
    });
  }

  return (
    <div className={`space-y-4 ${pending ? "opacity-70" : ""}`}>
      {cabins.map((c) => {
        const people = attendees.filter((a) => a.cabin_id === c.id);
        const hasHost = people.some((a) => a.is_cabin_host);
        const over = c.capacity > 0 && people.length > c.capacity;
        return (
          <div key={c.id} className="card">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-brand-800">{c.name}</h3>
              <span className={`text-sm ${over ? "text-red-600 font-semibold" : "text-brand-500"}`}>
                {people.length}
                {c.capacity > 0 ? ` / ${c.capacity}` : ""} men
              </span>
            </div>

            {people.length > 0 && !hasHost && (
              <p className="mt-1 text-sm font-medium text-amber-700">
                ⚠ No cabin host assigned — pick one below.
              </p>
            )}

            {people.length === 0 ? (
              <p className="mt-2 text-sm text-brand-400">Empty. Assign men from the Roster tab.</p>
            ) : (
              <ul className="mt-2 divide-y divide-brand-50">
                {people.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <span className="text-sm font-medium text-brand-800">{a.name}</span>
                      <span className="ml-2 text-xs text-brand-400">{formatPhone(a.phone)}</span>
                    </div>
                    <button
                      onClick={() => toggleHost(a)}
                      className={`badge ${
                        a.is_cabin_host
                          ? "bg-olive-600 text-white"
                          : "bg-brand-50 text-brand-500 ring-1 ring-brand-200"
                      }`}
                    >
                      {a.is_cabin_host ? "★ Host" : "Make host"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {unassigned.length > 0 && (
        <div className="card border border-dashed border-amber-200 bg-amber-50/40">
          <h3 className="font-semibold text-amber-800">
            {unassigned.length} not yet in a cabin
          </h3>
          <p className="mt-1 text-sm text-brand-600">
            {unassigned.map((a) => a.name).join(", ")}
          </p>
          <p className="mt-2 text-xs text-brand-500">Assign them on the Roster tab.</p>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-brand-800">Add a cabin</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Cabin name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input sm:w-28"
            type="number"
            min={0}
            placeholder="Capacity"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
          <button onClick={addCabin} className="btn-primary" disabled={pending}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
