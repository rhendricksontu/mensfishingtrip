"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { addSignup, removeSignup, type SignupState } from "@/app/signups/actions";
import type { Signup, SignupRole } from "@/lib/types";

const initial: SignupState = { ok: false };

const ROLES: { key: SignupRole; label: string; emoji: string }[] = [
  { key: "breakfast_cook", label: "Breakfast Cook", emoji: "🍳" },
  { key: "coffee_maker", label: "Coffee Maker", emoji: "☕" },
];
const DAYS = [
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Adding…" : "Sign up"}
    </button>
  );
}

export default function SignupBoard({ signups }: { signups: Signup[] }) {
  const [state, formAction] = useFormState(addSignup, initial);
  const [removing, setRemoving] = useState<string | null>(null);

  const cell = (role: SignupRole, day: string) =>
    signups.filter((s) => s.role === role && s.trip_day === day);

  async function handleRemove(id: string) {
    if (!confirm("Remove this signup?")) return;
    setRemoving(id);
    await removeSignup(id);
    setRemoving(null);
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="card space-y-4">
        <h2 className="font-bold text-brand-800">Volunteer for a slot</h2>
        {state.error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
        )}
        {state.ok && (
          <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
            Thanks! You&apos;re on the list. 🙌
          </div>
        )}
        <div>
          <span className="label">Your name</span>
          <input name="name" className="input" required autoComplete="name" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="label">Role</span>
            <select name="role" className="input" defaultValue="breakfast_cook">
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Day</span>
            <select name="trip_day" className="input" defaultValue="saturday">
              {DAYS.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
        <AddButton />
      </form>

      {ROLES.map((role) => (
        <section key={role.key}>
          <h2 className="mb-3 text-lg font-bold text-brand-700">
            {role.emoji} {role.label}s
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {DAYS.map((day) => {
              const people = cell(role.key, day.key);
              return (
                <div key={day.key} className="card">
                  <h3 className="font-semibold text-brand-800">{day.label}</h3>
                  {people.length === 0 ? (
                    <p className="mt-2 text-sm text-brand-400">No one yet — be the first!</p>
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
      ))}
    </div>
  );
}
