"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCabin,
  updateCabin,
  deleteCabin,
  updateAttendee,
} from "@/app/admin/actions";
import { formatPhone, addressLines, addressOneLine } from "@/lib/utils";
import MapLink from "@/components/MapLink";
import type { Attendee, Cabin } from "@/lib/types";

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

// Best-effort split of a legacy free-text address into structured parts so the
// edit form is pre-filled instead of blank for cabins saved before the change.
function parseLegacyAddress(raw: string): {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
} {
  const empty = { address1: "", address2: "", city: "", state: "", zip: "" };
  const parts = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return empty;
  if (parts.length === 1) return { ...empty, address1: parts[0] };

  const last = parts[parts.length - 1];
  const stateZip = last.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (stateZip) {
    const street = parts.slice(0, parts.length - 2);
    return {
      address1: street[0] ?? "",
      address2: street.slice(1).join(", "),
      city: parts[parts.length - 2] ?? "",
      state: stateZip[1].toUpperCase(),
      zip: stateZip[2],
    };
  }
  const street = parts.slice(0, parts.length - 1);
  return {
    ...empty,
    address1: street[0] ?? "",
    address2: street.slice(1).join(", "),
    city: last,
  };
}

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

      {unassigned.length > 0 && (
        <UnassignedNote
          count={unassigned.length}
          label="not in a cabin yet"
          people={unassigned}
        />
      )}

      <AddCabin />
    </div>
  );
}

// Amber exposure of members still needing an assignment, stacked one per line.
function UnassignedNote({
  count,
  label,
  people,
}: {
  count: number;
  label: string;
  people: Attendee[];
}) {
  return (
    <div className="card border border-dashed border-amber-200 bg-amber-50/40 text-sm">
      <p className="font-semibold text-amber-800">
        {count} {label}
      </p>
      <ul className="mt-1.5 space-y-1">
        {people.map((a) => (
          <li key={a.id}>
            <span className="font-medium text-brand-800">{a.name}</span>
            <span className="ml-2 text-xs text-brand-400">{formatPhone(a.phone)}</span>
          </li>
        ))}
      </ul>
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
  const [editing, setEditing] = useState(false);
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  // Pre-fill edit fields: use structured parts when present, else parse the
  // legacy single-field address so editing shows the current address.
  const hasStructured = Boolean(
    cabin.address1 || cabin.address2 || cabin.city || cabin.state || cabin.zip
  );
  const legacy = hasStructured
    ? { address1: "", address2: "", city: "", state: "", zip: "" }
    : parseLegacyAddress(cabin.address ?? "");

  const host = occupants.find((a) => a.is_cabin_host) ?? null;
  const over = cabin.capacity > 0 && occupants.length > cabin.capacity;
  const lines = addressLines(cabin);
  const mapQuery = addressOneLine(cabin);

  return (
    <div className={`card space-y-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-brand-800">{cabin.name}</h3>
          {!editing && lines.length > 0 && (
            <div className="text-sm text-brand-600">
              {lines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit cabin"
            className="text-brand-400 hover:text-brand-700"
          >
            <EditIcon />
          </button>
        )}
      </div>

      {/* Read view */}
      {!editing && (
        <>
          {mapQuery && (
            <MapLink place={mapQuery} className="btn-secondary">
              Get directions
            </MapLink>
          )}

          {/* Host, styled like the guide listing on the fishing card:
              bold name, phone below, capacity under that. */}
          {host ? (
            <div>
              <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
                Cabin Host
              </span>
              <h3 className="font-bold text-brand-800">{host.name}</h3>
              <p className="text-sm text-brand-600">{formatPhone(host.phone)}</p>
              <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
                {occupants.length}
                {cabin.capacity > 0 ? ` / ${cabin.capacity}` : ""} men
              </span>
            </div>
          ) : (
            <>
              {occupants.length > 0 && (
                <p className="text-sm font-medium text-amber-700">No cabin host assigned</p>
              )}
              <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
                {occupants.length}
                {cabin.capacity > 0 ? ` / ${cabin.capacity}` : ""} men
              </span>
            </>
          )}
          {occupants.some((a) => !a.is_cabin_host) && (
            <ul className="divide-y divide-brand-50">
              {occupants
                .filter((a) => !a.is_cabin_host)
                .map((a) => (
                  <li key={a.id} className="py-2 text-sm">
                    <span className="font-medium text-brand-800">{a.name}</span>
                    <span className="ml-2 text-xs text-brand-400">{formatPhone(a.phone)}</span>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}

      {/* Edit view */}
      {editing && (
        <>
          <div>
            <span className="label">Cabin name</span>
            <input
              className="input"
              defaultValue={cabin.name}
              onBlur={(e) =>
                e.target.value.trim() &&
                e.target.value !== cabin.name &&
                run(() => updateCabin(cabin.id, { name: e.target.value.trim() }))
              }
            />
          </div>
          <div className="space-y-3">
            <div>
              <span className="label">Address 1</span>
              <input
                className="input"
                defaultValue={cabin.address1 ?? legacy.address1}
                placeholder="Street address"
                onBlur={(e) =>
                  e.target.value.trim() !== (cabin.address1 ?? "") &&
                  run(() => updateCabin(cabin.id, { address1: e.target.value.trim() || null }))
                }
              />
            </div>
            <div>
              <span className="label">Address 2</span>
              <input
                className="input"
                defaultValue={cabin.address2 ?? legacy.address2}
                placeholder="Apt, suite, unit (optional)"
                onBlur={(e) =>
                  e.target.value.trim() !== (cabin.address2 ?? "") &&
                  run(() => updateCabin(cabin.id, { address2: e.target.value.trim() || null }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
              <div>
                <span className="label">City</span>
                <input
                  className="input"
                  defaultValue={cabin.city ?? legacy.city}
                  placeholder="City"
                  onBlur={(e) =>
                    e.target.value.trim() !== (cabin.city ?? "") &&
                    run(() => updateCabin(cabin.id, { city: e.target.value.trim() || null }))
                  }
                />
              </div>
              <div>
                <span className="label">State</span>
                <input
                  className="input"
                  defaultValue={cabin.state ?? legacy.state}
                  placeholder="State"
                  onBlur={(e) =>
                    e.target.value.trim() !== (cabin.state ?? "") &&
                    run(() => updateCabin(cabin.id, { state: e.target.value.trim() || null }))
                  }
                />
              </div>
              <div>
                <span className="label">Zip Code</span>
                <input
                  className="input"
                  inputMode="numeric"
                  defaultValue={cabin.zip ?? legacy.zip}
                  placeholder="Zip"
                  onBlur={(e) =>
                    e.target.value.trim() !== (cabin.zip ?? "") &&
                    run(() => updateCabin(cabin.id, { zip: e.target.value.trim() || null }))
                  }
                />
              </div>
            </div>
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
                  {a.name} · {formatPhone(a.phone)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between gap-2 border-t border-brand-50 pt-3">
            <button
              onClick={() => {
                if (confirm(`Delete ${cabin.name}? Occupants will be unassigned.`)) {
                  run(() => deleteCabin(cabin.id));
                }
              }}
              className="btn-danger"
            >
              Delete
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary">
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AddCabin() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip, setZip] = useState("");
  const [capacity, setCapacity] = useState(15);

  function add() {
    if (name.trim().length < 1) return;
    start(async () => {
      await createCabin(name.trim(), capacity, {
        address1: address1.trim() || null,
        address2: address2.trim() || null,
        city: city.trim() || null,
        state: stateField.trim() || null,
        zip: zip.trim() || null,
      });
      setName("");
      setAddress1("");
      setAddress2("");
      setCity("");
      setStateField("");
      setZip("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        + Add a Cabin
      </button>
    );
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-brand-800">Add a Cabin</h3>
      <div className="space-y-3">
        <input className="input" placeholder="Cabin name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Address 1 (street address)" value={address1} onChange={(e) => setAddress1(e.target.value)} />
        <input className="input" placeholder="Address 2 (apt, suite, unit — optional)" value={address2} onChange={(e) => setAddress2(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input className="input" placeholder="State" value={stateField} onChange={(e) => setStateField(e.target.value)} />
          <input className="input" inputMode="numeric" placeholder="Zip Code" value={zip} onChange={(e) => setZip(e.target.value)} />
        </div>
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
        <button onClick={() => setOpen(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
