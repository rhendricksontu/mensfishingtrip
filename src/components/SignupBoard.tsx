"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { addSignup, removeSignup, type SignupState } from "@/app/signups/actions";
import type { Signup, SignupRole } from "@/lib/types";

const initial: SignupState = { ok: false };

const ROLES: { key: SignupRole; label: string }[] = [
  { key: "breakfast_cook", label: "Breakfast Cook" },
  { key: "coffee_maker", label: "Coffee Maker" },
];
const DAYS = [
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function AddButton({ label = "Sign Up" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Adding…" : label}
    </button>
  );
}

export default function SignupBoard({
  signups,
  guideCount,
}: {
  signups: Signup[];
  guideCount: number;
}) {
  const [state, formAction] = useFormState(addSignup, initial);
  const [guideState, guideAction] = useFormState(addSignup, initial);
  const [removing, setRemoving] = useState<string | null>(null);

  const cell = (role: SignupRole, day: string) =>
    signups.filter((s) => s.role === role && s.trip_day === day);

  const guideLunches = signups.filter((s) => s.role === "guide_lunch");
  const committed = guideLunches.reduce((sum, s) => sum + (s.quantity || 1), 0);

  async function handleRemove(id: string) {
    if (!confirm("Remove this signup?")) return;
    setRemoving(id);
    await removeSignup(id);
    setRemoving(null);
  }

  return (
    <div className="space-y-8">
      {/* Breakfast & coffee */}
      <div className="space-y-6">
        <form action={formAction} className="card space-y-4">
          <h2 className="font-bold text-brand-800">Volunteer for a slot</h2>
          {state.error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
          )}
          {state.ok && (
            <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
              Thanks! You&apos;re on the list.
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
            <h2 className="mb-3 text-lg font-bold text-brand-700">{role.label}s</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {DAYS.map((day) => {
                const people = cell(role.key, day.key);
                return (
                  <div key={day.key} className="card">
                    <h3 className="font-semibold text-brand-800">{day.label}</h3>
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
        ))}
      </div>

      {/* Guide sack lunches */}
      <section>
        <h2 className="mb-1 text-lg font-bold text-brand-700">Guide Sack Lunches</h2>
        <p className="mb-3 text-sm text-brand-600">
          Each fishing guide gets a sack lunch on Saturday with{" "}
          <span className="font-semibold">two sandwiches and snacks</span>.
          {guideCount > 0 && (
            <>
              {" "}We have <span className="font-semibold">{guideCount}</span> guide
              {guideCount === 1 ? "" : "s"} this year.
            </>
          )}
        </p>

        <div className="card space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold text-brand-800">
              {committed} lunch{committed === 1 ? "" : "es"} committed
            </span>
            {guideCount > 0 && (
              <span
                className={`text-sm font-medium ${committed >= guideCount ? "text-olive-700" : "text-amber-700"}`}
              >
                {committed >= guideCount ? "All covered" : `${guideCount - committed} still needed`}
              </span>
            )}
          </div>

          {guideLunches.length === 0 ? (
            <p className="text-sm text-brand-400">No one yet. Be the first!</p>
          ) : (
            <ul className="space-y-1.5">
              {guideLunches.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-brand-800">
                    {p.name}: <span className="text-brand-600">{p.quantity} lunch{p.quantity === 1 ? "" : "es"}</span>
                  </span>
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

          <form action={guideAction} className="space-y-3 border-t border-brand-50 pt-4">
            <input type="hidden" name="role" value="guide_lunch" />
            <input type="hidden" name="trip_day" value="saturday" />
            {guideState.error && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{guideState.error}</div>
            )}
            {guideState.ok && (
              <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
                Thanks for making guide lunches!
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div>
                <span className="label">Your name</span>
                <input name="name" className="input" required autoComplete="name" />
              </div>
              <div>
                <span className="label">How many lunches?</span>
                <input
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={50}
                  defaultValue={1}
                  className="input sm:w-28"
                />
              </div>
              <AddButton label="Sign Up" />
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
