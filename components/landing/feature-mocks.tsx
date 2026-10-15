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
      className="space-y-3.5 rounded-xl border border-white/8 bg-[#101010] p-4"
    >
      <div>
        <span className="text-[12px] font-medium text-zinc-400">
          Asal sekolah
        </span>
        <div className="mt-1.5 flex h-11 w-full items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-200">
          SMAN 1 Bandung
        </div>
      </div>
      <div>
        <span className="text-[12px] font-medium text-zinc-400">Kelas</span>
        <div className="relative mt-1.5">
          <div className="flex h-11 w-full items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-200">
            Kelas 12
          </div>
          <ChevronDown className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-zinc-400">
            Minat awal
          </span>
          <span className="text-[11px] text-zinc-600">
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
                    ? "rounded-full border border-white/70 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black transition-colors duration-300"
                    : "rounded-full border border-white/12 px-3.5 py-1.5 text-[12px] text-zinc-300 transition-colors duration-300"
                }
              >
                {interest}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex h-11 w-full items-center justify-center rounded-full bg-white text-[13px] font-medium text-black">
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
      className="rounded-xl border border-white/8 bg-[#101010] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-white/6 px-2 py-1 text-[10px] text-zinc-300">
          Minat
        </span>
        <span className="text-[11px] text-zinc-500">
          {answeredCount}/{TOTAL_QUESTIONS} terjawab
        </span>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${(answeredCount / TOTAL_QUESTIONS) * 100}%` }}
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <p className="pt-1 text-[11px] text-zinc-500">Soal 7 dari 24</p>
        <span
          className={
            timeLeft <= 5
              ? "flex items-baseline gap-1 rounded-xl border border-amber-300/30 px-3 py-1.5 text-amber-300"
              : "flex items-baseline gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-white"
          }
        >
          <span className="text-2xl font-semibold leading-none tabular-nums">
            {timeLeft}
          </span>
          <span className="text-[11px] opacity-70">detik</span>
        </span>
      </div>

      <p className="mt-3 text-[15px] font-medium leading-relaxed tracking-tight text-white">
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
                  ? "rounded-xl border border-white bg-white px-1.5 py-3 text-center text-[10px] font-medium leading-snug text-black transition-colors duration-300 sm:min-h-16 sm:text-[11px]"
                  : "rounded-xl border border-white/12 px-1.5 py-3 text-center text-[10px] leading-snug text-zinc-300 transition-colors duration-300 sm:min-h-16 sm:text-[11px]"
              }
            >
              {label}
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-zinc-600">
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
      className="rounded-xl border border-white/8 bg-[#101010] p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-zinc-400">
          Rekomendasi jurusan
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="size-1.5 rounded-full bg-emerald-400/80" />
          Dianalisis
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {RECOMMENDATIONS.map((rec) => {
          const value = Math.round(rec.match * progress);
          return (
            <div
              key={rec.name}
              className="rounded-xl border border-white/8 bg-black/20 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-md bg-white text-[10px] font-medium text-black">
                  {rec.rank}
                </span>
                <span className="flex-1 truncate text-[12px] text-zinc-200">
                  {rec.name}
                </span>
                <span className="text-[12px] tabular-nums text-zinc-400">
                  {value}%
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="mt-1.5 truncate text-[10px] text-zinc-500">
                {rec.campus}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">
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
      className="space-y-4 rounded-xl border border-white/8 bg-[#101010] p-4"
    >
      <div className="flex justify-end">
        <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-white px-4 py-2.5 text-[13px] leading-relaxed text-black">
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
                className="size-1.5 rounded-full bg-zinc-500"
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
            className={`min-w-0 flex-1 text-[13px] leading-relaxed text-zinc-300 ${
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
