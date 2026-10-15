"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { TeraMark } from "@/components/landing/TeraMark";

const slides = [
  {
    title: "Kenalan sama Tera",
    body: "Tera teman ngobrolmu di Terang.in. Tugasnya satu: bantu kamu paham diri sendiri, biar pilihan jurusanmu datang dari kesadaran sendiri, bukan ikut-ikutan.",
  },
  {
    title: "Asesmen tanpa dihakimi",
    body: "Jawab kuis santai soal minat, bakat, kepribadian, dan gaya belajarmu. Nggak ada jawaban benar atau salah. Kamu juga bisa masukin nilai rapor dan prestasi.",
  },
  {
    title: "Analisis yang jujur",
    body: "Terang.in nyocokin apa yang kamu suka dengan apa yang kamu kuasai. Hasilnya gambaran potensi dirimu dan rekomendasi jurusan yang masuk akal buat kamu.",
  },
  {
    title: "Ngobrol sama Tera, susun rencana",
    body: "Tanya apa aja soal jurusan, biaya kuliah, sampai beasiswa. Tera bantu susun roadmap persiapanmu, dan keputusan akhirnya tetap milikmu.",
  },
];

export default function TourSlides() {
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const slide = slides[index];

  return (
    <div className="mt-8">
      <div className="relative overflow-hidden rounded-2xl border border-overlay/8 bg-surface px-7 py-10 sm:px-10 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-fit"
            >
              <TeraMark className="size-14" />
            </motion.div>
            <h2 className="mt-6 text-xl font-medium tracking-tight text-fg sm:text-2xl">
              {slide.title}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-fg-muted">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
          className="h-10 rounded-full border border-overlay/10 px-5 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Kembali
        </button>

        <div className="flex items-center gap-1.5">
          {slides.map((item, i) => (
            <span
              key={item.title}
              className={
                i === index
                  ? "size-1.5 rounded-full bg-primary"
                  : "size-1.5 rounded-full bg-overlay/20"
              }
            />
          ))}
        </div>

        {isLast ? (
          <form action={completeOnboardingAction}>
            <button
              type="submit"
              className="h-10 rounded-full bg-primary px-5 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
            >
              Mulai perjalananmu
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((value) => value + 1)}
            className="h-10 rounded-full bg-primary px-5 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
          >
            Lanjut
          </button>
        )}
      </div>
    </div>
  );
}
