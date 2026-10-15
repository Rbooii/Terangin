"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import type { JourneyStep } from "@/lib/onboarding";

const STEP_HREFS: Record<number, string | undefined> = {
  1: "/profil",
  2: "/assessment",
  3: "/nilai",
  4: "/analisis",
};

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

function sweepBackground(peak: number, arc: number) {
  const start = 360 - arc;
  const soft = start + arc * 0.4;
  const crest = start + arc * 0.75;
  const tail = start + arc * 0.9;
  const softAlpha = (peak * 0.22).toFixed(2);
  const tailAlpha = (peak * 0.4).toFixed(2);
  return `conic-gradient(from 0deg, rgba(255, 255, 255, 0) 0deg, rgba(255, 255, 255, 0) ${start}deg, rgba(255, 255, 255, ${softAlpha}) ${soft}deg, rgba(255, 255, 255, ${peak}) ${crest}deg, rgba(255, 255, 255, ${tailAlpha}) ${tail}deg, rgba(255, 255, 255, 0) 360deg)`;
}

function SweepOutline({
  reduceMotion,
  peak,
  arc,
  duration,
  coverClassName,
}: {
  reduceMotion: boolean;
  peak: number;
  arc: number;
  duration: number;
  coverClassName: string;
}) {
  return (
    <motion.span
      aria-hidden="true"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <motion.span
        className="absolute left-1/2 top-1/2 aspect-square w-[220%]"
        style={{ x: "-50%", y: "-50%", background: sweepBackground(peak, arc) }}
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={
          reduceMotion
            ? undefined
            : { repeat: Infinity, duration, ease: "linear" }
        }
      />
      <span className={`absolute ${coverClassName}`} />
    </motion.span>
  );
}

function StepContent({ step, active }: { step: JourneyStep; active: boolean }) {
  return (
    <>
      <span
        className={
          active
            ? "relative grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[13px] font-medium text-black"
            : "relative grid size-9 shrink-0 place-items-center rounded-lg bg-[#161616] text-[13px] text-zinc-400"
        }
      >
        {step.n}
      </span>
      <span className="relative min-w-0">
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

export default function StepList({
  steps,
  demo = false,
}: {
  steps: JourneyStep[];
  demo?: boolean;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;
  const navRef = useRef<HTMLElement | null>(null);
  const [trackHeight, setTrackHeight] = useState<number | null>(null);

  useEffect(() => {
    const track = navRef.current?.querySelector<HTMLElement>("[data-track]");
    if (!track) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setTrackHeight(track.getBoundingClientRect().height);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const routeActive = steps.find((step) => {
    const href = STEP_HREFS[step.n];
    return href ? pathname.startsWith(href) : false;
  });
  const journeyActive = steps.find((step) => step.state === "active");
  const activeNumber = routeActive?.n ?? journeyActive?.n;

  const activeIndex = activeNumber
    ? steps.findIndex((step) => step.n === activeNumber)
    : -1;
  const hasActive = activeIndex >= 0;
  const progressIndex = hasActive ? activeIndex : steps.length - 1;
  const progressPct =
    steps.length > 1 ? (progressIndex / (steps.length - 1)) * 100 : 100;
  const stride =
    trackHeight !== null && steps.length > 1
      ? trackHeight / (steps.length - 1)
      : null;
  const knobTop = hasActive && stride !== null ? progressIndex * stride : null;

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Menu langkah"
        aria-hidden={demo || undefined}
        className="relative mt-8 hidden flex-col gap-1 md:flex"
      >
        <span
          data-track
          aria-hidden="true"
          className="absolute bottom-[30px] left-8 top-[30px] w-px"
        >
          <span className="absolute inset-0 bg-white/8" />
          <motion.span
            className="absolute left-0 top-0 w-px bg-gradient-to-b from-white/12 via-white/35 to-white/70"
            initial={reduceMotion ? false : { height: "0%" }}
            animate={{ height: `${progressPct}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: EASE }}
          />
        </span>
        {steps.map((step) => {
          const href = STEP_HREFS[step.n];
          const unlocked =
            href !== undefined &&
            (step.state === "done" || step.state === "active");
          const isActive = step.n === activeNumber;

          const rowClass = isActive
            ? "relative flex items-center gap-4 rounded-xl bg-[#1e1e1e] px-3.5 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
            : unlocked
              ? "relative flex items-center gap-4 rounded-xl px-3.5 py-3 transition-colors hover:bg-white/4"
              : "relative flex cursor-not-allowed items-center gap-4 px-3.5 py-3 opacity-60";

          const sweep = isActive ? (
            <SweepOutline
              reduceMotion={reduceMotion}
              peak={0.85}
              arc={66}
              duration={4.5}
              coverClassName="inset-px rounded-[11px] bg-[#1e1e1e]"
            />
          ) : null;

          if (unlocked && href && !demo) {
            return (
              <Link
                key={step.n}
                href={href}
                aria-current={routeActive?.n === step.n ? "page" : undefined}
                className={rowClass}
              >
                {sweep}
                <StepContent step={step} active={isActive} />
              </Link>
            );
          }

          return (
            <span
              key={step.n}
              aria-disabled={demo ? undefined : "true"}
              className={rowClass}
            >
              {sweep}
              <StepContent step={step} active={isActive} />
            </span>
          );
        })}
        {knobTop !== null && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-8 z-10 size-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.55)]"
            style={{ x: "-50%", y: "-50%" }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
            animate={{ top: knobTop, opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: EASE }}
          />
        )}
      </nav>

      <nav
        aria-label="Menu langkah"
        aria-hidden={demo || undefined}
        className="mt-4 flex items-center gap-1.5 md:hidden"
      >
        {steps.map((step, i) => {
          const href = STEP_HREFS[step.n];
          const unlocked =
            href !== undefined &&
            (step.state === "done" || step.state === "active");
          const isActive = step.n === activeNumber;

          const activeWrap =
            "relative grid place-items-center rounded-[9px] p-[2px]";
          const inactiveChip =
            "grid size-6 shrink-0 place-items-center rounded-md bg-[#161616] text-[11px] text-zinc-400";

          const chip = isActive ? (
            <>
              <SweepOutline
                reduceMotion={reduceMotion}
                peak={0.7}
                arc={22}
                duration={5.5}
                coverClassName="inset-[2px] rounded-[7px] bg-[#050505]"
              />
              <span className="relative grid size-6 place-items-center rounded-md bg-white text-[11px] font-medium text-black">
                {step.n}
              </span>
            </>
          ) : (
            step.n
          );

          return (
            <span key={step.n} className="flex flex-1 items-center gap-1.5">
              {unlocked && href && !demo ? (
                <Link
                  href={href}
                  aria-current={routeActive?.n === step.n ? "page" : undefined}
                  aria-label={step.title}
                  className={isActive ? activeWrap : inactiveChip}
                >
                  {chip}
                </Link>
              ) : (
                <span
                  aria-disabled={demo ? undefined : "true"}
                  aria-label={demo ? undefined : step.title}
                  className={
                    isActive
                      ? activeWrap
                      : unlocked
                        ? inactiveChip
                        : `${inactiveChip} opacity-60`
                  }
                >
                  {chip}
                </span>
              )}
              {step.state === "done" && (
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-400/80" />
              )}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="relative h-px min-w-2 flex-1 overflow-hidden bg-white/8"
                >
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/12 to-white/55"
                    initial={reduceMotion ? false : { width: "0%" }}
                    animate={{ width: i < progressIndex ? "100%" : "0%" }}
                    transition={{ duration: reduceMotion ? 0 : 0.45, ease: EASE }}
                  />
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
