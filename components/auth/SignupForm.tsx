"use client";

import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";

export const inputClass =
  "h-11 w-full rounded-xl border border-overlay/10 bg-overlay/[0.04] px-4 text-sm text-fg outline-none transition-colors placeholder:text-fg-faintest focus:border-overlay/25 focus:bg-overlay/[0.06]";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    undefined,
  );

  return (
    <form action={formAction} className="mt-8 space-y-3">
      <input
        name="fullName"
        placeholder="Nama lengkap"
        autoComplete="name"
        required
        minLength={2}
        maxLength={100}
        className={inputClass}
      />
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
        placeholder="Password (min. 8 karakter)"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        className={inputClass}
      />

      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-primary text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sebentar..." : "Daftar & mulai"}
      </button>
    </form>
  );
}
