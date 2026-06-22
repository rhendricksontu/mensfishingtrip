"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { resetPassword, type ResetState } from "@/app/reset/actions";
import PhoneInput from "@/components/PhoneInput";
import PasswordInput from "@/components/PasswordInput";

const initial: ResetState = { ok: false };

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Saving…" : "Set New Password"}
    </button>
  );
}

export default function ResetPasswordForm() {
  const [state, action] = useFormState(resetPassword, initial);
  const err = (k: string) => state.fieldErrors?.[k];

  if (state.ok) {
    return (
      <div className="card text-center">
        <h2 className="text-xl font-bold text-brand-800">Password updated</h2>
        <p className="mt-1 text-brand-600">You can now log in with your new password.</p>
        <Link href="/login" className="btn-primary mt-4">Go to Log In</Link>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4">
      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {state.error}
        </div>
      )}

      <p className="text-sm text-brand-600">
        Verify it&apos;s you with the cell phone and emergency contact phone you used when
        you RSVP&apos;d, then choose a new password.
      </p>

      <Field label="Your Cell Phone" error={err("phone")}>
        <PhoneInput name="phone" required />
      </Field>

      <Field label="Emergency Contact Phone" error={err("emergency_contact_phone")}>
        <PhoneInput name="emergency_contact_phone" required autoComplete="off" />
      </Field>

      <Field label="New Password" error={err("password")}>
        <PasswordInput name="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
      </Field>

      <Field label="Confirm New Password" error={err("confirm")}>
        <PasswordInput name="confirm" autoComplete="new-password" required />
      </Field>

      <SubmitBtn />

      <p className="text-center text-sm text-brand-500">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand-600 underline">
          Back to log in.
        </Link>
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
