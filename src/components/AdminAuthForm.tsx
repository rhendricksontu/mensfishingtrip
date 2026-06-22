"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/admin/auth-actions";

const initial: AuthState = {};

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "…" : label}
    </button>
  );
}

export default function AdminAuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action] = useFormState(
    mode === "signin" ? signIn : signUp,
    initial
  );

  return (
    <div className="card space-y-4">
      <div className="flex rounded-lg bg-brand-50 p-1 text-sm font-medium">
        <button
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-md py-2 ${mode === "signin" ? "bg-white text-brand-800 shadow-sm" : "text-brand-500"}`}
        >
          Log in
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-md py-2 ${mode === "signup" ? "bg-white text-brand-800 shadow-sm" : "text-brand-500"}`}
        >
          Create account
        </button>
      </div>

      <form action={action} className="space-y-4">
        {state.error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
        )}
        {state.info && (
          <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">{state.info}</div>
        )}
        <div>
          <span className="label">Email</span>
          <input name="email" type="email" className="input" autoComplete="email" required />
        </div>
        <div>
          <span className="label">Password</span>
          <input
            name="password"
            type="password"
            className="input"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
          />
        </div>
        <SubmitBtn label={mode === "signin" ? "Log in" : "Create account"} />
      </form>

      {mode === "signup" && (
        <p className="text-xs text-brand-400">
          Only emails on the organizer allowlist can create an account.
        </p>
      )}
    </div>
  );
}
