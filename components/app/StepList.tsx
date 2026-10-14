"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JourneyStep } from "@/lib/onboarding";

const STEP_HREFS: Record<number, string | undefined> = {
  1: "/profil",
  2: "/assessment",
  3: "/nilai",
  4: "/analisis",
};

function StepContent({ step, active }: { step: JourneyStep; active: boolean }) {
  return (
    <>
      <span
        className={
          active
            ? "grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[13px] font-medium text-black"
            : "grid size-9 shrink-0 place-items-center rounded-lg bg-white/6 text-[13px] text-zinc-400"
        }
      >
        {step.n}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] text-zinc-200">
          {step.title}
        </span>
        <span
          className={
            step.state === "done"
              ? "flex items-center gap-1.5 text-[11px] text-zinc-400"
              : "block text-[11px] text-zinc-500"
          }
        >
          {step.state === "done" && (
            <span className="size-1.5 rounded-full bg-emerald-400/80" />
          )}
          {step.status}
        </span>
      </span>
    </>
  );
}

export default function StepList({ steps }: { steps: JourneyStep[] }) {
  const pathname = usePathname();

  const routeActive = steps.find((step) => {
    const href = STEP_HREFS[step.n];
    return href ? pathname.startsWith(href) : false;
  });
  const journeyActive = steps.find((step) => step.state === "active");
  const activeNumber = routeActive?.n ?? journeyActive?.n;

  return (
    <>
      <nav aria-label="Menu langkah" className="relative mt-8 hidden space-y-1 md:block">
        <span
          aria-hidden="true"
          className="absolute bottom-6 left-8 top-6 w-px bg-white/10"
        />
        {steps.map((step) => {
          const href = STEP_HREFS[step.n];
          const unlocked =
            href !== undefined &&
            (step.state === "done" || step.state === "active");
          const isActive = step.n === activeNumber;

          const rowClass = isActive
            ? "relative flex items-center gap-4 rounded-xl border border-white/12 bg-[#1e1e1e] px-3.5 py-3"
            : unlocked
              ? "relative flex items-center gap-4 rounded-xl px-3.5 py-3 transition-colors hover:bg-white/4"
              : "relative flex cursor-not-allowed items-center gap-4 px-3.5 py-3 opacity-60";

          if (unlocked && href) {
            return (
              <Link
                key={step.n}
                href={href}
                aria-current={routeActive?.n === step.n ? "page" : undefined}
                className={rowClass}
              >
                <StepContent step={step} active={isActive} />
              </Link>
            );
          }

          return (
            <span key={step.n} aria-disabled="true" className={rowClass}>
              <StepContent step={step} active={isActive} />
            </span>
          );
        })}
      </nav>

      <nav aria-label="Menu langkah" className="mt-4 flex items-center gap-1.5 md:hidden">
        {steps.map((step, i) => {
          const href = STEP_HREFS[step.n];
          const unlocked =
            href !== undefined &&
            (step.state === "done" || step.state === "active");
          const isActive = step.n === activeNumber;

          const chipClass = isActive
            ? "grid size-6 shrink-0 place-items-center rounded-md bg-white text-[11px] font-medium text-black"
            : "grid size-6 shrink-0 place-items-center rounded-md bg-white/6 text-[11px] text-zinc-400";

          return (
            <span key={step.n} className="flex flex-1 items-center gap-1.5">
              {unlocked && href ? (
                <Link
                  href={href}
                  aria-current={routeActive?.n === step.n ? "page" : undefined}
                  aria-label={step.title}
                  className={chipClass}
                >
                  {step.n}
                </Link>
              ) : (
                <span aria-disabled="true" aria-label={step.title} className={`${chipClass} opacity-60`}>
                  {step.n}
                </span>
              )}
              {step.state === "done" && (
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-400/80" />
              )}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="h-px min-w-2 flex-1 bg-white/10"
                />
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
