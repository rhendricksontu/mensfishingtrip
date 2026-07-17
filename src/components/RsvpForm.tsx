"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { submitRsvp, type RsvpState } from "@/app/rsvp/actions";
import { DEPARTURE_TIME_OPTIONS, ACTIVITY_OPTIONS, PAYMENT } from "@/lib/config";
import PhoneInput from "@/components/PhoneInput";
import PasswordInput from "@/components/PasswordInput";
import SelectWithOther from "@/components/SelectWithOther";

const initialState: RsvpState = { ok: false };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending || disabled}>
      {pending ? "Creating Your Account…" : "Submit RSVP & Create Account"}
    </button>
  );
}

export default function RsvpForm() {
  const [state, formAction] = useFormState(submitRsvp, initialState);
  const [ridePref, setRidePref] = useState("");
  const [willingToDrive, setWillingToDrive] = useState(false);
  const [otherActivity, setOtherActivity] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const [formValid, setFormValid] = useState(false);
  // Defer to the next frame so controlled fields (the formatted phone inputs)
  // have committed their value before we read checkValidity().
  const recheck = () => {
    requestAnimationFrame(() => setFormValid(formRef.current?.checkValidity() ?? false));
  };
  // Re-check when conditional fields (driver / activity options) appear or disappear.
  useEffect(() => { recheck(); }, [ridePref, willingToDrive, otherActivity]);

  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form ref={formRef} action={formAction} onInput={recheck} className="card space-y-5">
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

      <fieldset className="rounded-lg border border-brand-100 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">User Information</legend>
        <div className="space-y-4">
          <Field label="First & Last Name" error={err("name")}>
            <input name="name" className="input" autoComplete="name" required />
          </Field>
          <Field label="Do you want to fish with a guide?" error={err("fish_with_guide")}>
            <p className="mb-1 text-xs text-brand-500">(Fishing Guides, Select &quot;No&quot;)</p>
            <select name="fish_with_guide" className="input" defaultValue="" required>
              <option value="" disabled>Select One</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-600">
            You&apos;ll use your cell phone &amp; this password to check your fishing trip info later.
          </p>
          <Field label="Cell Phone (Your Username)" error={err("phone")}>
            <PhoneInput name="phone" required />
          </Field>
          <Field label="Create a Password" error={err("password")}>
            <PasswordInput name="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-brand-100 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Emergency Contact</legend>
        <div className="space-y-4">
          <Field label="Contact Name" error={err("emergency_contact_name")}>
            <input name="emergency_contact_name" className="input" required />
          </Field>
          <Field label="Contact Phone" error={err("emergency_contact_phone")}>
            <PhoneInput name="emergency_contact_phone" required autoComplete="off" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-brand-100 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Travel Preferences</legend>
        <div className="space-y-4">

      <Field label="Ride Preference" error={err("ride_preference")}>
        <select
          name="ride_preference"
          className="input"
          defaultValue=""
          required
          onChange={(e) => setRidePref(e.target.value)}
        >
          <option value="" disabled>Select One</option>
          <option value="driving">Driver</option>
          <option value="riding">Passenger</option>
          <option value="either">Either</option>
        </select>
      </Field>

      {(ridePref === "driving" || ridePref === "either") && (
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
            <Field label="Passenger Seats Available (Not Counting You)" error={err("seat_capacity")}>
              <input name="seat_capacity" type="number" inputMode="numeric" min={0} max={20} className="input" defaultValue={3} />
            </Field>
          )}
        </div>
      )}

      <Field label="Preferred Departure Time" error={err("departure_time")}>
        <SelectWithOther name="departure_time" options={DEPARTURE_TIME_OPTIONS} required />
      </Field>

      {ridePref !== "driving" && (
        <Field label="Preferred Driver" error={err("preferred_driver")}>
          <input name="preferred_driver" className="input" placeholder="Who you'd like to ride with (optional)" maxLength={100} />
        </Field>
      )}

        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-brand-100 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Activity Interest</legend>
        <p className="mb-3 text-xs text-brand-500">Optional — check any you&apos;d be interested in.</p>
        <div className="space-y-3">
          {ACTIVITY_OPTIONS.map((a) => (
            <label key={a.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                name="activities"
                value={a.value}
                className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-brand-800">{a.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={otherActivity}
              onChange={(e) => setOtherActivity(e.target.checked)}
              className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-brand-800">Other</span>
          </label>
          {otherActivity && (
            <Field label="Please Specify" error={err("activity_other")}>
              <input name="activity_other" className="input" placeholder="What activity?" maxLength={200} required />
            </Field>
          )}
        </div>
      </fieldset>

      <SubmitButton disabled={!formValid} />

      <p className="text-center text-xs text-brand-400">
        After you submit, remember the ${PAYMENT.amount} fishing trip cost. Venmo {PAYMENT.venmoHandle}.
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
