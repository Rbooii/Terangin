"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import StepList from "@/components/app/StepList";
import type { JourneyStep } from "@/lib/onboarding";
import ChatDemo from "./ChatDemo";
import FadeIn from "./FadeIn";
import { TeraMark } from "./TeraMark";

const INITIAL_STEPS: JourneyStep[] = [
  { n: 1, title: "Onboarding", status: "Done", state: "done" },
  { n: 2, title: "Assessment Bakat", status: "Done", state: "done" },
  {
    n: 3,
    title: "Input Nilai",
    status: "Not yet Completed",
    state: "active",
  },
  {
    n: 4,
    title: "Hasil Analisis",
    status: "Not yet Completed",
    state: "todo",
  },
];

const ADVANCED_STEPS: JourneyStep[] = [
  { n: 1, title: "Onboarding", status: "Done", state: "done" },
  { n: 2, title: "Assessment Bakat", status: "Done", state: "done" },
  { n: 3, title: "Input Nilai", status: "Done", state: "done" },
  {
    n: 4,
    title: "Hasil Analisis",
    status: "Not yet Completed",
    state: "active",
  },
];

export default function ProductPreview() {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [advanced, setAdvanced] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  useEffect(() => {
    if (!inView) {
      return;
    }
    if (reduceMotion) {
      const timer = window.setTimeout(() => {
        setAdvanced(true);
        setChatStarted(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const stepTimer = window.setTimeout(() => setAdvanced(true), 900);
    const chatTimer = window.setTimeout(() => setChatStarted(true), 1700);
    return () => {
      window.clearTimeout(stepTimer);
      window.clearTimeout(chatTimer);
    };
  }, [inView, reduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="preview"
      className="px-4 pt-12 sm:px-6 sm:pt-16"
    >
      <FadeIn>
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-overlay/8 bg-bg shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr]">
            <div className="flex flex-col border-b border-overlay/6 p-5 sm:p-6 md:border-b-0 md:border-r">
              <div className="flex items-center gap-2">
                <TeraMark className="size-4" />
                <span className="text-[13px] font-medium text-fg-soft">
                  Terang<span className="text-fg-faint">.in</span>
                </span>
              </div>

              <StepList
                steps={advanced ? ADVANCED_STEPS : INITIAL_STEPS}
                demo
              />

              <div className="mt-auto space-y-3 pt-10">
                <div
                  className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-500 ${
                    chatStarted
                      ? "border-overlay/20 bg-surface-elevated"
                      : "border-overlay/8 bg-surface-elevated opacity-50"
                  }`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                    <TeraMark className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-fg-soft">
                      Chat sama Tera
                    </span>
                    <span className="block truncate text-[11px] text-fg-faint">
                      {chatStarted
                        ? "Lagi ngobrol"
                        : "Terbuka setelah analisis selesai"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-overlay/8 bg-surface-elevated p-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-fg">
                    MK
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-fg-soft">
                      Michael Kevin
                    </span>
                    <span className="block text-[11px] text-fg-faint">
                      Siswa SMA
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-5 sm:p-6">
              <ChatDemo active={chatStarted} />
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
