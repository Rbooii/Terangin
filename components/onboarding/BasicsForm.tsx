"use client";

import { useActionState, useState } from "react";
import {
  saveOnboardingAction,
  type OnboardingFormState,
} from "@/lib/actions/onboarding";

export const INTEREST_OPTIONS = [
  "Teknologi & Komputer",
  "Sains & Riset",
  "Kesehatan & Biologi",
  "Bisnis & Ekonomi",
  "Seni & Desain",
  "Sosial & Bahasa",
  "Hukum & Politik",
  "Olahraga",
  "Pendidikan",
  "Lingkungan",
];

const MAX_INTERESTS = 5;

export default function BasicsForm() {
  const [state, formAction, pending] = useActionState<
    OnboardingFormState,
    FormData
  >(saveOnboardingAction, undefined);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(interest: string) {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : prev.length >= MAX_INTERESTS
          ? prev
          : [...prev, interest],
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="schoolOrigin"
          className="block text-[12px] font-medium text-fg-muted"
        >
          Asal sekolah
        </label>
        <input
          id="schoolOrigin"
          name="schoolOrigin"
          placeholder="cth. SMAN 1 Bandung"
          autoComplete="organization"
          required
          minLength={2}
          maxLength={150}
          className="h-11 w-full rounded-xl border border-overlay/10 bg-overlay/[0.04] px-4 text-sm text-fg outline-none transition-colors placeholder:text-fg-faintest focus:border-overlay/25 focus:bg-overlay/[0.06]"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="gradeLevel"
          className="block text-[12px] font-medium text-fg-muted"
        >
          Kelas
        </label>
        <select
          id="gradeLevel"
          name="gradeLevel"
          required
          defaultValue=""
          className="h-11 w-full appearance-none rounded-xl border border-overlay/10 bg-overlay/[0.04] px-4 text-sm text-fg outline-none transition-colors focus:border-overlay/25 focus:bg-overlay/[0.06] [&>option]:bg-surface"
        >
          <option value="" disabled>
            Pilih kelas kamu
          </option>
          <option value="10">Kelas 10</option>
          <option value="11">Kelas 11</option>
          <option value="12">Kelas 12</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-fg-muted">
            Minat awal
          </span>
          <span className="text-[11px] text-fg-faintest">
            {selected.length}/{MAX_INTERESTS} dipilih
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const isSelected = selected.includes(interest);
            const isDisabled = !isSelected && selected.length >= MAX_INTERESTS;
            return (
              <label
                key={interest}
                className={
                  isSelected
                    ? "cursor-pointer rounded-full border border-overlay/70 bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-fg transition-colors"
                    : isDisabled
                      ? "cursor-not-allowed rounded-full border border-overlay/8 px-3.5 py-1.5 text-[12px] text-fg-faintest"
                      : "cursor-pointer rounded-full border border-overlay/12 px-3.5 py-1.5 text-[12px] text-fg-secondary transition-colors hover:border-overlay/30 hover:text-fg"
                }
              >
                <input
                  type="checkbox"
                  name="interests"
                  value={interest}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggle(interest)}
                  className="sr-only"
                />
                {interest}
              </label>
            );
          })}
        </div>
      </div>

      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-primary text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Lanjut"}
      </button>
    </form>
  );
}
