"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";
import { inputClass } from "./SignupForm";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    undefined,
  );

  return (
    <form action={formAction} className="mt-8 space-y-3">
      <input
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        required
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        className={inputClass}
      />

      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-primary text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sebentar..." : "Masuk"}
      </button>
    </form>
  );
}
