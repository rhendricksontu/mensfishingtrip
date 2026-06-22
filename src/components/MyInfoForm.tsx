"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { updateMyRsvp, type EditState } from "@/app/me/actions";
import { DEPARTURE_TIME_OPTIONS, DEPARTURE_LOCATION_OPTIONS, RIDE_PREF_LABELS } from "@/lib/config";
import { formatPhone } from "@/lib/utils";
import type { Attendee } from "@/lib/types";

const initial: EditState = { ok: false };

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

export default function MyInfoForm({ attendee }: { attendee: Attendee }) {
  const [state, action] = useFormState(updateMyRsvp, initial);
  const [open, setOpen] = useState(false);
  const [ridePref, setRidePref] = useState<string>(attendee.ride_preference);
  const [willingToDrive, setWillingToDrive] = useState(attendee.willing_to_drive);
  const err = (k: string) => state.fieldErrors?.[k];

  if (!open) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-brand-800">Your details</h2>
          <button onClick={() => setOpen(true)} className="btn-secondary text-sm">Edit</button>
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Row label="Name" value={attendee.name} />
          <Row label="Cell Phone" value={formatPhone(attendee.phone)} />
          <Row label="Emergency Contact" value={`${attendee.emergency_contact_name} · ${formatPhone(attendee.emergency_contact_phone)}`} />
          <Row label="Ride Preference" value={RIDE_PREF_LABELS[attendee.ride_preference] ?? "Not set"} />
          {attendee.willing_to_drive && <Row label="Willing to Drive" value={`Yes · ${attendee.seat_capacity} seat(s)`} />}
          {attendee.departure_time && <Row label="Departure" value={attendee.departure_time} />}
          {attendee.departure_location && <Row label="Departure/Return Location" value={attendee.departure_location} />}
        </dl>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-brand-800">Edit your details</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-brand-500 underline">Cancel</button>
      </div>

      {state.ok && (
        <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">Saved!</div>
      )}
      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <Field label="First & Last Name" error={err("name")}>
        <input name="name" className="input" defaultValue={attendee.name} required />
      </Field>

      <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-500">
        Your login phone is {formatPhone(attendee.phone)}. To change it, ask a trip organizer.
      </p>

      <fieldset className="rounded-lg border border-brand-100 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Emergency Contact</legend>
        <Field label="Contact Name" error={err("emergency_contact_name")}>
          <input name="emergency_contact_name" className="input" defaultValue={attendee.emergency_contact_name} required />
        </Field>
        <Field label="Contact Phone" error={err("emergency_contact_phone")}>
          <input name="emergency_contact_phone" type="tel" inputMode="tel" className="input" defaultValue={attendee.emergency_contact_phone} required />
        </Field>
      </fieldset>

      <fieldset className="rounded-lg border border-brand-100 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Travel Preferences</legend>
        <div className="space-y-4">

      <Field label="Ride Preference" error={err("ride_preference")}>
        <select
          name="ride_preference"
          className="input"
          defaultValue={attendee.ride_preference}
          required
          onChange={(e) => setRidePref(e.target.value)}
        >
          <option value="" disabled>Select One</option>
          <option value="driving">Driver</option>
          <option value="riding">Passenger</option>
        </select>
      </Field>

      {ridePref === "driving" && (
        <div className="rounded-lg bg-brand-50 p-4 space-y-4">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="willing_to_drive" checked={willingToDrive} onChange={(e) => setWillingToDrive(e.target.checked)} className="mt-1 h-5 w-5 rounded text-brand-600" />
            <span className="text-sm text-brand-800"><span className="font-semibold">I&apos;m willing to drive others.</span></span>
          </label>
          {willingToDrive && (
            <Field label="Passenger Seats Available (Not Counting You)" error={err("seat_capacity")}>
              <input name="seat_capacity" type="number" inputMode="numeric" min={0} max={20} className="input" defaultValue={attendee.seat_capacity || 3} />
            </Field>
          )}
        </div>
      )}

      <Field label="Preferred Departure Time" error={err("departure_time")}>
        <select name="departure_time" className="input" defaultValue={attendee.departure_time ?? ""}>
          <option value="">No Preference</option>
          {DEPARTURE_TIME_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>

      <Field label="Preferred Departure/Return Location" error={err("departure_location")}>
        <select name="departure_location" className="input" defaultValue={attendee.departure_location ?? "No Preference"}>
          {DEPARTURE_LOCATION_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>

        </div>
      </fieldset>

      <SaveBtn />
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-brand-500">{label}</dt>
      <dd className="text-right font-medium text-brand-800">{value}</dd>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
