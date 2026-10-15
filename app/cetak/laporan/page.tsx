import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { analysisRecommendations, analysisResults, majors } from "@/db/schema";
import PrintToolbar from "@/components/cetak/PrintToolbar";
import { prepareAnalysisData } from "@/lib/analysis/prepare";
import { getAssessmentSummary } from "@/lib/assessment/summary";
import { getUserProfile } from "@/lib/onboarding";

export const instant = false;

export const metadata: Metadata = {
  title: "Laporan Lengkap: Terang.in",
  description:
    "Laporan asesmen, nilai rapor, dan hasil analisis untuk diunduh atau dicetak.",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });

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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-[13px] text-zinc-900">{value}</p>
    </div>
  );
}

function SectionHeading({ order, title }: { order: string; title: string }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
      Bagian {order}. {title}
    </h2>
  );
}

export default async function ReportPage() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    redirect("/login");
  }
  if (!profile.onboardingCompletedAt) {
    redirect("/onboarding");
  }
  if (!profile.assessmentCompletedAt) {
    redirect("/assessment");
  }
  if (!profile.gradesCompletedAt) {
    redirect("/nilai");
  }

  const [summary, data, resultRows] = await Promise.all([
    getAssessmentSummary(session.user.id),
    prepareAnalysisData(session.user.id),
    db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.userId, session.user.id))
      .limit(1),
  ]);

  const result = resultRows[0];
  if (!summary || !result) {
    redirect("/analisis");
  }

  const recommendationRows = await db
    .select({
      majorId: analysisRecommendations.majorId,
      matchPercentage: analysisRecommendations.matchPercentage,
      rankOrder: analysisRecommendations.rankOrder,
      reason: analysisRecommendations.reason,
      majorName: majors.name,
    })
    .from(analysisRecommendations)
    .innerJoin(majors, eq(analysisRecommendations.majorId, majors.id))
    .where(eq(analysisRecommendations.userId, session.user.id))
    .orderBy(asc(analysisRecommendations.rankOrder));

  const details = (result.details ?? {}) as {
    strengths?: string[];
    alignmentNote?: string;
  };

  const recommendations = recommendationRows.map((row) => ({
    majorId: row.majorId,
    majorName: row.majorName,
    matchPercentage: Number(row.matchPercentage),
    rankOrder: row.rankOrder,
    reason: row.reason ?? "",
    campuses: data.campusesByMajor.get(row.majorId) ?? [],
  }));

  const completedLabel = summary.completedAt
    ? dateFormatter.format(summary.completedAt)
    : "Belum tercatat";
  const analyzedLabel = dateFormatter.format(result.generatedAt);
  const printedLabel = dateFormatter.format(new Date());
  const strengths = details.strengths ?? [];

  return (
    <div className="print-exact min-h-dvh bg-white text-zinc-900">
      <PrintToolbar />
      <main className="mx-auto w-full max-w-[820px] px-6 py-10 print:max-w-none print:px-0 print:py-0">
        <header className="border-b-2 border-zinc-900 pb-5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[13px] font-semibold tracking-tight">
              Terang<span className="text-zinc-400">.in</span>
            </span>
            <span className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">
              Dokumen pribadi
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Laporan Lengkap: Asesmen, Nilai, dan Hasil Analisis
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
            Rangkuman perjalanan {summary.fullName} di Terang.in, dari jawaban
            asesmen, nilai rapor, sampai rekomendasi jurusan.
          </p>
        </header>

        <section className="mt-7 grid grid-cols-2 gap-x-10 gap-y-4">
          <Field label="Nama" value={summary.fullName} />
          <Field
            label="Sekolah"
            value={summary.schoolOrigin ?? "Belum diisi"}
          />
          <Field
            label="Kelas"
            value={
              summary.gradeLevel ? `Kelas ${summary.gradeLevel}` : "Belum diisi"
            }
          />
          <Field label="Tanggal asesmen" value={completedLabel} />
        </section>

        <section className="mt-9 break-inside-avoid">
          <SectionHeading order="A" title="Hasil Asesmen" />
          <p className="mt-3 text-[13px] leading-relaxed">
            Kamu menjawab {summary.answeredCount} dari {summary.totalQuestions}{" "}
            soal asesmen.
            {summary.lockedCount > 0
              ? ` ${summary.lockedCount} soal terlewat karena batas waktu dan tetap dihitung apa adanya.`
              : ""}
          </p>

          {summary.topStrengths.length > 0 && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                Tiga kekuatan teratas
              </p>
              <ol className="mt-3 space-y-2.5">
                {summary.topStrengths.map((strength, index) => (
                  <li
                    key={`${strength.category}-${strength.key}`}
                    className="flex items-center gap-3"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-zinc-900 text-[10px] font-medium text-white">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-[12px]">
                      <span className="font-medium">{strength.label}</span>
                      <span className="text-zinc-500">
                        {" "}
                        ({strength.categoryLabel.toLowerCase()})
                      </span>
                    </span>
                    <span className="text-[12px] font-medium tabular-nums">
                      {strength.score}
                      <span className="text-zinc-400">/100</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-5 space-y-6">
            {summary.categories.map((category) => (
              <div key={category.key} className="break-inside-avoid">
                <h3 className="text-[12px] font-semibold text-zinc-900">
                  {category.label}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                  {category.description}
                </p>
                <div className="mt-3 space-y-3">
                  {category.dimensions.map((dimension) => (
                    <div
                      key={dimension.key}
                      className="grid grid-cols-[150px_1fr_52px] items-center gap-4"
                    >
                      <span className="text-[12px] text-zinc-700">
                        {dimension.label}
                      </span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                        <span
                          className="block h-full rounded-full bg-zinc-800"
                          style={{
                            width: `${Math.max(2, Math.min(100, dimension.score))}%`,
                          }}
                        />
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-zinc-900">
                        {dimension.score}
                      </span>
                    </div>
                  ))}
                  {category.dimensions.length === 0 && (
                    <p className="text-[12px] text-zinc-400">
                      Belum ada data untuk kategori ini.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 break-inside-avoid">
          <SectionHeading order="B" title="Nilai Rapor" />
          <p className="mt-3 text-[13px] leading-relaxed">
            {data.academic.subjects.length} mata pelajaran dari{" "}
            {data.academic.semesterCount} semester, dirangkum sebagai rata-rata
            tiap mapel.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Mata pelajaran
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Rata-rata
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Semester
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.academic.subjects.map((subject) => (
                  <tr
                    key={subject.subject}
                    className="border-b border-zinc-100 last:border-b-0"
                  >
                    <td className="px-4 py-2.5 text-zinc-700">
                      {subject.subject}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-zinc-900">
                      {subject.average}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">
                      {subject.semesters.length}
                    </td>
                  </tr>
                ))}
                {data.academic.subjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-[12px] text-zinc-400"
                    >
                      Belum ada nilai yang tersimpan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">
            Rata-rata dihitung dari nilai yang kamu masukkan di tiap semester.
          </p>
        </section>

        <section className="mt-10 break-inside-avoid">
          <SectionHeading order="C" title="Hasil Analisis" />
          <p className="mt-3 text-[12px] text-zinc-500">
            Dianalisis pada {analyzedLabel}.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                Tipe kepribadian
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-zinc-900">
                {result.personalityType ?? "Belum diketahui"}
              </p>
            </div>
            {details.alignmentNote && (
              <div className="rounded-lg border border-zinc-200 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                  Catatan keselarasan
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
                  {details.alignmentNote}
                </p>
              </div>
            )}
          </div>

          {result.analysisSummary && (
            <div className="mt-5 break-inside-avoid">
              <h3 className="text-[12px] font-semibold text-zinc-900">
                Ringkasan potensimu
              </h3>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
                {result.analysisSummary}
              </p>
            </div>
          )}

          {strengths.length > 0 && (
            <div className="mt-5 break-inside-avoid">
              <h3 className="text-[12px] font-semibold text-zinc-900">
                Kekuatanmu
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[12px] leading-relaxed text-zinc-600">
                {strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-[12px] font-semibold text-zinc-900">
              Rekomendasi jurusan
            </h3>
            <div className="mt-3 space-y-4">
              {recommendations.map((item) => (
                <div
                  key={item.majorId}
                  className="break-inside-avoid rounded-lg border border-zinc-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-zinc-900 text-[10px] font-medium text-white">
                      {item.rankOrder}
                    </span>
                    <span className="flex-1 text-[13px] font-medium text-zinc-900">
                      {item.majorName}
                    </span>
                    <span className="text-[12px] font-medium tabular-nums text-zinc-900">
                      {Math.round(item.matchPercentage)}%
                      <span className="text-zinc-400"> cocok</span>
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                    <span
                      className="block h-full rounded-full bg-zinc-800"
                      style={{
                        width: `${Math.max(2, Math.min(100, Math.round(item.matchPercentage)))}%`,
                      }}
                    />
                  </div>
                  {item.reason && (
                    <p className="mt-2.5 text-[12px] leading-relaxed text-zinc-600">
                      {item.reason}
                    </p>
                  )}
                  {item.campuses.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      {item.campuses.map((campus) => {
                        const tuition = formatTuition(campus.estimatedTuition);
                        return (
                          <p
                            key={`${item.majorId}-${campus.universityName}`}
                            className="text-[11px] text-zinc-500"
                          >
                            {campus.universityName}
                            {campus.location ? `, ${campus.location}` : ""}
                            {campus.type ? ` (${campus.type})` : ""}
                            {campus.capacity
                              ? `, daya tampung sekitar ${campus.capacity}`
                              : ""}
                            {tuition ? `, UKT ${tuition}` : ""}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              {recommendations.length === 0 && (
                <p className="text-[12px] text-zinc-400">
                  Belum ada rekomendasi tersimpan.
                </p>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-zinc-400">
              Match, daya tampung, dan UKT adalah perkiraan untuk gambaran
              awal. Cek angka resmi di situs kampus tujuanmu ya.
            </p>
          </div>
        </section>

        <footer className="mt-10 break-inside-avoid border-t border-zinc-200 pt-4 text-[11px] leading-relaxed text-zinc-500">
          <p>
            Skala 0 sampai 100 menunjukkan kekuatan relatif antar dimensi
            berdasarkan jawabanmu, bukan nilai kelulusan atau penentu tunggal
            jurusan.
          </p>
          <p className="mt-1.5">
            Laporan ini panduan awal untuk kamu dan orang tuamu. Keputusan
            akhir tetap milikmu.
          </p>
          <p className="mt-3 text-zinc-400">
            Dibuat dengan Terang.in pada {printedLabel}.
          </p>
        </footer>
      </main>
    </div>
  );
}
