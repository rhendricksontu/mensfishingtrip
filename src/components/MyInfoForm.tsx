"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateMyRsvp, deleteMyAccount, type EditState } from "@/app/me/actions";
import { DEPARTURE_TIME_OPTIONS, ACTIVITY_OPTIONS, RIDE_PREF_LABELS } from "@/lib/config";
import PhoneLink from "@/components/PhoneLink";
import PhoneInput from "@/components/PhoneInput";
import PasswordInput from "@/components/PasswordInput";
import SelectWithOther from "@/components/SelectWithOther";
import type { Attendee } from "@/lib/types";

const initial: EditState = { ok: false };

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-36" disabled={pending}>
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

export default function MyInfoForm({ attendee }: { attendee: Attendee }) {
  const router = useRouter();
  const [state, action] = useFormState(updateMyRsvp, initial);
  const [open, setOpen] = useState(false);
  const [ridePref, setRidePref] = useState<string>(attendee.ride_preference);
  const [willingToDrive, setWillingToDrive] = useState(attendee.willing_to_drive);
  const [otherActivity, setOtherActivity] = useState(Boolean(attendee.activity_other));
  const err = (k: string) => state.fieldErrors?.[k];

  const activityLabel = (v: string) =>
    ACTIVITY_OPTIONS.find((o) => o.value === v)?.label ?? v;
  const activityList = [
    ...(attendee.activities ?? []).map(activityLabel),
    attendee.activity_other?.trim() || null,
  ].filter(Boolean);

  // Close the editor and refresh the details once a save succeeds.
  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  if (!open) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <h2 className="font-bold text-brand-800">Your RSVP</h2>
            <span
              className={`badge ${
                attendee.paid
                  ? "bg-olive-600 text-white"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {attendee.paid ? "Paid" : "Unpaid"}
            </span>
          </span>
          <button onClick={() => setOpen(true)} className="btn-secondary text-sm">Edit</button>
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Row label="Name" value={attendee.name} />
          <Row
            label="Cell Phone"
            value={<PhoneLink phone={attendee.phone} className="font-medium text-brand-800 underline" />}
          />
          <Row label="Emergency Contact" value={attendee.emergency_contact_name} />
          <Row
            label="Emergency Phone"
            value={
              <PhoneLink
                phone={attendee.emergency_contact_phone}
                className="font-medium text-brand-800 underline"
              />
            }
          />
          <Row label="Fish with a Guide" value={attendee.fish_with_guide ? "Yes" : "No"} />
          <Row label="Ride Preference" value={RIDE_PREF_LABELS[attendee.ride_preference] ?? "Not set"} />
          {attendee.preferred_driver && <Row label="Preferred Driver" value={attendee.preferred_driver} />}
          {attendee.willing_to_drive && <Row label="Willing to Drive" value={`Yes · ${attendee.seat_capacity} seat(s)`} />}
          {attendee.departure_time && <Row label="Departure" value={attendee.departure_time} />}
          {activityList.length > 0 && <Row label="Activities" value={activityList.join(", ")} />}
        </dl>

        <div className="mt-4 border-t border-brand-50 pt-3">
          <form
            action={deleteMyAccount}
            onSubmit={(e) => {
              if (
                !confirm(
                  "Can't make the trip? This permanently deletes your RSVP and account. This can't be undone."
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <button type="submit" className="text-sm text-red-600 underline hover:text-red-700">
              Can&apos;t make the trip? Delete your RSVP.
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4">
      <h2 className="font-bold text-brand-800">Edit Your RSVP</h2>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <fieldset className="rounded-lg border border-brand-100 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">User Information</legend>
        <div className="space-y-4">
          <Field label="First & Last Name" error={err("name")}>
            <input name="name" className="input" defaultValue={attendee.name} required />
          </Field>
          <Field label="Do you want to fish with a guide?" error={err("fish_with_guide")}>
            <p className="mb-1 text-xs text-brand-500">(Fishing Guides, Select &quot;No&quot;)</p>
            <select
              name="fish_with_guide"
              className="input"
              defaultValue={attendee.fish_with_guide ? "yes" : "no"}
              required
            >
              <option value="" disabled>Select One</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Cell Phone (Your Username)" error={err("phone")}>
            <PhoneInput name="phone" defaultValue={attendee.phone} required />
          </Field>
          <Field label="Password" error={err("password")}>
            <PasswordInput name="password" autoComplete="new-password" placeholder="Leave blank to keep current password" minLength={8} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-brand-100 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Emergency Contact</legend>
        <Field label="Contact Name" error={err("emergency_contact_name")}>
          <input name="emergency_contact_name" className="input" defaultValue={attendee.emergency_contact_name} required />
        </Field>
        <Field label="Contact Phone" error={err("emergency_contact_phone")}>
          <PhoneInput name="emergency_contact_phone" defaultValue={attendee.emergency_contact_phone} required autoComplete="off" />
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
          onChange={(e) => {
            const v = e.target.value;
            setRidePref(v);
            // Passenger can't offer seats — reset so returning to Driver is fresh.
            if (v === "riding") setWillingToDrive(false);
          }}
        >
          <option value="" disabled>Select One</option>
          <option value="driving">Driver</option>
          <option value="riding">Passenger</option>
          <option value="either">Either</option>
          <option value="arranged">My Ride is Already Set</option>
        </select>
      </Field>

      {ridePref === "riding" && (
        <Field label="Preferred Driver" error={err("preferred_driver")}>
          <input name="preferred_driver" className="input" defaultValue={attendee.preferred_driver ?? ""} placeholder="Who you'd like to ride with (optional)" maxLength={100} />
        </Field>
      )}

      {ridePref === "arranged" && (
        <Field label="List Who You Are Riding With (Optional)" error={err("preferred_driver")}>
          <input name="preferred_driver" className="input" defaultValue={attendee.preferred_driver ?? ""} placeholder="Who you're riding with (optional)" maxLength={100} />
        </Field>
      )}

      {(ridePref === "driving" || ridePref === "either") && (
        <div className="rounded-lg bg-brand-50 p-4 space-y-4">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="willing_to_drive" checked={willingToDrive} onChange={(e) => setWillingToDrive(e.target.checked)} className="mt-1 h-5 w-5 rounded text-brand-600" />
            <span className="text-sm text-brand-800"><span className="font-semibold">I&apos;m willing to drive others.</span> I can offer seats in my vehicle.</span>
          </label>
          {willingToDrive && (
            <Field label="Passenger Seats Available (Not Counting You)" error={err("seat_capacity")}>
              <input name="seat_capacity" type="number" inputMode="numeric" min={0} max={20} className="input" defaultValue={attendee.seat_capacity || 3} />
            </Field>
          )}
        </div>
      )}

      <Field label="Preferred Departure Time" error={err("departure_time")}>
        <SelectWithOther
          name="departure_time"
          options={DEPARTURE_TIME_OPTIONS}
          defaultValue={attendee.departure_time ?? ""}
          required
        />
      </Field>

        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-brand-100 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Activity Interest</legend>
        <p className="mb-3 text-xs text-brand-500">Check any you&apos;d be interested in. (Optional)</p>
        <div className="space-y-3">
          {ACTIVITY_OPTIONS.map((a) => (
            <label key={a.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                name="activities"
                value={a.value}
                defaultChecked={attendee.activities?.includes(a.value)}
                className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-brand-800">{a.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="wants_other"
              checked={otherActivity}
              onChange={(e) => setOtherActivity(e.target.checked)}
              className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-brand-800">Other</span>
          </label>
          {otherActivity && (
            <Field label="Please Specify" error={err("activity_other")}>
              <input
                name="activity_other"
                className="input"
                defaultValue={attendee.activity_other ?? ""}
                placeholder="What activity?"
                maxLength={200}
                required
              />
            </Field>
          )}
        </div>
      </fieldset>

      <div className="flex justify-center gap-3">
        <SaveBtn />
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary w-36">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
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
