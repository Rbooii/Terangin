"use client";

import { motion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runAnalysisAction } from "@/lib/actions/analysis";
import { FACTOR_WEIGHTS } from "@/lib/analysis/score";
import { TeraMark } from "@/components/landing/TeraMark";
import { CheckIcon, SparkleIcon } from "@/components/landing/icons";

export type CampusView = {
  universityName: string;
  type: string;
  location: string | null;
  capacity: number | null;
  estimatedTuition: string | null;
};

export type FactorView = {
  minat: number | null;
  bakat: number | null;
  nilai: number | null;
  kepribadian: number | null;
  gayaBelajar: number | null;
  total: number | null;
  match: number | null;
};

export type SavedAnalysisView = {
  personalityType: string;
  summary: string;
  strengths: string[];
  alignmentNote: string;
  generatedAt: string;
  weights?: Record<string, number>;
  method?: string;
  recommendations: {
    majorId: string;
    majorName: string;
    matchPercentage: number;
    rankOrder: number;
    reason: string;
    factors: FactorView | null;
    campuses: CampusView[];
  }[];
};

export type AnalysisStats = {
  answeredCount: number;
  subjectCount: number;
  semesterCount: number;
  interests: string[];
  categoryAverages: {
    label: string;
    average: number | null;
  }[];
  topSubjects: { subject: string; average: number }[];
};

const STAGES = [
  "Membaca profil dan minat awalmu",
  "Menganalisis jawaban asesmen",
  "Mencocokkan nilai rapor",
  "Menyusun rekomendasi jurusan",
];

function formatTuition(value: string | null) {
  if (!value) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  const millions = amount / 1_000_000;
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(millions);
  return `Rp ${formatted}jt per semester`;
}

export type FactorKeyView =
  | "minat"
  | "bakat"
  | "nilai"
  | "kepribadian"
  | "gayaBelajar";

const FACTOR_ROWS: Array<{ key: FactorKeyView; label: string }> = [
  { key: "minat", label: "Minat" },
  { key: "bakat", label: "Bakat" },
  { key: "nilai", label: "Nilai rapor" },
  { key: "kepribadian", label: "Kepribadian" },
  { key: "gayaBelajar", label: "Gaya belajar" },
];

function FactorBreakdown({ factors }: { factors: FactorView | null }) {
  if (!factors) return null;
  const entries = FACTOR_ROWS.map((row) => ({
    label: row.label,
    value: factors[row.key],
  })).filter(
    (entry): entry is { label: string; value: number } =>
      entry.value !== null && entry.value !== undefined,
  );
  if (entries.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-overlay/6 bg-overlay/[0.02] px-3.5 py-3 sm:grid-cols-5">
      {entries.map((entry) => (
        <div key={entry.label}>
          <div className="flex items-baseline justify-between gap-1.5">
            <span className="truncate text-[10px] text-fg-faint">
              {entry.label}
            </span>
            <span className="text-[11px] tabular-nums text-fg-secondary">
              {Math.round(entry.value)}
            </span>
          </div>
          <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-overlay/8">
            <div
              className="h-full rounded-full bg-overlay/50"
              style={{
                width: `${Math.max(0, Math.min(100, entry.value))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalysisPanel({
  saved,
  stats,
}: {
  saved: SavedAnalysisView | null;
  stats: AnalysisStats;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "running" | "error">("idle");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "running") return;
    const interval = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, STAGES.length - 1));
    }, 2200);
    return () => window.clearInterval(interval);
  }, [mode]);

  async function run() {
    setStage(0);
    setMode("running");
    setError(undefined);
    const result = await runAnalysisAction();
    if (!result.ok) {
      setError(result.error);
      setMode("error");
      return;
    }
    startTransition(() => {
      router.refresh();
    });
  }

  if (mode === "running") {
    return (
      <div className="rounded-2xl border border-overlay/8 bg-surface px-7 py-10 sm:px-10 sm:py-12">
        <motion.div
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="w-fit"
        >
          <TeraMark className="size-12" />
        </motion.div>
        <h2 className="mt-6 text-xl font-medium tracking-tight text-fg sm:text-2xl">
          Tera lagi menganalisis
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
          Prosesnya sekitar 10 sampai 30 detik. Jangan tutup halaman ini ya.
        </p>
        <ul className="mt-7 space-y-3">
          {STAGES.map((label, index) => {
            const isDone = index < stage;
            const isActive = index === stage;
            return (
              <li key={label} className="flex items-center gap-3">
                <span
                  className={
                    isDone
                      ? "grid size-6 shrink-0 place-items-center rounded-full bg-success/15 text-success"
                      : isActive
                        ? "grid size-6 shrink-0 place-items-center rounded-full border border-overlay/30"
                        : "grid size-6 shrink-0 place-items-center rounded-full border border-overlay/10"
                  }
                >
                  {isDone ? (
                    <CheckIcon className="size-3.5" />
                  ) : isActive ? (
                    <motion.span
                      animate={{ scale: [1, 0.5, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="size-2 rounded-full bg-primary"
                    />
                  ) : null}
                </span>
                <span
                  className={
                    isDone || isActive
                      ? "text-[13px] text-fg-soft"
                      : "text-[13px] text-fg-faintest"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (!saved) {
    return (
      <div className="rounded-2xl border border-overlay/8 bg-surface px-7 py-10 sm:px-10 sm:py-12">
        <TeraMark className="size-12" />
        <h2 className="mt-6 text-xl font-medium tracking-tight text-fg sm:text-2xl">
          Analisis siap dijalankan
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
          Skor kecocokan dihitung dari 5 faktor berbobot: minat, bakat, nilai
          rapor, kepribadian, dan gaya belajar. Hasilnya profil singkat plus 3
          sampai 5 rekomendasi jurusan, lengkap dengan rincian skornya.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-overlay/10 px-3 py-1 text-[11px] text-fg-muted">
            {stats.answeredCount} jawaban asesmen
          </span>
          <span className="rounded-full border border-overlay/10 px-3 py-1 text-[11px] text-fg-muted">
            {stats.subjectCount} mapel dari {stats.semesterCount} semester
          </span>
          {stats.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-overlay/10 px-3 py-1 text-[11px] text-fg-muted"
            >
              {interest}
            </span>
          ))}
        </div>
        {error && <p className="mt-5 text-[12px] text-danger">{error}</p>}
        <button
          type="button"
          onClick={() => void run()}
          className="mt-7 h-11 w-full rounded-full bg-primary text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover sm:w-56"
        >
          {mode === "error" ? "Coba lagi" : "Mulai analisis"}
        </button>
      </div>
    );
  }

  const generatedDate = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(new Date(saved.generatedAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12px] text-fg-faint">
          Dianalisis {generatedDate}
        </span>
        <button
          type="button"
          onClick={() => void run()}
          className="h-9 rounded-full border border-overlay/10 px-4 text-[12px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
        >
          Analisis ulang
        </button>
      </div>

      {error && <p className="text-[12px] text-danger">{error}</p>}

      <div className="rounded-2xl border border-overlay/8 bg-surface p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <TeraMark className="size-12 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-fg-faint">
              Tipe kepribadian dominan
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
              {saved.personalityType}
            </h2>
          </div>
        </div>
        <p className="mt-5 rounded-xl border border-overlay/8 bg-sunken px-4 py-3 text-[13px] leading-relaxed text-fg-secondary">
          {saved.alignmentNote}
        </p>
      </div>

      <div className="rounded-2xl border border-overlay/8 bg-surface p-6 sm:p-7">
        <h2 className="text-[15px] font-medium text-fg">
          Ringkasan potensimu
        </h2>
        <div className="mt-4 space-y-3">
          {saved.summary
            .split(/\n{1,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p
                key={index}
                className="text-[13px] leading-relaxed text-fg-muted"
              >
                {paragraph}
              </p>
            ))}
        </div>
      </div>

      <div className="rounded-2xl border border-overlay/8 bg-surface p-6 sm:p-7">
        <h2 className="text-[15px] font-medium text-fg">Kekuatanmu</h2>
        <ul className="mt-4 space-y-2.5">
          {saved.strengths.map((strength) => (
            <li key={strength} className="flex items-start gap-2.5">
              <SparkleIcon className="mt-0.5 size-3.5 shrink-0 text-violet-400" />
              <span className="text-[13px] leading-relaxed text-fg-secondary">
                {strength}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.categoryAverages.map((category) => (
            <div
              key={category.label}
              className="rounded-xl border border-overlay/8 bg-sunken px-3 py-3"
            >
              <p className="text-[10px] text-fg-faint">{category.label}</p>
              <p className="mt-1 text-lg font-semibold text-fg">
                {category.average === null
                  ? "-"
                  : category.average.toFixed(1)}
                <span className="text-[10px] font-normal text-fg-faint">
                  /5
                </span>
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-overlay/8">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${((category.average ?? 0) / 5) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {stats.topSubjects.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {stats.topSubjects.map((item) => (
              <span
                key={item.subject}
                className="rounded-full border border-overlay/10 px-3 py-1 text-[11px] text-fg-muted"
              >
                {item.subject} {item.average}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-overlay/8 bg-surface p-6 sm:p-7">
        <h2 className="text-[15px] font-medium text-fg">
          Rekomendasi jurusan
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed text-fg-faint">
          Skor dihitung sistem dari data kamu dengan bobot tetap, lalu Tera
          menulis alasannya berdasarkan skor tersebut.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {FACTOR_ROWS.map((row) => (
            <span
              key={row.key}
              className="rounded-full border border-overlay/10 px-2.5 py-1 text-[10px] text-fg-muted"
            >
              {row.label}{" "}
              {Math.round(((saved.weights ?? FACTOR_WEIGHTS)[row.key] ?? 0) * 100)}
              %
            </span>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {saved.recommendations.map((item) => (
            <div
              key={item.majorId}
              className="rounded-xl border border-overlay/8 bg-sunken p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={
                    item.rankOrder === 1
                      ? "grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-[12px] font-semibold text-primary-fg"
                      : "grid size-7 shrink-0 place-items-center rounded-lg bg-overlay/8 text-[12px] text-fg-secondary"
                  }
                >
                  {item.rankOrder}
                </span>
                <h3 className="min-w-0 flex-1 truncate text-[14px] font-medium text-fg">
                  {item.majorName}
                </h3>
                <span className="shrink-0 text-[13px] font-semibold text-fg">
                  {item.matchPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-overlay/8">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${item.matchPercentage}%` }}
                />
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-fg-muted">
                {item.reason}
              </p>
              <FactorBreakdown factors={item.factors} />
              {item.campuses.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {item.campuses.map((campus) => (
                    <p
                      key={`${item.majorId}-${campus.universityName}`}
                      className="text-[11px] text-fg-faint"
                    >
                      {campus.universityName}
                      {campus.location ? `, ${campus.location}` : ""}
                      {campus.type ? ` (${campus.type})` : ""}
                      {campus.capacity
                        ? `, daya tampung sekitar ${campus.capacity}`
                        : ""}
                      {formatTuition(campus.estimatedTuition)
                        ? `, UKT ${formatTuition(campus.estimatedTuition)}`
                        : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-fg-faintest">
          Daya tampung dan UKT adalah perkiraan untuk gambaran awal. Cek angka
          resmi di situs kampus tujuanmu ya.
        </p>
      </div>

      <p className="text-[12px] leading-relaxed text-fg-faint">
        Hasil ini panduan awal buat kamu dan Tera. Keputusan akhirnya tetap
        milikmu, dan bisa berubah seiring data baru.
      </p>
    </div>
  );
}
