"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { adminUpdateRsvp, type RsvpEditState } from "@/app/admin/actions";
import { DEPARTURE_TIME_OPTIONS, ACTIVITY_OPTIONS } from "@/lib/config";
import PhoneInput from "@/components/PhoneInput";
import SelectWithOther from "@/components/SelectWithOther";
import type { Attendee } from "@/lib/types";

const initial: RsvpEditState = { ok: false };

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-36" disabled={pending}>
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

// Organizer-facing editor for any attendee's RSVP (used on the Summary tab).
export default function AdminRsvpForm({
  attendee,
  onClose,
}: {
  attendee: Attendee;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, action] = useFormState(adminUpdateRsvp, initial);
  const [ridePref, setRidePref] = useState<string>(attendee.ride_preference);
  const [willingToDrive, setWillingToDrive] = useState(attendee.willing_to_drive);
  const [otherActivity, setOtherActivity] = useState(Boolean(attendee.activity_other));
  const err = (k: string) => state.fieldErrors?.[k];

  useEffect(() => {
    if (state.ok) {
      onClose();
      router.refresh();
    }
  }, [state, router, onClose]);

  return (
    <form action={action} className="mt-3 space-y-4 border-t border-brand-50 pt-3">
      <input type="hidden" name="attendee_id" value={attendee.id} />
      <p className="font-semibold text-brand-700">Edit {attendee.name}&apos;s RSVP</p>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <fieldset className="rounded-lg border border-brand-100 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">User Information</legend>
        <Field label="First & Last Name" error={err("name")}>
          <input name="name" className="input" defaultValue={attendee.name} required />
        </Field>
        <Field label="Fish with a guide?" error={err("fish_with_guide")}>
          <select
            name="fish_with_guide"
            className="input"
            defaultValue={attendee.fish_with_guide ? "yes" : "no"}
            required
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <Field label="Cell Phone (Username)" error={err("phone")}>
          <PhoneInput name="phone" defaultValue={attendee.phone} required />
        </Field>
      </fieldset>

      <fieldset className="rounded-lg border border-brand-100 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Emergency Contact</legend>
        <Field label="Contact Name" error={err("emergency_contact_name")}>
          <input
            name="emergency_contact_name"
            className="input"
            defaultValue={attendee.emergency_contact_name}
            required
          />
        </Field>
        <Field label="Contact Phone" error={err("emergency_contact_phone")}>
          <PhoneInput
            name="emergency_contact_phone"
            defaultValue={attendee.emergency_contact_phone}
            required
            autoComplete="off"
          />
        </Field>
      </fieldset>

      <fieldset className="rounded-lg border border-brand-100 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Travel Preferences</legend>
        <Field label="Ride Preference" error={err("ride_preference")}>
          <select
            name="ride_preference"
            className="input"
            defaultValue={attendee.ride_preference}
            required
            onChange={(e) => {
              const v = e.target.value;
              setRidePref(v);
              if (v === "riding") setWillingToDrive(false);
            }}
          >
            <option value="driving">Driver</option>
            <option value="riding">Passenger</option>
            <option value="either">Either</option>
          </select>
        </Field>

        {ridePref === "riding" && (
          <Field label="Preferred Driver" error={err("preferred_driver")}>
            <input
              name="preferred_driver"
              className="input"
              defaultValue={attendee.preferred_driver ?? ""}
              placeholder="Who they'd like to ride with (optional)"
              maxLength={100}
            />
          </Field>
        )}

        {(ridePref === "driving" || ridePref === "either") && (
          <div className="rounded-lg bg-brand-50 p-4 space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="willing_to_drive"
                checked={willingToDrive}
                onChange={(e) => setWillingToDrive(e.target.checked)}
                className="mt-1 h-5 w-5 rounded text-brand-600"
              />
              <span className="text-sm text-brand-800">
                <span className="font-semibold">Willing to drive others.</span> Can offer seats.
              </span>
            </label>
            {willingToDrive && (
              <Field label="Passenger Seats Available (Not Counting Them)" error={err("seat_capacity")}>
                <input
                  name="seat_capacity"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  className="input"
                  defaultValue={attendee.seat_capacity || 3}
                />
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
      </fieldset>

      <fieldset className="rounded-lg border border-brand-100 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-700">Activity Interest</legend>
        <div className="space-y-3">
          {ACTIVITY_OPTIONS.map((act) => (
            <label key={act.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                name="activities"
                value={act.value}
                defaultChecked={attendee.activities?.includes(act.value)}
                className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-brand-800">{act.label}</span>
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
                maxLength={200}
                required
              />
            </Field>
          )}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <SaveBtn />
        <button type="button" onClick={onClose} className="btn-secondary w-36">
          Cancel
        </button>
      </div>
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
