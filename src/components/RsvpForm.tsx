"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import Link from "next/link";
import { submitRsvp, type RsvpState } from "@/app/rsvp/actions";
import { DEPARTURE_TIME_OPTIONS, PAYMENT } from "@/lib/config";

const initialState: RsvpState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Creating Your Account…" : "Submit RSVP & Create Account"}
    </button>
  );
}

export default function RsvpForm() {
  const [state, formAction] = useFormState(submitRsvp, initialState);
  const [willingToDrive, setWillingToDrive] = useState(false);

  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={formAction} className="card space-y-5">
      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {state.error}{" "}
          {state.error.includes("log in") && (
            <Link href="/login" className="font-semibold underline">
              Go to Log In
            </Link>
          )}
        </div>
      )}

      <Field label="Full name" error={err("name")}>
        <input name="name" className="input" autoComplete="name" required />
      </Field>

      <div className="rounded-lg bg-brand-50 p-4 space-y-4">
        <p className="text-sm font-semibold text-brand-800">
          Your login: you&apos;ll use your cell phone &amp; this password to check your trip info later.
        </p>
        <Field label="Cell phone (your username)" error={err("phone")}>
          <input name="phone" type="tel" inputMode="tel" className="input" autoComplete="tel" placeholder="(555) 123-4567" required />
        </Field>
        <Field label="Create a password" error={err("password")}>
          <input name="password" type="password" className="input" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
        </Field>
      </div>

      <fieldset className="rounded-lg border border-brand-100 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Emergency contact</legend>
        <div className="space-y-4">
          <Field label="Contact name" error={err("emergency_contact_name")}>
            <input name="emergency_contact_name" className="input" required />
          </Field>
          <Field label="Contact phone" error={err("emergency_contact_phone")}>
            <input name="emergency_contact_phone" type="tel" inputMode="tel" className="input" placeholder="(555) 123-4567" required />
          </Field>
        </div>
      </fieldset>

      <Field label="Ride preference" error={err("ride_preference")}>
        <select name="ride_preference" className="input" defaultValue="" required>
          <option value="" disabled>Select one</option>
          <option value="driving">Driver</option>
          <option value="riding">Passenger</option>
        </select>
      </Field>

      <Field label="Preferred departure time" error={err("departure_time")}>
        <select name="departure_time" className="input" defaultValue="">
          <option value="">No preference</option>
          {DEPARTURE_TIME_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>

      <div className="rounded-lg bg-brand-50 p-4 space-y-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="willing_to_drive"
            checked={willingToDrive}
            onChange={(e) => setWillingToDrive(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-brand-800">
            <span className="font-semibold">I&apos;m willing to drive others.</span> I can offer seats in my vehicle.
          </span>
        </label>

        {willingToDrive && (
          <Field label="Passenger seats available (not counting you)" error={err("seat_capacity")}>
            <input name="seat_capacity" type="number" inputMode="numeric" min={0} max={20} className="input" defaultValue={3} />
          </Field>
        )}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="needs_ride"
            className="mt-1 h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-brand-800">
            <span className="font-semibold">I&apos;d like to be partnered with a driver.</span> Match me with someone who has room.
          </span>
        </label>
      </div>

      <Field label="Anything else we should know? (optional)" error={err("notes")}>
        <textarea name="notes" rows={3} className="input" placeholder="Dietary needs, arrival changes, etc." />
      </Field>

      <SubmitButton />

      <p className="text-center text-xs text-brand-400">
        After you submit, remember the ${PAYMENT.amount} trip cost. Venmo {PAYMENT.venmoHandle}.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
