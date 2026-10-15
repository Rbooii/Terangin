import type { AnalysisData } from "./prepare";
import type { ScoredMajor } from "./score";

const CATEGORY_LABELS: Record<string, string> = {
  MINAT: "Minat",
  BAKAT: "Bakat (kemampuan dasar)",
  KEPRIBADIAN: "Kepribadian",
  GAYA_BELAJAR: "Gaya belajar",
};

export function buildSystemPrompt(): string {
  return [
    "Kamu adalah Tera, konselor jurusan kuliah untuk siswa SMA di Indonesia yang hangat, jujur, dan tidak menghakimi.",
    "",
    "KONTEKS PENTING:",
    "Skor kecocokan jurusan sudah dihitung oleh sistem Terang.in dari data siswa dengan bobot tetap: Minat 30 persen, Bakat 25 persen, Nilai rapor 20 persen, Kepribadian 15 persen, Gaya belajar 10 persen. Skor dan urutan itu final, jangan diubah dan jangan mengarang skor baru.",
    "",
    "TUGASMU:",
    "1. Tulis narasi dan alasan berdasarkan skor yang diberikan. Semua klaim wajib merujuk angka skor atau data siswa yang tersedia.",
    "2. Untuk tiap jurusan di daftar peringkat, tulis reason 2 sampai 3 kalimat yang menyebut sub-skor faktornya, misalnya skor minat, bakat, atau nilai mata pelajaran, lalu kaitkan dengan profil siswa.",
    "3. Jangan mengarang fakta, jurusan, atau angka di luar data yang diberikan.",
    "4. Validasi silang: bandingkan minat awal yang dipilih siswa saat onboarding dengan pola jawaban asesmen. Kalau selaras, tegaskan. Kalau ada perbedaan, sampaikan sebagai temuan yang menarik, bukan kesalahan.",
    "5. Bahasa Indonesia yang jelas dan santai tapi kredibel. Tanpa emoji, tanpa klise motivasi berlebihan, tanpa istilah psikologi rumit, tanpa em dash.",
    "6. personalityType diisi tipe ringkas berbasis pola RIASEC, contoh: Investigatif-Analitis. Maksimal 50 karakter.",
    "7. analysisSummary berisi 2 sampai 3 paragraf pendek (total di bawah 200 kata) yang merangkum potensi siswa.",
    "8. strengths berisi 3 sampai 5 kekuatan spesifik yang terlihat dari data.",
    "9. alignmentNote berisi 1 sampai 2 kalimat tentang keselarasan minat awal dengan hasil asesmen.",
  ].join("\n");
}

export function buildUserPrompt(data: AnalysisData, ranked: ScoredMajor[]): string {
  const { profile, assessment, academic } = data;

  const categoryLines = Object.entries(assessment.categoryAverages)
    .map(([category, average]) => {
      const label = CATEGORY_LABELS[category] ?? category;
      return `- ${label}: ${
        average === null ? "tidak ada data" : `${average} dari skala 5`
      }`;
    })
    .join("\n");

  const dimensionLines =
    Object.entries(assessment.dimensionScores)
      .map(([dimension, score]) => `- ${dimension}: ${score ?? "tidak ada data"}`)
      .join("\n") || "- tidak ada data";

  const subjectLines =
    academic.subjects.length > 0
      ? academic.subjects
          .map(
            (item) =>
              `- ${item.subject}: rata-rata ${item.average} (${item.semesters.length} semester)`,
          )
          .join("\n")
      : "- belum ada nilai rapor";

  const topAnswerLines =
    assessment.topAnswers.length > 0
      ? assessment.topAnswers
          .map((item) => `- "${item.text}" (skor ${item.score})`)
          .join("\n")
      : "- tidak ada data";
  const lowAnswerLines =
    assessment.lowAnswers.length > 0
      ? assessment.lowAnswers
          .map((item) => `- "${item.text}" (skor ${item.score})`)
          .join("\n")
      : "- tidak ada data";

  const rankedLines = ranked
    .map((item, index) => {
      const factors = item.factors;
      const parts = [
        `minat ${factors.minat ?? "-"}`,
        `bakat ${factors.bakat ?? "-"}`,
        `nilai ${factors.nilai ?? "-"}`,
        `kepribadian ${factors.kepribadian ?? "-"}`,
        `gaya belajar ${factors.gayaBelajar ?? "-"}`,
      ].join(", ");
      return `- Rank ${index + 1}: id: ${item.majorId} | ${item.name} | kecocokan ${factors.match} persen | total ${factors.total} | sub-skor: ${parts}`;
    })
    .join("\n");

  return [
    "Berikut data siswa dan hasil skoring sistem yang perlu kamu narasikan.",
    "",
    "PROFIL DASAR:",
    `- Nama panggilan: ${profile.fullName.split(" ")[0]}`,
    `- Kelas: ${profile.gradeLevel ?? "tidak diketahui"}`,
    `- Sekolah: ${profile.schoolOrigin ?? "tidak diketahui"}`,
    `- Minat awal saat onboarding: ${
      profile.initialInterests.length > 0
        ? profile.initialInterests.join(", ")
        : "tidak diisi"
    }`,
    "",
    `ASESMEN MINAT & BAKAT (${assessment.answeredCount} soal terjawab, ${assessment.skippedCount} soal terlewat karena waktu):`,
    categoryLines,
    "",
    "Skor dimensi asesmen (skala 0 sampai 100):",
    dimensionLines,
    "",
    "Pernyataan dengan skor tertinggi:",
    topAnswerLines,
    "",
    "Pernyataan dengan skor terendah:",
    lowAnswerLines,
    "",
    `NILAI RAPOR (${academic.semesterCount} semester terisi):`,
    subjectLines,
    "",
    "HASIL SKORING SISTEM (deterministik, jangan diubah):",
    rankedLines,
    "",
    "Tulis narasi dan satu reason untuk tiap jurusan pada daftar peringkat di atas.",
  ].join("\n");
}
