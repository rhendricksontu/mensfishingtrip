"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import Link from "next/link";
import { submitRsvp, type RsvpState } from "@/app/rsvp/actions";
import { DEPARTURE_TIME_OPTIONS, PAYMENT } from "@/lib/config";
import type { Attendee } from "@/lib/types";

const initialState: RsvpState = { ok: false };

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Saving…" : editing ? "Save changes" : "Submit RSVP"}
    </button>
  );
}

export default function RsvpForm({ attendee }: { attendee?: Attendee }) {
  const [state, formAction] = useFormState(submitRsvp, initialState);
  const editing = Boolean(attendee);
  const [willingToDrive, setWillingToDrive] = useState(
    attendee?.willing_to_drive ?? false
  );

  const err = (k: string) => state.fieldErrors?.[k];

  if (state.ok) {
    return (
      <div className="card text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-2 text-xl font-bold text-pine-800">
          {state.edited ? "Your RSVP is updated!" : "You're signed up!"}
        </h2>
        <p className="mt-1 text-pine-600">
          Thanks for RSVPing. We&apos;ll assign cabins and fishing groups soon.
        </p>
        <div className="mt-4 rounded-lg bg-pine-50 p-4 text-left">
          <p className="font-semibold text-pine-800">Don&apos;t forget the ${PAYMENT.amount} trip cost</p>
          <p className="mt-1 text-sm text-pine-600">
            Send ${PAYMENT.amount} on Venmo to{" "}
            <span className="font-semibold">{PAYMENT.venmoHandle}</span>.
          </p>
          <a
            href={PAYMENT.venmoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-3"
          >
            Pay ${PAYMENT.amount} on Venmo
          </a>
        </div>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/agenda" className="btn-secondary">View agenda</Link>
          <Link href="/" className="btn-secondary">Home</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-5">
      {attendee && <input type="hidden" name="id" value={attendee.id} />}

      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {state.error}
        </div>
      )}

      <Field label="Full name" error={err("name")}>
        <input name="name" className="input" defaultValue={attendee?.name} autoComplete="name" required />
      </Field>

      <Field label="Cell phone" error={err("phone")}>
        <input name="phone" type="tel" inputMode="tel" className="input" defaultValue={attendee?.phone} autoComplete="tel" placeholder="(555) 123-4567" required />
      </Field>

      <fieldset className="rounded-lg border border-pine-100 p-4">
        <legend className="px-1 text-sm font-semibold text-pine-700">Emergency contact</legend>
        <div className="space-y-4">
          <Field label="Contact name" error={err("emergency_contact_name")}>
            <input name="emergency_contact_name" className="input" defaultValue={attendee?.emergency_contact_name} required />
          </Field>
          <Field label="Contact phone" error={err("emergency_contact_phone")}>
            <input name="emergency_contact_phone" type="tel" inputMode="tel" className="input" defaultValue={attendee?.emergency_contact_phone} placeholder="(555) 123-4567" required />
          </Field>
        </div>
      </fieldset>

      <Field label="Ride preference" error={err("ride_preference")}>
        <select name="ride_preference" className="input" defaultValue={attendee?.ride_preference ?? "either"}>
          <option value="either">Either is fine</option>
          <option value="driving">Driving my own car</option>
          <option value="riding">Riding with someone</option>
        </select>
      </Field>

      <Field label="Preferred departure time" error={err("departure_time")}>
        <select name="departure_time" className="input" defaultValue={attendee?.departure_time ?? ""}>
          <option value="">No preference</option>
          {DEPARTURE_TIME_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>

      <div className="rounded-lg bg-pine-50 p-4 space-y-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="willing_to_drive"
            defaultChecked={willingToDrive}
            onChange={(e) => setWillingToDrive(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-pine-300 text-pine-600 focus:ring-pine-500"
          />
          <span className="text-sm text-pine-800">
            <span className="font-semibold">I&apos;m willing to drive others.</span> I can offer seats in my vehicle.
          </span>
        </label>

        {willingToDrive && (
          <Field label="Passenger seats available (not counting you)" error={err("seat_capacity")}>
            <input
              name="seat_capacity"
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              className="input"
              defaultValue={attendee?.seat_capacity ?? 3}
            />
          </Field>
        )}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="needs_ride"
            defaultChecked={attendee?.needs_ride ?? false}
            className="mt-1 h-5 w-5 rounded border-pine-300 text-pine-600 focus:ring-pine-500"
          />
          <span className="text-sm text-pine-800">
            <span className="font-semibold">I&apos;d like to be partnered with a driver.</span> Match me with someone who has room.
          </span>
        </label>
      </div>

      <Field label="Anything else we should know? (optional)" error={err("notes")}>
        <textarea name="notes" rows={3} className="input" defaultValue={attendee?.notes ?? ""} placeholder="Dietary needs, arrival changes, etc." />
      </Field>

      <SubmitButton editing={editing} />
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
