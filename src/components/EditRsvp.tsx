"use client";

import { useFormState, useFormStatus } from "react-dom";
import { lookupRsvp, type LookupState } from "@/app/rsvp/actions";
import RsvpForm from "@/components/RsvpForm";

const initialState: LookupState = { ok: false };

function LookupButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Looking…" : "Find my RSVP"}
    </button>
  );
}

export default function EditRsvp() {
  const [state, formAction] = useFormState(lookupRsvp, initialState);

  if (state.ok && state.attendee) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Editing the RSVP for <span className="font-semibold">{state.attendee.name}</span>.
        </p>
        <RsvpForm attendee={state.attendee} />
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-4">
      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {state.error}
        </div>
      )}
      <div>
        <span className="label">Full name (exactly as you entered it)</span>
        <input name="name" className="input" autoComplete="name" required />
      </div>
      <div>
        <span className="label">Cell phone</span>
        <input name="phone" type="tel" inputMode="tel" className="input" autoComplete="tel" placeholder="(555) 123-4567" required />
      </div>
      <LookupButton />
    </form>
  );
}
