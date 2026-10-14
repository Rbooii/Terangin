"use client";

import { useState } from "react";
import {
  completeGradesAction,
  deleteGradeAction,
  saveGradeAction,
} from "@/lib/actions/grades";
import { TrashIcon } from "@/components/landing/icons";

type GradeRow = {
  key: string;
  subject: string;
  score: string;
  semester: number;
  persisted: boolean;
  status: "idle" | "saving" | "saved" | "error";
  error?: string;
};

const SUBJECT_PRESETS = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Fisika",
  "Kimia",
  "Biologi",
  "Ekonomi",
  "Sosiologi",
  "Geografi",
  "Sejarah",
  "PPKn",
  "Informatika",
];

function makeRow(input: {
  subject: string;
  score?: string;
  semester: number;
  persisted?: boolean;
}): GradeRow {
  return {
    key: crypto.randomUUID(),
    subject: input.subject,
    score: input.score ?? "",
    semester: input.semester,
    persisted: input.persisted ?? false,
    status: "idle",
  };
}

function ghostKey(semester: number, subject: string) {
  return `${semester}:${subject.trim().toLowerCase()}`;
}

export default function GradeInput({
  initialRecords,
  defaultSemesters,
  completed,
}: {
  initialRecords: { subject: string; semester: number; score: string }[];
  defaultSemesters: number[];
  completed: boolean;
}) {
  const initialSemesters = Array.from(
    new Set([...defaultSemesters, ...initialRecords.map((r) => r.semester)]),
  ).sort((a, b) => a - b);

  const [semesters, setSemesters] = useState<number[]>(initialSemesters);
  const [activeSemester, setActiveSemester] = useState(initialSemesters[0]);
  const [rows, setRows] = useState<GradeRow[]>(() =>
    initialRecords.map((record) =>
      makeRow({
        subject: record.subject,
        score: String(Number(record.score)),
        semester: record.semester,
        persisted: true,
      }),
    ),
  );
  const [lastAddedKey, setLastAddedKey] = useState<string>();
  const [dismissedGhosts, setDismissedGhosts] = useState<Set<string>>(
    new Set(),
  );
  const [ghostScores, setGhostScores] = useState<Record<string, string>>({});
  const [ghostStates, setGhostStates] = useState<
    Record<string, { status: "saving" | "error"; error?: string }>
  >({});
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string>();

  const semesterRows = rows.filter((row) => row.semester === activeSemester);
  const persistedCount = semesterRows.filter((row) => row.persisted).length;
  const totalPersisted = rows.filter((row) => row.persisted).length;

  const semesterOneSubjects = Array.from(
    new Set(
      rows
        .filter((row) => row.semester === 1 && row.persisted)
        .map((row) => row.subject.trim()),
    ),
  ).filter(Boolean);

  const visibleSubjects = new Set(
    semesterRows.map((row) => row.subject.trim().toLowerCase()),
  );

  const ghostSubjects =
    activeSemester >= 2
      ? semesterOneSubjects.filter((subject) => {
          const lower = subject.toLowerCase();
          if (visibleSubjects.has(lower)) return false;
          if (dismissedGhosts.has(ghostKey(activeSemester, subject)))
            return false;
          return true;
        })
      : [];

  const chipCandidates = Array.from(
    new Map(
      [...semesterOneSubjects, ...SUBJECT_PRESETS].map((subject) => [
        subject.toLowerCase(),
        subject,
      ]),
    ).values(),
  );
  const ghostLower = new Set(ghostSubjects.map((s) => s.toLowerCase()));
  const presetsToShow = chipCandidates.filter((subject) => {
    const lower = subject.toLowerCase();
    return !visibleSubjects.has(lower) && !ghostLower.has(lower);
  });

  function updateRow(
    key: string,
    patch: Partial<GradeRow> | ((row: GradeRow) => Partial<GradeRow>),
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? { ...row, ...(typeof patch === "function" ? patch(row) : patch) }
          : row,
      ),
    );
  }

  function flashSaved(key: string) {
    updateRow(key, { status: "saved" });
    window.setTimeout(() => {
      updateRow(key, (current) =>
        current.status === "saved" ? { status: "idle" } : {},
      );
    }, 2200);
  }

  function markDismissedIfSuggested(subject: string, semester: number) {
    const lower = subject.trim().toLowerCase();
    if (!semesterOneSubjects.some((item) => item.toLowerCase() === lower)) {
      return;
    }
    setDismissedGhosts((prev) => {
      const key = ghostKey(semester, lower);
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  async function saveRow(row: GradeRow) {
    const subject = row.subject.trim();
    if (!subject || row.score.trim() === "") return;

    const value = Number(row.score);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      updateRow(row.key, {
        status: "error",
        error: "Nilai harus antara 0 sampai 100.",
      });
      return;
    }

    const duplicate = rows.some(
      (other) =>
        other.key !== row.key &&
        other.semester === row.semester &&
        other.subject.trim().toLowerCase() === subject.toLowerCase(),
    );
    if (duplicate) {
      updateRow(row.key, {
        status: "error",
        error: "Mapel ini udah ada di semester ini.",
      });
      return;
    }

    updateRow(row.key, { status: "saving", error: undefined });
    const result = await saveGradeAction({
      subject,
      semester: row.semester,
      score: value,
    });

    if (!result.ok) {
      updateRow(row.key, {
        status: "error",
        error: result.error ?? "Gagal menyimpan. Coba ubah nilainya lagi.",
      });
      return;
    }

    updateRow(row.key, {
      status: "saved",
      persisted: true,
      subject,
      score: String(value),
      error: undefined,
    });
    window.setTimeout(() => {
      updateRow(row.key, (current) =>
        current.status === "saved" ? { status: "idle" } : {},
      );
    }, 2200);
  }

  async function saveGhost(subject: string, semester: number, key: string) {
    const raw = ghostScores[key] ?? "";
    if (raw.trim() === "") return;

    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setGhostStates((prev) => ({
        ...prev,
        [key]: { status: "error", error: "Nilai harus antara 0 sampai 100." },
      }));
      return;
    }

    const duplicate = rows.some(
      (row) =>
        row.semester === semester &&
        row.subject.trim().toLowerCase() === subject.toLowerCase(),
    );
    if (duplicate) {
      setGhostStates((prev) => ({
        ...prev,
        [key]: {
          status: "error",
          error: "Mapel ini udah ada di semester ini.",
        },
      }));
      return;
    }

    setGhostStates((prev) => ({ ...prev, [key]: { status: "saving" } }));
    const result = await saveGradeAction({ subject, semester, score: value });

    if (!result.ok) {
      setGhostStates((prev) => ({
        ...prev,
        [key]: {
          status: "error",
          error: result.error ?? "Gagal menyimpan. Coba lagi.",
        },
      }));
      return;
    }

    const newRow = makeRow({
      subject,
      score: String(value),
      semester,
      persisted: true,
    });
    setRows((prev) => [...prev, newRow]);
    setGhostScores((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setGhostStates((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    flashSaved(newRow.key);
  }

  function dismissGhost(subject: string, semester: number) {
    setDismissedGhosts((prev) => {
      const next = new Set(prev);
      next.add(ghostKey(semester, subject));
      return next;
    });
  }

  async function removeRow(row: GradeRow) {
    markDismissedIfSuggested(row.subject, row.semester);

    if (!row.persisted) {
      setRows((prev) => prev.filter((item) => item.key !== row.key));
      return;
    }

    updateRow(row.key, { status: "saving", error: undefined });
    const result = await deleteGradeAction({
      subject: row.subject,
      semester: row.semester,
    });

    if (!result.ok) {
      updateRow(row.key, {
        status: "error",
        error: result.error ?? "Gagal menghapus. Coba lagi.",
      });
      return;
    }
    setRows((prev) => prev.filter((item) => item.key !== row.key));
  }

  function addRow(subject: string) {
    const row = makeRow({ subject, semester: activeSemester });
    setRows((prev) => [...prev, row]);
    setLastAddedKey(row.key);
  }

  function addSemester() {
    const next = Math.max(...semesters) + 1;
    setSemesters((prev) => [...prev, next]);
    setActiveSemester(next);
  }

  async function handleFinish() {
    setFinishing(true);
    setFinishError(undefined);
    const result = await completeGradesAction();
    if (result?.ok === false) {
      setFinishError(result.error);
      setFinishing(false);
    }
  }

  return (
    <div>
      {completed && (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/6 px-4 py-3 text-[12px] leading-relaxed text-emerald-200/90">
          Nilai rapormu udah tersimpan. Kamu masih bisa nambahin atau ngubah
          nilai kapan aja.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {semesters.map((semester) => (
          <button
            key={semester}
            type="button"
            onClick={() => setActiveSemester(semester)}
            className={
              semester === activeSemester
                ? "h-9 rounded-full bg-white px-4 text-[12px] font-medium text-black"
                : "h-9 rounded-full border border-white/12 px-4 text-[12px] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            }
          >
            Semester {semester}
          </button>
        ))}
        {semesters.length < 5 && (
          <button
            type="button"
            onClick={addSemester}
            className="h-9 rounded-full border border-dashed border-white/15 px-4 text-[12px] text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
          >
            + Semester
          </button>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-white/8 bg-[#161616] p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-medium text-white">
            Semester {activeSemester}
          </h2>
          <span className="text-[11px] text-zinc-500">
            {persistedCount > 0
              ? `${persistedCount} mapel tersimpan`
              : "Belum ada nilai"}
          </span>
        </div>

        <div className="mt-5 space-y-2.5">
          {semesterRows.length === 0 && ghostSubjects.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[12px] text-zinc-500">
              Belum ada mapel di semester ini. Tambahin lewat chip di bawah.
            </p>
          )}

          {semesterRows.map((row) => (
            <div key={row.key}>
              <div className="flex items-center gap-2">
                {row.persisted ? (
                  <span className="h-10 min-w-0 flex-1 truncate rounded-xl border border-white/6 bg-white/[0.02] px-3 text-[13px] leading-10 text-zinc-300">
                    {row.subject}
                  </span>
                ) : (
                  <input
                    value={row.subject}
                    onChange={(e) =>
                      updateRow(row.key, { subject: e.target.value })
                    }
                    list="subject-presets"
                    placeholder="Nama mata pelajaran"
                    maxLength={50}
                    autoFocus={row.key === lastAddedKey}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[13px] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/25"
                  />
                )}
                <input
                  value={row.score}
                  onChange={(e) => updateRow(row.key, { score: e.target.value })}
                  onBlur={() => void saveRow(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  inputMode="decimal"
                  placeholder="0-100"
                  autoFocus={row.persisted && row.key === lastAddedKey}
                  aria-label={`Nilai ${row.subject || "mapel baru"}`}
                  className="h-10 w-24 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-right text-[13px] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/25"
                />
                <button
                  type="button"
                  onClick={() => void removeRow(row)}
                  disabled={row.status === "saving"}
                  aria-label={`Hapus ${row.subject || "mapel"}`}
                  className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 text-zinc-500 transition-colors hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
              <div className="mt-1 flex h-4 items-center pl-1">
                {row.error ? (
                  <span className="text-[11px] text-red-400">{row.error}</span>
                ) : row.status === "saving" ? (
                  <span className="text-[11px] text-zinc-600">
                    Menyimpan...
                  </span>
                ) : row.status === "saved" ? (
                  <span className="text-[11px] text-zinc-600">Tersimpan</span>
                ) : !row.persisted && row.subject.trim() && !row.score.trim() ? (
                  <span className="text-[11px] text-zinc-600">
                    Isi nilainya buat nyimpen.
                  </span>
                ) : null}
              </div>
            </div>
          ))}

          {ghostSubjects.length > 0 && (
            <div className="space-y-2.5 pt-3">
              <p className="text-[11px] text-zinc-500">
                Saran dari Semester 1
              </p>
              {ghostSubjects.map((subject) => {
                const key = ghostKey(activeSemester, subject);
                const state = ghostStates[key];
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2">
                      <span className="h-10 min-w-0 flex-1 truncate rounded-xl border border-dashed border-white/10 px-3 text-[13px] leading-10 text-zinc-500">
                        {subject}
                      </span>
                      <input
                        value={ghostScores[key] ?? ""}
                        onChange={(e) =>
                          setGhostScores((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        onBlur={() => void saveGhost(subject, activeSemester, key)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        inputMode="decimal"
                        placeholder="0-100"
                        aria-label={`Nilai ${subject} (saran)`}
                        className="h-10 w-24 shrink-0 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 text-right text-[13px] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.04]"
                      />
                      <button
                        type="button"
                        onClick={() => dismissGhost(subject, activeSemester)}
                        className="h-10 shrink-0 rounded-xl border border-white/10 px-3 text-[12px] text-zinc-500 transition-colors hover:border-white/25 hover:text-zinc-200"
                      >
                        Lewati
                      </button>
                    </div>
                    <div className="mt-1 flex h-4 items-center pl-1">
                      {state?.error ? (
                        <span className="text-[11px] text-red-400">
                          {state.error}
                        </span>
                      ) : state?.status === "saving" ? (
                        <span className="text-[11px] text-zinc-600">
                          Menyimpan...
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <datalist id="subject-presets">
          {chipCandidates.map((subject) => (
            <option key={subject} value={subject} />
          ))}
        </datalist>

        {presetsToShow.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] text-zinc-500">Tambah cepat</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {presetsToShow.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => addRow(subject)}
                  className="rounded-full border border-white/12 px-3 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
                >
                  + {subject}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => addRow("")}
          className="mt-3 h-10 w-full rounded-full border border-dashed border-white/15 text-[13px] text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
        >
          Tambah mata pelajaran
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12px] text-zinc-500">
          {totalPersisted > 0
            ? `${totalPersisted} nilai tersimpan`
            : "Belum ada nilai tersimpan"}
        </span>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {finishError && (
            <span className="text-[12px] text-red-400">{finishError}</span>
          )}
          {completed ? (
            <a
              href="/dashboard"
              className="flex h-10 items-center justify-center rounded-full bg-white px-5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
            >
              Kembali ke dashboard
            </a>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={totalPersisted === 0 || finishing}
              className="h-10 rounded-full bg-white px-5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {finishing ? "Menyimpan..." : "Selesai"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
