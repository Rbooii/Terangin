"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { TeraMark } from "./TeraMark";
import { ArrowUp, CopyIcon, TrashIcon } from "./icons";

const AI_TEXT_1 =
  "Halo! Hasil analisismu udah siap. Kamu paling kuat di analisis data dan empati. Dua arah itu cocok banget buat Psikologi atau Sistem Informasi.";

const USER_TEXT =
  "Keren, top 3-nya masuk akal. Lanjut bahas biaya kuliah dan peluang beasiswanya ya.";

const AI_TEXT_2 =
  "Buat Psikologi di UI, estimasi UKT sekitar Rp 8,5jt per semester dengan daya tampung 70 orang. Ada juga jalur beasiswa seperti KIP Kuliah buat bantu biaya awal. Mau aku bantu susun target belajar dan persiapanmu?";

type Stage =
  | "waiting"
  | "stream1"
  | "pause1"
  | "user"
  | "waiting2"
  | "stream2"
  | "done";

const STAGE_ORDER: Record<Stage, number> = {
  waiting: 0,
  stream1: 1,
  pause1: 2,
  user: 3,
  waiting2: 4,
  stream2: 5,
  done: 6,
};

const CHAR_TICK_MS = 24;
const CHARS_PER_TICK = 2;

function TypingDots() {
  return (
    <div className="flex items-center gap-3">
      <TeraMark className="size-7 shrink-0" />
      <div className="flex items-center gap-1.5 py-1">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="size-1.5 rounded-full bg-zinc-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}

function CopyRow() {
  return (
    <div className="mt-0.5 flex pl-10">
      <span className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] text-zinc-500">
        <CopyIcon className="size-3.5" />
        Salin
      </span>
    </div>
  );
}

export default function ChatDemo({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [stage, setStage] = useState<Stage>("waiting");
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    if (!active) {
      return;
    }
    if (reduceMotion) {
      const timer = window.setTimeout(() => {
        setStage("done");
        setCount1(AI_TEXT_1.length);
        setCount2(AI_TEXT_2.length);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    if (stage === "waiting") {
      const timer = window.setTimeout(() => setStage("stream1"), 900);
      return () => window.clearTimeout(timer);
    }
    if (stage === "stream1") {
      countRef.current = 0;
      const interval = window.setInterval(() => {
        countRef.current += CHARS_PER_TICK;
        if (countRef.current >= AI_TEXT_1.length) {
          countRef.current = AI_TEXT_1.length;
          setCount1(AI_TEXT_1.length);
          window.clearInterval(interval);
          setStage("pause1");
          return;
        }
        setCount1(countRef.current);
      }, CHAR_TICK_MS);
      return () => window.clearInterval(interval);
    }
    if (stage === "pause1") {
      const timer = window.setTimeout(() => setStage("user"), 650);
      return () => window.clearTimeout(timer);
    }
    if (stage === "user") {
      const timer = window.setTimeout(() => setStage("waiting2"), 1100);
      return () => window.clearTimeout(timer);
    }
    if (stage === "waiting2") {
      const timer = window.setTimeout(() => setStage("stream2"), 900);
      return () => window.clearTimeout(timer);
    }
    if (stage === "stream2") {
      countRef.current = 0;
      const interval = window.setInterval(() => {
        countRef.current += CHARS_PER_TICK;
        if (countRef.current >= AI_TEXT_2.length) {
          countRef.current = AI_TEXT_2.length;
          setCount2(AI_TEXT_2.length);
          window.clearInterval(interval);
          setStage("done");
          return;
        }
        setCount2(countRef.current);
      }, CHAR_TICK_MS);
      return () => window.clearInterval(interval);
    }
  }, [active, stage, reduceMotion]);

  const order = STAGE_ORDER[stage];
  const ai1Visible = active && order >= STAGE_ORDER.stream1;
  const userVisible = active && order >= STAGE_ORDER.user;
  const ai2Visible = active && order >= STAGE_ORDER.stream2;

  return (
    <div className="flex min-h-[460px] flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-white/6 pb-4">
        <TeraMark className="size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-white">Tera</p>
          <p className="truncate text-[11px] text-zinc-500">
            Konselor jurusanmu, jawab pakai data profilmu
          </p>
        </div>
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-500"
        >
          <TrashIcon className="size-4" />
        </span>
      </div>

      <div className="flex-1 space-y-6 pt-5">
        {active && stage === "waiting" && <TypingDots />}

        {ai1Visible && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-start gap-3">
              <TeraMark className="mt-0.5 size-7 shrink-0" />
              <div
                className={`min-w-0 flex-1 text-[13px] leading-relaxed text-zinc-300 ${
                  stage === "stream1" ? "chat-streaming" : ""
                }`}
              >
                <p className="mb-2.5 last:mb-0">
                  {AI_TEXT_1.slice(0, reduceMotion ? AI_TEXT_1.length : count1)}
                </p>
              </div>
            </div>
            {order > STAGE_ORDER.stream1 && <CopyRow />}
          </motion.div>
        )}

        {userVisible && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="flex justify-end"
          >
            <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-white px-4 py-2.5 text-[13px] leading-relaxed text-black">
              {USER_TEXT}
            </div>
          </motion.div>
        )}

        {active && stage === "waiting2" && <TypingDots />}

        {ai2Visible && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-start gap-3">
              <TeraMark className="mt-0.5 size-7 shrink-0" />
              <div
                className={`min-w-0 flex-1 text-[13px] leading-relaxed text-zinc-300 ${
                  stage === "stream2" ? "chat-streaming" : ""
                }`}
              >
                <p className="mb-2.5 last:mb-0">
                  {AI_TEXT_2.slice(0, reduceMotion ? AI_TEXT_2.length : count2)}
                </p>
              </div>
            </div>
            {stage === "done" && <CopyRow />}
          </motion.div>
        )}
      </div>

      <div className="mt-5 flex items-end gap-2 rounded-2xl border border-white/10 bg-[#161616] p-2 pl-4">
        <span className="min-h-9 flex-1 py-2 text-[13px] text-zinc-600">
          Pesan Tera
        </span>
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black"
        >
          <ArrowUp className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-center text-[10px] text-zinc-600">
        Tera bisa keliru. Cek info resmi kampus sebelum memutuskan ya.
      </p>
    </div>
  );
}
