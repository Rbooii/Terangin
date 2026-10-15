"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { INTEREST_OPTIONS } from "@/components/onboarding/BasicsForm";
import { TeraMark } from "./TeraMark";
import { ChevronDown } from "./icons";

function useMockInView<T extends HTMLDivElement>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return { ref, inView };
}

const PICKED_INTERESTS = [
  "Teknologi & Komputer",
  "Seni & Desain",
  "Sains & Riset",
];

const CHIP_OPTIONS = INTEREST_OPTIONS.slice(0, 6);

export function SignupMock() {
  const reduceMotion = useReducedMotion() ?? false;
  const { ref, inView } = useMockInView<HTMLDivElement>();
  const [picked, setPicked] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }
    if (reduceMotion) {
      const timer = window.setTimeout(
        () => setPicked(PICKED_INTERESTS.length),
        0,
      );
      return () => window.clearTimeout(timer);
    }
    const timers = [
      window.setTimeout(() => setPicked(1), 350),
      window.setTimeout(() => setPicked(2), 700),
      window.setTimeout(() => setPicked(3), 1050),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView, reduceMotion]);

  const selected = PICKED_INTERESTS.slice(0, picked);

  return (
    <div
      ref={ref}
      className="space-y-3.5 rounded-xl border border-overlay/8 bg-sunken p-4"
    >
      <div>
        <span className="text-[12px] font-medium text-fg-muted">
          Asal sekolah
        </span>
        <div className="mt-1.5 flex h-11 w-full items-center rounded-xl border border-overlay/10 bg-overlay/[0.04] px-4 text-sm text-fg-soft">
          SMAN 1 Bandung
        </div>
      </div>
      <div>
        <span className="text-[12px] font-medium text-fg-muted">Kelas</span>
        <div className="relative mt-1.5">
          <div className="flex h-11 w-full items-center rounded-xl border border-overlay/10 bg-overlay/[0.04] px-4 text-sm text-fg-soft">
            Kelas 12
          </div>
          <ChevronDown className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-fg-faint" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-fg-muted">
            Minat awal
          </span>
          <span className="text-[11px] text-fg-faintest">
            {selected.length}/5 dipilih
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CHIP_OPTIONS.map((interest) => {
            const isSelected = selected.includes(interest);
            return (
              <span
                key={interest}
                className={
                  isSelected
                    ? "rounded-full border border-overlay/70 bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-fg transition-colors duration-300"
                    : "rounded-full border border-overlay/12 px-3.5 py-1.5 text-[12px] text-fg-secondary transition-colors duration-300"
                }
              >
                {interest}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex h-11 w-full items-center justify-center rounded-full bg-primary text-[13px] font-medium text-primary-fg">
        Lanjut
      </div>
    </div>
  );
}

const SAMPLE_QUESTION =
  "Aku penasaran sama cara kerja teknologi, mesin, atau fenomena alam, dan sering cari tahu sendiri sampai paham.";

const LIKERT_SCALE = [
  "Sangat nggak setuju",
  "Nggak setuju",
  "Biasa aja",
  "Setuju",
  "Sangat setuju",
];

const TOTAL_QUESTIONS = 24;

export function AssessmentMock() {
  const reduceMotion = useReducedMotion() ?? false;
  const { ref, inView } = useMockInView<HTMLDivElement>();
  const [timeLeft, setTimeLeft] = useState(15);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (!inView) {
      return;
    }
    if (reduceMotion) {
      const timer = window.setTimeout(() => {
        setTimeLeft(5);
        setAnswered(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    if (timeLeft <= 5) {
      return;
    }
    const timer = window.setTimeout(
      () => setTimeLeft((value) => value - 1),
      500,
    );
    return () => window.clearTimeout(timer);
  }, [inView, timeLeft, reduceMotion]);

  useEffect(() => {
    if (!inView || reduceMotion) {
      return;
    }
    const timer = window.setTimeout(() => setAnswered(true), 1200);
    return () => window.clearTimeout(timer);
  }, [inView, reduceMotion]);

  const answeredCount = answered ? 8 : 7;
  const selectedIndex = answered ? 3 : -1;

  return (
    <div
      ref={ref}
      className="rounded-xl border border-overlay/8 bg-sunken p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-overlay/6 px-2 py-1 text-[10px] text-fg-secondary">
          Minat
        </span>
        <span className="text-[11px] text-fg-faint">
          {answeredCount}/{TOTAL_QUESTIONS} terjawab
        </span>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-overlay/8">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(answeredCount / TOTAL_QUESTIONS) * 100}%` }}
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <p className="pt-1 text-[11px] text-fg-faint">Soal 7 dari 24</p>
        <span
          className={
            timeLeft <= 5
              ? "flex items-baseline gap-1 rounded-xl border border-warning/30 px-3 py-1.5 text-warning"
              : "flex items-baseline gap-1 rounded-xl border border-overlay/10 px-3 py-1.5 text-fg"
          }
        >
          <span className="text-2xl font-semibold leading-none tabular-nums">
            {timeLeft}
          </span>
          <span className="text-[11px] opacity-70">detik</span>
        </span>
      </div>

      <p className="mt-3 text-[15px] font-medium leading-relaxed tracking-tight text-fg">
        {SAMPLE_QUESTION}
      </p>

      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {LIKERT_SCALE.map((label, index) => {
          const isSelected = index === selectedIndex;
          return (
            <span
              key={label}
              className={
                isSelected
                  ? "rounded-xl border border-primary bg-primary px-1.5 py-3 text-center text-[10px] font-medium leading-snug text-primary-fg transition-colors duration-300 sm:min-h-16 sm:text-[11px]"
                  : "rounded-xl border border-overlay/12 px-1.5 py-3 text-center text-[10px] leading-snug text-fg-secondary transition-colors duration-300 sm:min-h-16 sm:text-[11px]"
              }
            >
              {label}
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-fg-faintest">
        {answered ? "Tersimpan" : "Jawab spontan sesuai dirimu"}
      </p>
    </div>
  );
}

const RECOMMENDATIONS = [
  {
    rank: 1,
    name: "Psikologi",
    match: 92,
    campus: "UI, daya tampung 70, estimasi UKT Rp 8,5jt",
  },
  {
    rank: 2,
    name: "Sistem Informasi",
    match: 88,
    campus: "UI, daya tampung 60, estimasi UKT Rp 8,5jt",
  },
];

export function AnalysisMock() {
  const reduceMotion = useReducedMotion() ?? false;
  const { ref, inView } = useMockInView<HTMLDivElement>();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }
    if (progress >= 1) {
      return;
    }
    if (reduceMotion) {
      const timer = window.setTimeout(() => setProgress(1), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(
      () => setProgress((value) => Math.min(1, value + 0.06)),
      26,
    );
    return () => window.clearTimeout(timer);
  }, [inView, progress, reduceMotion]);

  return (
    <div
      ref={ref}
      className="rounded-xl border border-overlay/8 bg-sunken p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-fg-muted">
          Rekomendasi jurusan
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-fg-faint">
          <span className="size-1.5 rounded-full bg-success/80" />
          Dianalisis
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {RECOMMENDATIONS.map((rec) => {
          const value = Math.round(rec.match * progress);
          return (
            <div
              key={rec.name}
              className="rounded-xl border border-overlay/8 bg-sunken p-3"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-md bg-primary text-[10px] font-medium text-primary-fg">
                  {rec.rank}
                </span>
                <span className="flex-1 truncate text-[12px] text-fg-soft">
                  {rec.name}
                </span>
                <span className="text-[12px] tabular-nums text-fg-muted">
                  {value}%
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-overlay/8">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="mt-1.5 truncate text-[10px] text-fg-faint">
                {rec.campus}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-fg-faintest">
        Angka match dan biaya adalah perkiraan. Cek situs resmi kampus ya.
      </p>
    </div>
  );
}

const CHAT_QUESTION = "Berapa biaya kuliah dan beasiswanya?";
const CHAT_REPLY =
  "Buat Psikologi di UI, estimasi UKT Rp 8,5jt per semester dan daya tampungnya 70 orang. Ada juga jalur KIP Kuliah yang bisa bantu biaya awal.";

export function ChatMock() {
  const reduceMotion = useReducedMotion() ?? false;
  const { ref, inView } = useMockInView<HTMLDivElement>();
  const [stage, setStage] = useState<"waiting" | "stream" | "done">("waiting");
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    if (!inView) {
      return;
    }
    if (reduceMotion) {
      const timer = window.setTimeout(() => {
        setStage("done");
        setCount(CHAT_REPLY.length);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    if (stage === "waiting") {
      const timer = window.setTimeout(() => setStage("stream"), 900);
      return () => window.clearTimeout(timer);
    }
    if (stage === "stream") {
      countRef.current = 0;
      const interval = window.setInterval(() => {
        countRef.current += 2;
        if (countRef.current >= CHAT_REPLY.length) {
          countRef.current = CHAT_REPLY.length;
          setCount(CHAT_REPLY.length);
          window.clearInterval(interval);
          setStage("done");
          return;
        }
        setCount(countRef.current);
      }, 24);
      return () => window.clearInterval(interval);
    }
  }, [inView, stage, reduceMotion]);

  return (
    <div
      ref={ref}
      className="space-y-4 rounded-xl border border-overlay/8 bg-sunken p-4"
    >
      <div className="flex justify-end">
        <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-[13px] leading-relaxed text-primary-fg">
          {CHAT_QUESTION}
        </div>
      </div>

      {inView && stage === "waiting" && (
        <div className="flex items-center gap-3">
          <TeraMark className="size-7 shrink-0" />
          <div className="flex items-center gap-1.5 py-1">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="size-1.5 rounded-full bg-fg-faint"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.18,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {inView && stage !== "waiting" && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex items-start gap-3"
        >
          <TeraMark className="mt-0.5 size-7 shrink-0" />
          <div
            className={`min-w-0 flex-1 text-[13px] leading-relaxed text-fg-secondary ${
              stage === "stream" ? "chat-streaming" : ""
            }`}
          >
            <p className="mb-2.5 last:mb-0">
              {CHAT_REPLY.slice(0, reduceMotion ? CHAT_REPLY.length : count)}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
