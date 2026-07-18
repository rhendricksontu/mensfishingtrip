"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFishingGroup,
  updateFishingGroup,
  deleteFishingGroup,
  updateAttendee,
} from "@/app/admin/actions";
import { SESSION_LABELS } from "@/lib/config";
import { formatPhone, shortenPlace, to12Hour, to24Hour } from "@/lib/utils";
import { groupByVehicle } from "@/lib/vehicle-groups";
import PhoneLink from "@/components/PhoneLink";
import GroupedUnassigned from "@/components/admin/GroupedUnassigned";
import type { Attendee, FishingGroup, FishingSession, Ride } from "@/lib/types";

interface TripLocation {
  name: string | null;
  address: string;
}

interface RidePassenger {
  ride_id: string;
  attendee_id: string;
}

const SESSIONS: FishingSession[] = ["saturday_morning", "saturday_afternoon"];

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function FishingClient({
  groups,
  attendees,
  locations,
  rides,
  ridePassengers,
}: {
  groups: FishingGroup[];
  attendees: Attendee[];
  locations: TripLocation[];
  rides: Ride[];
  ridePassengers: RidePassenger[];
}) {
  // Only members who said yes to fishing with a guide can be assigned.
  const unassigned = attendees.filter((a) => !a.fishing_group_id && a.fish_with_guide);
  const grouped = groupByVehicle(unassigned, attendees, rides, ridePassengers);

  return (
    <div className="space-y-8">
      {unassigned.length > 0 && (
        <GroupedUnassigned
          title="Unassigned Anglers"
          groups={grouped.groups}
          noGroup={grouped.noGroup}
        />
      )}

      {SESSIONS.map((session) => {
        const guides = groups.filter((g) => g.session === session);
        return (
          <section key={session} className="space-y-3">
            <h2 className="text-lg font-bold text-brand-700">{SESSION_LABELS[session]}</h2>
            {guides.length === 0 && (
              <p className="text-sm text-brand-400">No guides yet.</p>
            )}
            {guides.map((g) => (
              <GuideCard
                key={g.id}
                guide={g}
                members={attendees.filter((a) => a.fishing_group_id === g.id)}
                unassigned={unassigned}
                session={session}
                locations={locations}
              />
            ))}
          </section>
        );
      })}

      <AddGuide attendees={attendees} locations={locations} />
    </div>
  );
}

function GuideCard({
  guide,
  members,
  unassigned,
  session,
  locations,
}: {
  guide: FishingGroup;
  members: Attendee[];
  unassigned: Attendee[];
  session: FishingSession;
  locations: TripLocation[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  const over = guide.capacity > 0 && members.length > guide.capacity;
  const guideName = guide.guide_name || guide.name;

  return (
    <div className={`card space-y-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {!editing && (
            <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
              Fishing Guide
            </span>
          )}
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-bold text-brand-800">{guideName}</h3>
            {!editing && guide.guide_phone && (
              <PhoneLink phone={guide.guide_phone} className="text-brand-400 underline" />
            )}
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit guide"
            className="text-brand-400 hover:text-brand-700"
          >
            <EditIcon />
          </button>
        )}
      </div>

      {/* Read view */}
      {!editing && (
        <>
          <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
            {members.length}
            {guide.capacity > 0 ? ` / ${guide.capacity}` : ""} Anglers
          </span>
          {(guide.meet_location || guide.meet_time) && (
            <p className="text-sm text-brand-600">
              Meet:{" "}
              <span className="font-medium text-brand-800">
                {[
                  guide.meet_location_name ||
                    (guide.meet_location ? shortenPlace(guide.meet_location) : null),
                  guide.meet_time,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </p>
          )}
          {members.length > 0 && (
            <ul className="divide-y divide-brand-50">
              {members.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    <span className="font-medium text-brand-800">{a.name}</span>
                    <PhoneLink phone={a.phone} className="ml-2 text-xs text-brand-400 underline" />
                  </span>
                  <button
                    onClick={() =>
                      run(() =>
                        updateAttendee(a.id, { fishing_group_id: null, assigned_session: null })
                      )
                    }
                    className="text-xs text-brand-400 underline hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {(guide.capacity === 0 || members.length < guide.capacity) &&
            unassigned.length > 0 && (
              <select
                className="input"
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    run(() =>
                      updateAttendee(e.target.value, {
                        fishing_group_id: guide.id,
                        assigned_session: session,
                      })
                    );
                }}
              >
                <option value="">+ Add Angler…</option>
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
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <span className="label">Guide Name</span>
              <input
                className="input"
                defaultValue={guideName}
                placeholder="Guide Name"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== guideName)
                    run(() => updateFishingGroup(guide.id, { name: v, guide_name: v }));
                }}
              />
            </div>
            <div>
              <span className="label">Capacity</span>
              <input
                type="number"
                min={0}
                className="input w-24"
                defaultValue={guide.capacity}
                onBlur={(e) =>
                  Number(e.target.value) !== guide.capacity &&
                  run(() => updateFishingGroup(guide.id, { capacity: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div>
            <span className="label">Guide Phone</span>
            <input
              className="input"
              type="tel"
              inputMode="tel"
              defaultValue={guide.guide_phone ?? ""}
              placeholder="(555) 123-4567"
              onBlur={(e) =>
                e.target.value !== (guide.guide_phone ?? "") &&
                run(() =>
                  updateFishingGroup(guide.id, {
                    guide_phone: e.target.value ? formatPhone(e.target.value) : null,
                  })
                )
              }
            />
          </div>
          <div>
            <span className="label">Meeting Location</span>
            <select
              className="input"
              value={guide.meet_location ?? ""}
              onChange={(e) => {
                const opt = locations.find((o) => o.address === e.target.value);
                run(() =>
                  updateFishingGroup(guide.id, {
                    meet_location: opt?.address || null,
                    meet_location_name: opt?.name || null,
                  })
                );
              }}
            >
              <option value="">No meeting location</option>
              {locations.map((o) => (
                <option key={o.address} value={o.address}>
                  {o.name ? `${o.name} · ${shortenPlace(o.address)}` : shortenPlace(o.address)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Meeting Time</span>
            <input
              type="time"
              className="input"
              defaultValue={to24Hour(guide.meet_time ?? "")}
              onBlur={(e) => {
                const label = e.target.value ? to12Hour(e.target.value) : null;
                if (label !== (guide.meet_time ?? null))
                  run(() => updateFishingGroup(guide.id, { meet_time: label }));
              }}
            />
          </div>

          {members.length > 0 && (
            <ul className="divide-y divide-brand-50">
              {members.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <span className="text-sm font-medium text-brand-800">{a.name}</span>
                  </div>
                  <button
                    onClick={() =>
                      run(() =>
                        updateAttendee(a.id, { fishing_group_id: null, assigned_session: null })
                      )
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
            <span className="label">Assign a Member</span>
            <select
              className="input"
              value=""
              onChange={(e) => {
                if (e.target.value)
                  run(() =>
                    updateAttendee(e.target.value, {
                      fishing_group_id: guide.id,
                      assigned_session: session,
                    })
                  );
              }}
            >
              <option value="">+ Add a Member…</option>
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
                if (confirm(`Delete guide ${guideName}? Members will be unassigned.`)) {
                  run(async () => {
                    for (const m of members) {
                      await updateAttendee(m.id, { fishing_group_id: null, assigned_session: null });
                    }
                    await deleteFishingGroup(guide.id);
                  });
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

type GuideWhen = FishingSession | "both";
const OTHER = "__other__";

function AddGuide({
  attendees,
  locations,
}: {
  attendees: Attendee[];
  locations: TripLocation[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  // Either a member id, OTHER (non-member), or "" (nothing picked yet).
  const [who, setWho] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cap, setCap] = useState(2);
  const [when, setWhen] = useState<GuideWhen>("both");
  const [meet, setMeet] = useState(""); // selected meet address
  const [timeAM, setTimeAM] = useState(""); // morning meet time, 24h HH:MM
  const [timePM, setTimePM] = useState(""); // afternoon meet time, 24h HH:MM

  const members = [...attendees].sort((a, b) => a.name.localeCompare(b.name));

  function reset() {
    setWho("");
    setName("");
    setPhone("");
    setCap(4);
    setWhen("both");
    setMeet("");
    setTimeAM("");
    setTimePM("");
    setOpen(false);
  }

  function add() {
    let guideName: string;
    let guidePhone: string | undefined;
    let guideId: string | undefined;

    if (who === OTHER) {
      if (name.trim().length < 1) return;
      guideName = name.trim();
      guidePhone = phone.trim() ? formatPhone(phone.trim()) : undefined;
      guideId = undefined;
    } else if (who) {
      const m = attendees.find((a) => a.id === who);
      if (!m) return;
      guideName = m.name;
      guidePhone = m.phone;
      guideId = m.id;
    } else {
      return; // nothing selected
    }

    const meetOpt = locations.find((o) => o.address === meet);
    const sessions: FishingSession[] =
      when === "both" ? ["saturday_morning", "saturday_afternoon"] : [when];
    start(async () => {
      for (const s of sessions) {
        const t = s === "saturday_morning" ? timeAM : timePM;
        await createFishingGroup(
          guideName,
          s,
          guideName,
          cap,
          guidePhone,
          guideId,
          meetOpt?.address || null,
          meetOpt?.name || null,
          t ? to12Hour(t) : null
        );
      }
      reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        + Add a Guide
      </button>
    );
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-brand-800">Add a Guide</h3>
      <div>
        <span className="label">Guide</span>
        <select className="input" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="">Select a Member…</option>
          {members.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
          <option value={OTHER}>Someone Not on the RSVP List…</option>
        </select>
      </div>

      {who === OTHER && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <span className="label">Guide Name</span>
            <input className="input" placeholder="Guide Name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex-1">
            <span className="label">Guide Phone</span>
            <input className="input" type="tel" inputMode="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <span className="label">Capacity</span>
          <input
            className="input h-11 w-24"
            type="number"
            min={0}
            value={cap}
            onChange={(e) => setCap(Number(e.target.value))}
          />
        </div>
        <div className="flex-1">
          <span className="label">Guiding</span>
          <select className="input h-11" value={when} onChange={(e) => setWhen(e.target.value as GuideWhen)}>
            <option value="both">Both Sessions</option>
            <option value="saturday_morning">Morning Session</option>
            <option value="saturday_afternoon">Afternoon Session</option>
          </select>
        </div>
      </div>

      <div>
        <span className="label">Meeting Location</span>
        <select className="input" value={meet} onChange={(e) => setMeet(e.target.value)}>
          <option value="">No meeting location</option>
          {locations.map((o) => (
            <option key={o.address} value={o.address}>
              {o.name ? `${o.name} · ${shortenPlace(o.address)}` : shortenPlace(o.address)}
            </option>
          ))}
        </select>
      </div>

      {when === "both" ? (
        <div className="flex flex-wrap gap-3">
          <div className="flex-1">
            <span className="label">Morning Meeting Time</span>
            <input type="time" className="input" value={timeAM} onChange={(e) => setTimeAM(e.target.value)} />
          </div>
          <div className="flex-1">
            <span className="label">Afternoon Meeting Time</span>
            <input type="time" className="input" value={timePM} onChange={(e) => setTimePM(e.target.value)} />
          </div>
        </div>
      ) : (
        <div>
          <span className="label">Meeting Time</span>
          <input
            type="time"
            className="input"
            value={when === "saturday_morning" ? timeAM : timePM}
            onChange={(e) =>
              when === "saturday_morning" ? setTimeAM(e.target.value) : setTimePM(e.target.value)
            }
          />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={add} className="btn-primary" disabled={pending}>
          Add Guide
        </button>
        <button onClick={reset} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
