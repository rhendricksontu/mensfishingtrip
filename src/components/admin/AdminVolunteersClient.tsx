"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSignupLeader } from "@/app/signups/actions";
import PhoneLink from "@/components/PhoneLink";
import type { SignupLeader, SignupRole } from "@/lib/types";

interface Member {
  id: string;
  name: string;
  phone: string;
}

const ROLES: { key: SignupRole; label: string }[] = [
  { key: "breakfast_cook", label: "Breakfast Cook" },
  { key: "coffee_maker", label: "Coffee Maker" },
  { key: "guide_lunch", label: "Guide Lunch Maker" },
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

export default function AdminVolunteersClient({
  leaders,
  members,
}: {
  leaders: SignupLeader[];
  members: Member[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const memberById = new Map(members.map((m) => [m.id, m]));
  const leaderByKey = new Map(
    leaders.filter((l) => l.attendee_id).map((l) => [`${l.role}:${l.trip_day}`, l.attendee_id!])
  );

  function setLeader(role: SignupRole, trip_day: string, attendeeId: string | null) {
    start(async () => {
      const res = await setSignupLeader(role, trip_day, attendeeId);
      if (!res.ok) alert(res.error ?? "Could not set the leader.");
      router.refresh();
    });
  }

  const renderRole = (role: { key: SignupRole; label: string }) => (
        <section key={role.key}>
          <h2 className="mb-3 text-lg font-bold text-brand-700">{role.label}s</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {instancesForRole(role.key).map((d) => {
              const key = `${role.key}:${d.key}`;
              const leaderId = leaderByKey.get(key) ?? null;
              const leader = leaderId ? memberById.get(leaderId) : null;

              return (
                <div key={d.key} className="card space-y-2">
                  <h3 className="font-semibold text-brand-800">{d.label}</h3>

                  {leader ? (
                    <p className="text-sm">
                      <span className="badge mr-1 bg-olive-600 text-white">Leader</span>
                      <span className="font-medium text-brand-800">{leader.name}</span>
                      <PhoneLink phone={leader.phone} className="ml-2 text-xs text-brand-400 underline" />
                    </p>
                  ) : (
                    <p className="text-xs text-brand-400">No leader assigned yet.</p>
                  )}

                  <div>
                    <span className="label">Leader</span>
                    <select
                      value={leaderId ?? ""}
                      onChange={(e) => setLeader(role.key, d.key, e.target.value || null)}
                      className="input"
                    >
                      <option value="">No leader</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
  );

  return (
    <div className={`space-y-6 ${pending ? "opacity-60" : ""}`}>
      {ROLES.map((r) => renderRole(r))}
    </div>
  );
}
