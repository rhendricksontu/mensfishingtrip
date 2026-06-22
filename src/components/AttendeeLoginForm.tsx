"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signInAttendee, type LoginState } from "@/app/login/actions";

const initial: LoginState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Logging In…" : "Log In"}
    </button>
  );
}

export default function AttendeeLoginForm() {
  const [state, action] = useFormState(signInAttendee, initial);

  return (
    <form action={action} className="card space-y-4">
      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <span className="label">Cell Phone</span>
        <input name="phone" type="tel" inputMode="tel" className="input" autoComplete="tel" placeholder="(555) 123-4567" required />
      </div>
      <div>
        <span className="label">Password</span>
        <input name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <SubmitBtn />
      <p className="text-center text-sm text-brand-500">
        Haven&apos;t signed up yet?{" "}
        <Link href="/rsvp" className="font-semibold text-brand-600 underline">
          RSVP here.
        </Link>
      </p>
    </form>
  );
}
