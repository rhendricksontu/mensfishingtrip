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
import { formatPhone } from "@/lib/utils";
import type { Attendee, FishingGroup, FishingSession } from "@/lib/types";

const SESSIONS: FishingSession[] = ["saturday_morning", "saturday_afternoon"];

export default function FishingClient({
  groups,
  attendees,
}: {
  groups: FishingGroup[];
  attendees: Attendee[];
}) {
  const unassigned = attendees.filter((a) => !a.fishing_group_id);

  return (
    <div className="space-y-8">
      {SESSIONS.map((session) => {
        const guides = groups.filter((g) => g.session === session);
        return (
          <section key={session} className="space-y-3">
            <h2 className="text-lg font-bold text-brand-700">{SESSION_LABELS[session]}</h2>
            {guides.map((g) => (
              <GuideCard
                key={g.id}
                guide={g}
                members={attendees.filter((a) => a.fishing_group_id === g.id)}
                unassigned={unassigned}
                session={session}
              />
            ))}
            <AddGuide session={session} />
          </section>
        );
      })}
    </div>
  );
}

function GuideCard({
  guide,
  members,
  unassigned,
  session,
}: {
  guide: FishingGroup;
  members: Attendee[];
  unassigned: Attendee[];
  session: FishingSession;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
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
        <input
          className="input flex-1 font-semibold"
          defaultValue={guideName}
          placeholder="Guide name"
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== guideName)
              run(() => updateFishingGroup(guide.id, { name: v, guide_name: v }));
          }}
        />
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
          className="btn-danger shrink-0"
        >
          Delete
        </button>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="label">Capacity</span>
          <input
            type="number"
            min={0}
            className="input w-28"
            defaultValue={guide.capacity}
            onBlur={(e) =>
              Number(e.target.value) !== guide.capacity &&
              run(() => updateFishingGroup(guide.id, { capacity: Number(e.target.value) }))
            }
          />
        </div>
        <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
          {members.length}
          {guide.capacity > 0 ? ` / ${guide.capacity}` : ""} anglers
        </span>
      </div>

      {members.length > 0 && (
        <ul className="divide-y divide-brand-50">
          {members.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 py-2">
              <div>
                <span className="text-sm font-medium text-brand-800">{a.name}</span>
                <span className="ml-2 text-xs text-brand-400">{formatPhone(a.phone)}</span>
              </div>
              <button
                onClick={() =>
                  run(() => updateAttendee(a.id, { fishing_group_id: null, assigned_session: null }))
                }
                className="text-xs text-brand-400 underline hover:text-red-600"
              >
                remove
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
              run(() =>
                updateAttendee(e.target.value, {
                  fishing_group_id: guide.id,
                  assigned_session: session,
                })
              );
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
          <p className="mt-1 text-xs text-brand-400">Everyone is already assigned to a guide.</p>
        )}
      </div>
    </div>
  );
}

function AddGuide({ session }: { session: FishingSession }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [cap, setCap] = useState(4);

  function add() {
    if (name.trim().length < 1) return;
    start(async () => {
      await createFishingGroup(name.trim(), session, name.trim(), cap);
      setName("");
      router.refresh();
    });
  }

  return (
    <div className="card flex flex-wrap items-end gap-3">
      <div className="flex-1">
        <span className="label">Guide name</span>
        <input className="input" placeholder="Guide name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <span className="label">Capacity</span>
        <input
          className="input w-24"
          type="number"
          min={0}
          value={cap}
          onChange={(e) => setCap(Number(e.target.value))}
        />
      </div>
      <button onClick={add} className="btn-primary" disabled={pending}>
        Add Guide
      </button>
    </div>
  );
}
