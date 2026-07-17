"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCabin,
  updateCabin,
  deleteCabin,
  updateAttendee,
  setCabinHost,
  setCabinEventLocation,
} from "@/app/admin/actions";
import { CABIN_EVENT_OPTIONS } from "@/lib/config";
import { formatPhone, addressLines, addressOneLine } from "@/lib/utils";
import { groupByVehicle } from "@/lib/vehicle-groups";
import MapLink from "@/components/MapLink";
import PhoneLink from "@/components/PhoneLink";
import GroupedUnassigned from "@/components/admin/GroupedUnassigned";
import type { Attendee, Cabin, Ride } from "@/lib/types";

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

interface RidePassenger {
  ride_id: string;
  attendee_id: string;
}

export default function CabinsClient({
  cabins,
  attendees,
  rides,
  ridePassengers,
  volunteerAssignments,
}: {
  cabins: Cabin[];
  attendees: Attendee[];
  rides: Ride[];
  ridePassengers: RidePassenger[];
  volunteerAssignments: { attendee_id: string; label: string }[];
}) {
  const unassigned = attendees.filter((a) => !a.cabin_id);

  // Unassigned travelers who are volunteers — surfaced separately, grouped by
  // what they're volunteering for, so they get placed in the right cabin for
  // their duties. They're excluded from the plain card below so each person
  // appears in only one place.
  const volunteerSet = new Set(volunteerAssignments.map((v) => v.attendee_id));
  const unassignedVolunteers = unassigned.filter((a) => volunteerSet.has(a.id));
  const unassignedOthers = unassigned.filter((a) => !volunteerSet.has(a.id));

  const { groups, noGroup } = groupByVehicle(unassignedOthers, attendees, rides, ridePassengers);

  // Group unassigned volunteers by their volunteer assignment (role + day). A
  // person who volunteers for more than one thing appears under each.
  const unassignedById = new Map(unassignedVolunteers.map((a) => [a.id, a]));
  const byLabel = new Map<string, Map<string, Attendee>>();
  for (const { attendee_id, label } of volunteerAssignments) {
    const person = unassignedById.get(attendee_id);
    if (!person) continue;
    if (!byLabel.has(label)) byLabel.set(label, new Map());
    byLabel.get(label)!.set(person.id, person);
  }
  const volunteerGroups = Array.from(byLabel.entries())
    .map(([label, people]) => ({
      label,
      people: Array.from(people.values()).sort((x, y) => x.name.localeCompare(y.name)),
    }))
    // Order by role + day, then put the leader group before its volunteers.
    .sort((a, b) => {
      const baseA = a.label.replace(/ \(Leader\)$/, "");
      const baseB = b.label.replace(/ \(Leader\)$/, "");
      const byBase = baseA.localeCompare(baseB);
      if (byBase !== 0) return byBase;
      const leaderA = a.label.endsWith("(Leader)") ? 0 : 1;
      const leaderB = b.label.endsWith("(Leader)") ? 0 : 1;
      return leaderA - leaderB;
    });

  return (
    <div className="space-y-4">
      {unassignedVolunteers.length > 0 && (
        <GroupedUnassigned
          title="Unassigned Travelers - Volunteers"
          groups={volunteerGroups}
          noGroup={[]}
        />
      )}

      {unassignedOthers.length > 0 && (
        <GroupedUnassigned title="Unassigned Travelers" groups={groups} noGroup={noGroup} />
      )}

      {cabins.map((c) => (
        <CabinCard
          key={c.id}
          cabin={c}
          occupants={attendees.filter((a) => a.cabin_id === c.id)}
          unassigned={unassigned}
        />
      ))}

      <AddCabin travelers={unassigned} />
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
  const [showAddress, setShowAddress] = useState(false);
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
          {!editing && mapQuery && (
            <MapLink
              place={mapQuery}
              className="mt-0.5 inline-block text-sm font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            >
              {lines.join(", ")}
            </MapLink>
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
          {cabin.event_locations?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {CABIN_EVENT_OPTIONS.filter((e) =>
                cabin.event_locations.includes(e.key)
              ).map((e) => (
                <span key={e.key} className="badge bg-brand-100 text-brand-700">
                  {e.label}
                </span>
              ))}
            </div>
          )}
          {/* Host, styled like the guide listing on the fishing card:
              bold name, phone below, capacity under that. */}
          {host ? (
            <div>
              <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
                Cabin Host
              </span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-bold text-brand-800">{host.name}</h3>
                  <PhoneLink phone={host.phone} className="text-brand-400 underline" />
                </span>
                <button
                  onClick={() =>
                    run(() => updateAttendee(host.id, { cabin_id: null, is_cabin_host: false }))
                  }
                  className="shrink-0 text-xs text-brand-400 underline hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
                {occupants.length}
                {cabin.capacity > 0 ? ` / ${cabin.capacity}` : ""} Men
              </span>
            </div>
          ) : (
            <div>
              <span className="mb-1 inline-block rounded-full bg-amber-300 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
                No Host Yet
              </span>
              <p className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
                {occupants.length}
                {cabin.capacity > 0 ? ` / ${cabin.capacity}` : ""} Men
              </p>
            </div>
          )}
          {occupants.some((a) => !a.is_cabin_host) && (
            <ul className="divide-y divide-brand-50">
              {occupants
                .filter((a) => !a.is_cabin_host)
                .map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      <span className="font-medium text-brand-800">{a.name}</span>
                      <PhoneLink phone={a.phone} className="ml-2 text-xs text-brand-400 underline" />
                    </span>
                    <button
                      onClick={() =>
                        run(() => updateAttendee(a.id, { cabin_id: null, is_cabin_host: false }))
                      }
                      className="text-xs text-brand-400 underline hover:text-red-600"
                    >
                      Remove
                    </button>
                  </li>
                ))}
            </ul>
          )}

          {(cabin.capacity === 0 || occupants.length < cabin.capacity) &&
            unassigned.length > 0 && (
              <select
                className="input"
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    run(() => updateAttendee(e.target.value, { cabin_id: cabin.id }));
                }}
              >
                <option value="">+ Add Traveler…</option>
                {unassigned.map((a) => (
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
          <div className="rounded-lg border border-brand-100 p-3">
            <button
              type="button"
              onClick={() => setShowAddress((s) => !s)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span>
                <span className="block text-sm font-medium text-brand-700">Address</span>
                {!showAddress && (
                  <span className="text-sm text-brand-500">
                    {addressOneLine(cabin) || "No address set"}
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-xs font-medium text-brand-500 underline">
                {showAddress ? "Hide" : "Edit"}
              </span>
            </button>
          {showAddress && (
          <div className="mt-3 space-y-3">
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
          )}
          </div>
          {occupants.length > 0 && (
            <div>
              <span className="label">Cabin Host</span>
              <select
                className="input"
                value={host?.id ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  run(async () => {
                    if (v) await setCabinHost(v, true);
                    else if (host) await setCabinHost(host.id, false);
                  });
                }}
              >
                <option value="">No host</option>
                {occupants.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          <div className="rounded-lg border border-brand-100 p-3">
            <span className="label">Location for events</span>
            <p className="mb-2 text-xs text-brand-500">
              These events will use this cabin&apos;s address.
            </p>
            <div className="space-y-2">
              {CABIN_EVENT_OPTIONS.map((ev) => {
                const checked = cabin.event_locations?.includes(ev.key) ?? false;
                return (
                  <label key={ev.key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        run(() => setCabinEventLocation(cabin.id, ev.key, e.target.checked))
                      }
                      className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-brand-800">{ev.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {occupants.length > 0 && (
            <ul className="divide-y divide-brand-50">
              {occupants.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand-800">{a.name}</span>
                    {a.is_cabin_host && (
                      <span className="badge bg-olive-600 text-white">Host</span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      run(() => updateAttendee(a.id, { cabin_id: null, is_cabin_host: false }))
                    }
                    className="text-xs text-brand-400 underline hover:text-red-600"
                  >
                    Remove
                  </button>
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
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddress(false);
                  setEditing(false);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddress(false);
                  setEditing(false);
                }}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AddCabin({ travelers }: { travelers: Attendee[] }) {
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
  const [events, setEvents] = useState<string[]>([]);
  const [hostId, setHostId] = useState("");

  const toggleEvent = (key: string, on: boolean) =>
    setEvents((prev) => (on ? [...prev, key] : prev.filter((k) => k !== key)));

  function add() {
    if (name.trim().length < 1) return;
    start(async () => {
      await createCabin(
        name.trim(),
        capacity,
        {
          address1: address1.trim() || null,
          address2: address2.trim() || null,
          city: city.trim() || null,
          state: stateField.trim() || null,
          zip: zip.trim() || null,
        },
        events,
        hostId || null
      );
      setName("");
      setAddress1("");
      setAddress2("");
      setCity("");
      setStateField("");
      setZip("");
      setEvents([]);
      setHostId("");
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

      <div className="rounded-lg border border-brand-100 p-3">
        <span className="label">Location for events</span>
        <p className="mb-2 text-xs text-brand-500">
          These events will use this cabin&apos;s address.
        </p>
        <div className="space-y-2">
          {CABIN_EVENT_OPTIONS.map((ev) => (
            <label key={ev.key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={events.includes(ev.key)}
                onChange={(e) => toggleEvent(ev.key, e.target.checked)}
                className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-brand-800">{ev.label}</span>
            </label>
          ))}
        </div>
      </div>

      {travelers.length > 0 && (
        <div>
          <span className="label">Cabin Host</span>
          <select
            className="input"
            value={hostId}
            onChange={(e) => setHostId(e.target.value)}
          >
            <option value="">No host</option>
            {travelers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
