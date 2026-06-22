"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { addSignup, removeSignup, type SignupState } from "@/app/signups/actions";
import type { Signup, SignupRole } from "@/lib/types";

const initial: SignupState = { ok: false };

const ROLES: { key: SignupRole; label: string }[] = [
  { key: "breakfast_cook", label: "Breakfast Cook" },
  { key: "coffee_maker", label: "Coffee Maker" },
  { key: "guide_lunch", label: "Guide Lunch Maker" },
];

const DAYS = [
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

// Guide lunches are Saturday-only; the others run both days.
function daysForRole(role: SignupRole) {
  return role === "guide_lunch" ? DAYS.filter((d) => d.key === "saturday") : DAYS;
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Adding…" : "Sign Up"}
    </button>
  );
}

export default function SignupBoard({ signups }: { signups: Signup[] }) {
  const [state, formAction] = useFormState(addSignup, initial);
  const [removing, setRemoving] = useState<string | null>(null);
  const [role, setRole] = useState<SignupRole>("breakfast_cook");
  const [day, setDay] = useState("saturday");

  const dayOptions = daysForRole(role);

  function handleRoleChange(next: SignupRole) {
    setRole(next);
    if (next === "guide_lunch") setDay("saturday");
  }

  const cell = (roleKey: SignupRole, dayKey: string) =>
    signups.filter((s) => s.role === roleKey && s.trip_day === dayKey);

  async function handleRemove(id: string) {
    if (!confirm("Remove this signup?")) return;
    setRemoving(id);
    await removeSignup(id);
    setRemoving(null);
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="card space-y-4">
        <h2 className="font-bold text-brand-800">Volunteer for a Slot</h2>
        {state.error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
        )}
        {state.ok && (
          <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
            Thanks! You&apos;re on the list.
          </div>
        )}
        <div>
          <span className="label">Your Name</span>
          <input name="name" className="input" required autoComplete="name" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="label">Role</span>
            <select
              name="role"
              className="input"
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as SignupRole)}
            >
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Day</span>
            <select
              name="trip_day"
              className="input"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            >
              {dayOptions.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-center">
          <AddButton />
        </div>
      </form>

      {ROLES.map((roleObj) => {
        const days = daysForRole(roleObj.key);
        const single = days.length === 1;
        return (
        <section key={roleObj.key}>
          <h2 className="mb-3 text-lg font-bold text-brand-700">{roleObj.label}s</h2>
          <div className={single ? "flex justify-center" : "grid gap-3 sm:grid-cols-2"}>
            {days.map((d) => {
              const people = cell(roleObj.key, d.key);
              return (
                <div key={d.key} className={single ? "card w-full sm:w-1/2" : "card"}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-brand-800">{d.label}</h3>
                    <span className="badge bg-brand-100 text-brand-700">
                      {people.length} signed up
                    </span>
                  </div>
                  {people.length === 0 ? (
                    <p className="mt-2 text-sm text-brand-400">No one yet. Be the first!</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {people.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-brand-800">{p.name}</span>
                          <button
                            onClick={() => handleRemove(p.id)}
                            disabled={removing === p.id}
                            className="text-xs text-brand-400 underline hover:text-red-600"
                          >
                            {removing === p.id ? "…" : "remove"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        );
      })}
    </div>
  );
}
