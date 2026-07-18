"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignHelper, removeSignup } from "@/app/signups/actions";
import PhoneLink from "@/components/PhoneLink";
import type { Signup, SignupLeader, SignupRole } from "@/lib/types";

interface Member {
  id: string;
  name: string;
  phone: string;
}

// `min` is the number of helpers needed per day for each role.
const ROLES: { key: SignupRole; label: string; min: number }[] = [
  { key: "breakfast_cook", label: "Breakfast Cook", min: 4 },
  { key: "coffee_maker", label: "Coffee Maker", min: 4 },
  { key: "guide_lunch", label: "Guide Lunch Maker", min: 4 },
];

const DAYS = [
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

// The card instances for a role. Guide lunches are Saturday-only; coffee makers
// and breakfast cooks are each one combined crew (same people both mornings).
function instancesForRole(role: SignupRole): { key: string; label: string }[] {
  if (role === "guide_lunch") return [{ key: "saturday", label: "Saturday" }];
  if (role === "coffee_maker" || role === "breakfast_cook")
    return [{ key: "both", label: "Saturday & Sunday" }];
  return DAYS;
}

export default function SignupBoard({
  signups,
  leaders,
  members,
  phoneById,
  currentAttendeeId,
  isAdmin,
}: {
  signups: Signup[];
  leaders: SignupLeader[];
  members: Member[];
  phoneById: Record<string, string>;
  currentAttendeeId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [, start] = useTransition();

  const memberById = new Map(members.map((m) => [m.id, m]));
  const leaderByKey = new Map(
    leaders.filter((l) => l.attendee_id).map((l) => [`${l.role}:${l.trip_day}`, l.attendee_id!])
  );

  // Admin, or the leader of this specific instance, may add/remove helpers.
  const canManage = (key: string) =>
    isAdmin || (currentAttendeeId !== null && leaderByKey.get(key) === currentAttendeeId);

  function assign(r: SignupRole, d: string, memberId: string) {
    if (!memberId) return;
    start(async () => {
      const res = await assignHelper(r, d, memberId);
      if (!res.ok) alert(res.error ?? "Could not assign volunteer.");
      router.refresh();
    });
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this volunteer?")) return;
    setRemoving(id);
    const res = await removeSignup(id);
    setRemoving(null);
    if (!res.ok) alert(res.error ?? "Could not remove this volunteer.");
    else router.refresh();
  }

  const cell = (roleKey: SignupRole, dayKey: string) =>
    signups.filter((s) => s.role === roleKey && s.trip_day === dayKey);

  const byKey = (k: SignupRole) => ROLES.find((r) => r.key === k)!;

  const renderRole = (roleObj: { key: SignupRole; label: string; min: number }) => {
        // Admins see every instance; a leader only sees the ones they lead.
        const days = instancesForRole(roleObj.key).filter(
          (d) => isAdmin || leaderByKey.get(`${roleObj.key}:${d.key}`) === currentAttendeeId
        );
        if (days.length === 0) return null;
        return (
          <section key={roleObj.key}>
            <h2 className="mb-3 text-lg font-bold text-brand-700">{roleObj.label}s</h2>
            <div className="space-y-3">
              {days.map((d) => {
                const key = `${roleObj.key}:${d.key}`;
                const people = cell(roleObj.key, d.key);
                const met = people.length >= roleObj.min;
                const manage = canManage(key);
                const leaderId = leaderByKey.get(key) ?? null;
                const leader = leaderId ? memberById.get(leaderId) : null;
                const inInstance = new Set(people.map((p) => p.attendee_id));
                const available = members.filter((m) => !inInstance.has(m.id));

                return (
                  <div key={d.key} className="card">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-brand-800">{d.label}</h3>
                      <span
                        className={`badge ${met ? "bg-olive-100 text-olive-800" : "bg-amber-100 text-amber-800"}`}
                      >
                        {people.length} of {roleObj.min}
                      </span>
                    </div>
                    <p className={`mt-1 text-xs font-medium ${met ? "text-olive-700" : "text-amber-700"}`}>
                      {met ? "Minimum Met" : `${roleObj.min - people.length} More Needed`}
                    </p>

                    {/* Leader (set by organizers on the Organizer › Volunteers tab) */}
                    <div className="mt-2 border-t border-brand-50 pt-2">
                      {leader ? (
                        <p className="text-sm">
                          <span className="badge mr-1 bg-olive-600 text-white">Leader</span>
                          <span className="font-medium text-brand-800">{leader.name}</span>
                          <PhoneLink
                            phone={leader.phone}
                            className="ml-2 text-xs text-brand-400 underline"
                          />
                        </p>
                      ) : (
                        <p className="text-xs text-brand-400">No leader assigned yet.</p>
                      )}
                    </div>

                    {/* Volunteers */}
                    {people.length === 0 ? (
                      <p className="mt-2 text-sm text-brand-400">No volunteers yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {people.map((p) => (
                          <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                            <span>
                              <span className="font-medium text-brand-800">
                                {p.name}
                                {p.attendee_id && p.attendee_id === currentAttendeeId && " (You)"}
                              </span>
                              {p.attendee_id && phoneById[p.attendee_id] && (
                                <PhoneLink
                                  phone={phoneById[p.attendee_id]}
                                  className="ml-2 text-xs text-brand-400 underline"
                                />
                              )}
                            </span>
                            {manage && (
                              <button
                                onClick={() => handleRemove(p.id)}
                                disabled={removing === p.id}
                                className="text-xs text-brand-400 underline hover:text-red-600"
                              >
                                {removing === p.id ? "…" : "Remove"}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Assign a volunteer (leader/admin only) */}
                    {manage && available.length > 0 && (
                      <select
                        className="input mt-2"
                        value=""
                        onChange={(e) => e.target.value && assign(roleObj.key, d.key, e.target.value)}
                      >
                        <option value="">+ Add a volunteer…</option>
                        {available.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
  };

  return (
    <div className="space-y-6">
      {/* Breakfast Cooks and Coffee Makers share a row. */}
      <div className="grid grid-cols-2 items-start gap-3">
        {renderRole(byKey("breakfast_cook"))}
        {renderRole(byKey("coffee_maker"))}
      </div>
      {renderRole(byKey("guide_lunch"))}
    </div>
  );
}
