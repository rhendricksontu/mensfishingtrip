"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFishingGroup, updateFishingGroup } from "@/app/admin/actions";
import { SESSION_LABELS } from "@/lib/config";
import type { Attendee, FishingGroup, FishingSession } from "@/lib/types";

const SESSIONS: FishingSession[] = ["saturday_morning", "saturday_afternoon"];

export default function FishingClient({
  groups,
  attendees,
}: {
  groups: FishingGroup[];
  attendees: Attendee[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className={`space-y-6 ${pending ? "opacity-70" : ""}`}>
      {SESSIONS.map((session) => {
        const sessionGroups = groups.filter((g) => g.session === session);
        const inSession = attendees.filter((a) => a.assigned_session === session);
        const unassignedToGroup = inSession.filter((a) => !a.fishing_group_id);

        return (
          <section key={session}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-brand-700">{SESSION_LABELS[session]}</h2>
              <span className="text-sm text-brand-500">{inSession.length} men</span>
            </div>

            <div className="space-y-3">
              {sessionGroups.map((g) => {
                const members = attendees.filter((a) => a.fishing_group_id === g.id);
                return (
                  <GroupCard
                    key={g.id}
                    group={g}
                    members={members}
                    onSave={(patch) =>
                      start(async () => {
                        await updateFishingGroup(g.id, patch);
                        router.refresh();
                      })
                    }
                  />
                );
              })}

              {unassignedToGroup.length > 0 && (
                <div className="card border border-dashed border-amber-200 bg-amber-50/40 text-sm">
                  <span className="font-semibold text-amber-800">
                    {unassignedToGroup.length} in this session without a group:
                  </span>{" "}
                  <span className="text-brand-600">
                    {unassignedToGroup.map((a) => a.name).join(", ")}
                  </span>
                  <p className="mt-1 text-xs text-brand-500">Assign groups on the Roster tab.</p>
                </div>
              )}

              <AddGroup
                session={session}
                onAdd={(name, guide, cap) =>
                  start(async () => {
                    await createFishingGroup(name, session, guide, cap);
                    router.refresh();
                  })
                }
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GroupCard({
  group,
  members,
  onSave,
}: {
  group: FishingGroup;
  members: Attendee[];
  onSave: (patch: { guide_name?: string; capacity?: number }) => void;
}) {
  const [guide, setGuide] = useState(group.guide_name ?? "");
  const over = group.capacity > 0 && members.length > group.capacity;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-brand-800">{group.name}</h3>
        <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
          {members.length}
          {group.capacity > 0 ? ` / ${group.capacity}` : ""}
        </span>
      </div>

      <div className="mt-2">
        <span className="label">Guide</span>
        <input
          className="input"
          value={guide}
          onChange={(e) => setGuide(e.target.value)}
          onBlur={() => guide !== (group.guide_name ?? "") && onSave({ guide_name: guide })}
          placeholder="Guide name"
        />
      </div>

      {members.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {members.map((m) => (
            <li key={m.id} className="badge bg-brand-100 text-brand-700">
              {m.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddGroup({
  session,
  onAdd,
}: {
  session: FishingSession;
  onAdd: (name: string, guide: string, capacity: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [guide, setGuide] = useState("");
  const [cap, setCap] = useState(4);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        + Add group to {SESSION_LABELS[session]}
      </button>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <input className="input" placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Guide" value={guide} onChange={(e) => setGuide(e.target.value)} />
        <input className="input" type="number" min={0} placeholder="Capacity" value={cap} onChange={(e) => setCap(Number(e.target.value))} />
      </div>
      <div className="flex gap-2">
        <button
          className="btn-primary"
          onClick={() => {
            if (name.trim()) {
              onAdd(name.trim(), guide.trim(), cap);
              setName(""); setGuide(""); setOpen(false);
            }
          }}
        >
          Add group
        </button>
        <button className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
