"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/theme";

const OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: "dark", label: "Gelap" },
  { value: "light", label: "Terang" },
];

export default function ThemeSwitch() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      role="radiogroup"
      aria-label="Pilih tema tampilan"
      className="flex w-fit items-center gap-1 rounded-full border border-overlay/10 bg-overlay/4 p-1"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={`relative h-8 rounded-full px-4 text-[12px] font-medium transition-colors ${
              active
                ? "text-primary-fg"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            {active && (
              <motion.span
                layoutId="theme-pill"
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 320, damping: 30 }
                }
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
