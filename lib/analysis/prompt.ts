import type { AnalysisData } from "./prepare";

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
    "PRINSIP ANALISIS:",
    "1. Tugasmu membantu siswa memahami dirinya sendiri, bukan menentukan pilihan mereka.",
    "2. Semua klaim wajib merujuk data yang diberikan. Jangan mengarang fakta atau jurusan di luar daftar kandidat.",
    "3. Validasi silang: bandingkan minat awal yang dipilih siswa saat onboarding dengan pola jawaban asesmen. Kalau selaras, tegaskan. Kalau ada perbedaan, sampaikan sebagai temuan yang menarik, bukan kesalahan.",
    "4. Pertimbangkan realisme akademik: nilai mata pelajaran pendukung jurusan jadi bahan pertimbangan kecocokan.",
    "5. matchPercentage harus bervariasi dan realistis, jangan semua di atas 85. Rekomendasi teratas mencerminkan gabungan minat dan kemampuan, bukan cuma salah satunya.",
    "6. Gaya belajar dan kepribadian ikut dipertimbangkan, misalnya jurusan dengan praktik lapangan vs analisis teoritis.",
    "7. Bahasa Indonesia yang jelas dan santai tapi kredibel. Tanpa emoji, tanpa klise motivasi berlebihan, tanpa istilah psikologi rumit.",
    "8. reason berisi 2 sampai 3 kalimat dan wajib menyebut data spesifik, misalnya skor kategori, nama mata pelajaran, atau minat awal.",
    "9. personalityType diisi tipe ringkas berbasis pola RIASEC, contoh: Investigatif-Analitis. Maksimal 50 karakter.",
    "10. analysisSummary berisi 2 sampai 3 paragraf pendek (total di bawah 200 kata) yang merangkum potensi siswa.",
    "11. strengths berisi 3 sampai 5 kekuatan spesifik yang terlihat dari data.",
    "12. recommendations berisi 3 sampai 5 jurusan dari daftar kandidat, diurutkan dari yang paling cocok. rankOrder dimulai dari 1.",
    "13. alignmentNote berisi 1 sampai 2 kalimat tentang keselarasan minat awal dengan hasil asesmen.",
  ].join("\n");
}

export function buildUserPrompt(data: AnalysisData): string {
  const { profile, assessment, academic, majors } = data;

  const categoryLines = Object.entries(assessment.categoryAverages)
    .map(([category, average]) => {
      const label = CATEGORY_LABELS[category] ?? category;
      return `- ${label}: ${
        average === null
          ? "tidak ada data"
          : `${average} dari skala 5 (0 soal terkunci)`
      }`;
    })
    .join("\n");

  const subjectLines =
    academic.subjects.length > 0
      ? academic.subjects
          .map(
            (item) =>
              `- ${item.subject}: rata-rata ${item.average} (${item.semesters.length} semester)`,
          )
          .join("\n")
      : "- belum ada nilai rapor";

  const majorLines = majors
    .map(
      (major) =>
        `- id: ${major.id} | ${major.name} | ${
          (major.description ?? "").slice(0, 140)
        }`,
    )
    .join("\n");

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

  return [
    "Berikut data siswa yang perlu dianalisis.",
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
    "Pernyataan dengan skor tertinggi:",
    topAnswerLines,
    "",
    "Pernyataan dengan skor terendah:",
    lowAnswerLines,
    "",
    `NILAI RAPOR (${academic.semesterCount} semester terisi):`,
    subjectLines,
    "",
    "DAFTAR JURUSAN KANDIDAT (pilih rekomendasi hanya dari daftar ini, gunakan id-nya):",
    majorLines,
    "",
    "Susun analisis sesuai schema yang diminta.",
  ].join("\n");
}
