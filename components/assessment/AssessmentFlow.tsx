"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  completeAssessmentAction,
  saveAnswerAction,
  skipQuestionAction,
} from "@/lib/actions/assessment";
import { TeraMark } from "@/components/landing/TeraMark";

type Question = {
  id: string;
  category: "MINAT" | "BAKAT" | "KEPRIBADIAN" | "GAYA_BELAJAR";
  questionText: string;
};

const CATEGORY_LABELS: Record<Question["category"], string> = {
  MINAT: "Minat",
  BAKAT: "Bakat",
  KEPRIBADIAN: "Kepribadian",
  GAYA_BELAJAR: "Gaya Belajar",
};

const SCALE = [
  { value: 1, label: "Sangat nggak setuju" },
  { value: 2, label: "Nggak setuju" },
  { value: 3, label: "Biasa aja" },
  { value: 4, label: "Setuju" },
  { value: 5, label: "Sangat setuju" },
];

const TIME_PER_QUESTION = 15;

type Phase = "intro" | "quiz" | "finish";
type SaveState = "idle" | "saving" | "saved" | "error";

export default function AssessmentFlow({
  questions,
  initialAnswers,
}: {
  questions: Question[];
  initialAnswers: { questionId: string; score: number }[];
}) {
  const [answers, setAnswers] = useState<Map<string, number>>(
    () => new Map(initialAnswers.map((item) => [item.questionId, item.score])),
  );
  const [timeLeft, setTimeLeft] = useState<Map<string, number>>(new Map());
  const [phase, setPhase] = useState<Phase>(() => {
    if (initialAnswers.length === 0) return "intro";
    const handled = questions.every((question) =>
      initialAnswers.some((item) => item.questionId === question.id),
    );
    return handled ? "finish" : "quiz";
  });
  const [index, setIndex] = useState(() => {
    const firstOpen = questions.findIndex(
      (question) =>
        !initialAnswers.some((item) => item.questionId === question.id),
    );
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const [visited, setVisited] = useState<Set<string>>(() => {
    const set = new Set(initialAnswers.map((item) => item.questionId));
    const firstOpen = questions.findIndex(
      (question) =>
        !initialAnswers.some((item) => item.questionId === question.id),
    );
    const current = questions[firstOpen === -1 ? 0 : firstOpen];
    if (current) set.add(current.id);
    return set;
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string>();

  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const total = questions.length;
  const question = questions[index];
  const currentScore = question ? answers.get(question.id) : undefined;
  const currentAnswered = currentScore !== undefined && currentScore > 0;
  const currentTimeLeft = question
    ? (timeLeft.get(question.id) ?? TIME_PER_QUESTION)
    : TIME_PER_QUESTION;
  const timerActive =
    phase === "quiz" && !!question && !currentAnswered && saveState !== "saving";

  const answeredCount = Array.from(answers.values()).filter(
    (score) => score > 0,
  ).length;
  const lockedCount = answers.size - answeredCount;
  const remainingCount = total - answers.size;
  const allHandled = remainingCount === 0;

  useEffect(() => {
    if (!timerActive || !question) return;
    const questionId = question.id;
    const handle = window.setInterval(() => {
      setTimeLeft((prev) => {
        const current = prev.get(questionId) ?? TIME_PER_QUESTION;
        if (current <= 0) return prev;
        const next = new Map(prev);
        next.set(questionId, current - 1);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(handle);
  }, [timerActive, question]);

  function isLockedAt(i: number) {
    const target = questions[i];
    return target ? answers.get(target.id) === 0 : false;
  }

  function nextOpenIndex(from: number) {
    for (let i = from + 1; i < total; i++) {
      if (!isLockedAt(i)) return i;
    }
    return -1;
  }

  function prevOpenIndex(from: number) {
    for (let i = from - 1; i >= 0; i--) {
      if (!isLockedAt(i)) return i;
    }
    return -1;
  }

  function lastOpenIndex() {
    for (let i = total - 1; i >= 0; i--) {
      if (!isLockedAt(i)) return i;
    }
    return 0;
  }

  function firstUnansweredIndex() {
    return questions.findIndex((item) => !answers.has(item.id));
  }

  function goTo(i: number) {
    const target = questions[i];
    if (target) {
      setVisited((prev) => {
        if (prev.has(target.id)) return prev;
        const next = new Set(prev);
        next.add(target.id);
        return next;
      });
    }
    setIndex(i);
  }

  function goNext(from: number) {
    const next = nextOpenIndex(from);
    if (next === -1) {
      setPhase("finish");
    } else {
      goTo(next);
    }
  }

  async function handleSelect(score: number) {
    if (!question || saveState === "saving") return;

    const answeredId = question.id;
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(answeredId, score);
      return next;
    });
    setSaveState("saving");
    setSaveError(undefined);

    const result = await saveAnswerAction({ questionId: answeredId, score });

    if (!result.ok) {
      setSaveState("error");
      setSaveError(result.error ?? "Gagal menyimpan jawaban. Coba klik lagi.");
      return;
    }

    setSaveState("saved");
    window.setTimeout(() => {
      setSaveState((current) => (current === "saved" ? "idle" : current));
      if (questions[indexRef.current]?.id !== answeredId) return;
      goNext(indexRef.current);
    }, 250);
  }

  const skipInFlightRef = useRef(false);

  async function handleTimeout() {
    try {
      const at = indexRef.current;
      const activeQuestion = questions[at];
      if (!activeQuestion) return;
      if (answers.has(activeQuestion.id)) return;

      const result = await skipQuestionAction({
        questionId: activeQuestion.id,
      });

      if (result.ok && result.skipped) {
        setAnswers((prev) => new Map(prev).set(activeQuestion.id, 0));
        setNotice("Waktu habis. Soal ini dilewati dan dikunci.");
        window.setTimeout(() => setNotice(undefined), 3000);
      }
      if (indexRef.current !== at) return;
      goNext(at);
    } finally {
      skipInFlightRef.current = false;
    }
  }

  const handleTimeoutRef = useRef(handleTimeout);
  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  });

  useEffect(() => {
    if (phase !== "quiz" || !question || currentAnswered) return;
    if (timeLeft.get(question.id) !== 0) return;
    if (skipInFlightRef.current) return;
    skipInFlightRef.current = true;
    void handleTimeoutRef.current();
  }, [phase, question, currentAnswered, timeLeft]);

  async function handleFinish() {
    setFinishing(true);
    setFinishError(undefined);
    const result = await completeAssessmentAction();
    if (result?.ok === false) {
      setFinishError(result.error);
      setFinishing(false);
    }
  }

  if (phase === "intro") {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#161616] px-7 py-10 sm:px-10 sm:py-12">
        <TeraMark className="size-12" />
        <h2 className="mt-6 text-xl font-medium tracking-tight text-white sm:text-2xl">
          Nggak ada jawaban benar atau salah
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-zinc-400">
          <li>
            24 soal ringan, masing-masing punya waktu 15 detik. Jawab spontan
            sesuai dirimu, bukan yang kelihatan keren.
          </li>
          <li>
            Waktunya cuma jalan pas soal itu kamu buka. Kalau pindah soal,
            sisanya disimpan dan lanjut pas kamu balik.
          </li>
          <li>
            Jangan khawatir salah pencet. Jawabanmu tersimpan otomatis dan
            masih bisa diganti.
          </li>
          <li>
            Pakai grid nomor buat balik ke soal yang sudah kamu buka. Kalau
            waktu habis, soal itu dilewati dan dikunci.
          </li>
        </ul>
        <button
          type="button"
          onClick={() => setPhase("quiz")}
          className="mt-7 h-11 w-full rounded-full bg-white text-[13px] font-medium text-black transition-colors hover:bg-zinc-200 sm:w-56"
        >
          Mulai asesmen
        </button>
      </div>
    );
  }

  if (phase === "finish") {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#161616] px-7 py-10 sm:px-10 sm:py-12">
        <TeraMark className="size-12" />
        <h2 className="mt-6 text-xl font-medium tracking-tight text-white sm:text-2xl">
          {remainingCount === 0
            ? "Semua soal udah tertangani"
            : "Hampir selesai"}
        </h2>
        {remainingCount > 0 ? (
          <>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
              Masih ada {remainingCount} soal yang belum dijawab
              {lockedCount > 0
                ? `, plus ${lockedCount} soal terkunci karena waktu habis`
                : ""}
              . Kerjakan dulu yang tersisa, ya.
            </p>
            <button
              type="button"
              onClick={() => {
                const target = firstUnansweredIndex();
                setPhase("quiz");
                goTo(target === -1 ? 0 : target);
              }}
              className="mt-7 h-11 rounded-full bg-white px-5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
            >
              Kerjakan sisa soal
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
              Jawabanmu tersimpan.
              {lockedCount > 0
                ? ` ${lockedCount} soal terkunci karena waktu habis, dan itu nggak masalah.`
                : ""}{" "}
              Tekan tombol di bawah buat ngunci jawaban dan lanjut ke langkah
              berikutnya.
            </p>
            {finishError && (
              <p className="mt-4 text-[12px] text-red-400">{finishError}</p>
            )}
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setPhase("quiz");
                  goTo(lastOpenIndex());
                }}
                className="h-11 rounded-full border border-white/10 px-5 text-[13px] text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cek lagi jawaban
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={finishing}
                className="h-11 rounded-full bg-white px-5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finishing ? "Menyimpan..." : "Simpan & proses"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const prevIndex = prevOpenIndex(index);
  const isLastQuestion = index === total - 1;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-white/6 px-2 py-1 text-[10px] text-zinc-300">
          {question && CATEGORY_LABELS[question.category]}
        </span>
        <span className="text-[11px] text-zinc-500">
          {answeredCount}/{total} terjawab
          {lockedCount > 0 ? `, ${lockedCount} terkunci` : ""}
        </span>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-8 gap-1.5 sm:grid-cols-12">
        {questions.map((item, i) => {
          const score = answers.get(item.id);
          const isLocked = score === 0;
          const isAnswered = score !== undefined && score > 0;
          const isCurrent = i === index;
          const isUnopened = score === undefined && !isCurrent && !visited.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={isLocked || isUnopened}
              onClick={() => goTo(i)}
              aria-label={`Soal ${i + 1}${
                isLocked
                  ? " (terkunci)"
                  : isAnswered
                    ? " (terjawab)"
                    : isUnopened
                      ? " (belum dibuka)"
                      : ""
              }`}
              className={[
                "grid h-8 place-items-center rounded-lg text-[11px] transition-colors",
                isLocked
                  ? "cursor-not-allowed bg-white/4 text-zinc-700"
                  : isUnopened
                    ? "cursor-not-allowed border border-dashed border-white/10 text-zinc-600"
                    : isAnswered
                      ? "bg-white font-medium text-black hover:bg-zinc-200"
                      : "bg-white/6 text-zinc-400 hover:bg-white/12 hover:text-white",
                isCurrent && !isLocked
                  ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#050505]"
                  : "",
              ].join(" ")}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/8 bg-[#161616] px-7 py-10 sm:px-10 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={question?.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="pt-1 text-[11px] text-zinc-500">
                Soal {index + 1} dari {total}
              </p>
              {currentAnswered ? (
                <span className="pt-1 text-[11px] text-zinc-600">
                  Sudah dijawab
                </span>
              ) : (
                <span
                  className={
                    currentTimeLeft <= 5
                      ? "flex items-baseline gap-1 rounded-xl border border-amber-300/30 px-3 py-1.5 text-amber-300"
                      : "flex items-baseline gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-white"
                  }
                >
                  <span className="text-2xl font-semibold leading-none tabular-nums">
                    {currentTimeLeft}
                  </span>
                  <span className="text-[11px] opacity-70">detik</span>
                </span>
              )}
            </div>
            <h2 className="mt-3 text-lg font-medium leading-relaxed tracking-tight text-white sm:text-xl">
              {question?.questionText}
            </h2>

            <div className="mt-8 flex flex-col gap-2 sm:grid sm:grid-cols-5">
              {SCALE.map((option) => {
                const isSelected = currentScore === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={saveState === "saving"}
                    onClick={() => void handleSelect(option.value)}
                    className={
                      isSelected
                        ? "rounded-xl border border-white bg-white px-3 py-3 text-[12px] font-medium text-black transition-colors sm:min-h-16"
                        : "rounded-xl border border-white/12 px-3 py-3 text-[12px] text-zinc-300 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60 sm:min-h-16"
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex h-4 items-center justify-between">
              <span
                className={
                  notice
                    ? "text-[11px] text-amber-300/80"
                    : "text-[11px] text-zinc-600"
                }
              >
                {notice ??
                  (saveState === "saving"
                    ? "Menyimpan..."
                    : saveState === "saved"
                      ? "Tersimpan"
                      : "")}
              </span>
              {saveError && (
                <span className="text-[11px] text-red-400">{saveError}</span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(prevIndex)}
          disabled={prevIndex === -1}
          className="h-10 rounded-full border border-white/10 px-5 text-[13px] text-zinc-300 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Kembali
        </button>
        {isLastQuestion ? (
          <button
            type="button"
            onClick={() => setPhase("finish")}
            disabled={!allHandled}
            className="h-10 rounded-full bg-white px-5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Selesai
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goNext(index)}
            disabled={!currentAnswered}
            className="h-10 rounded-full bg-white px-5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Lanjut
          </button>
        )}
      </div>
    </div>
  );
}
