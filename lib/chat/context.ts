import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analysisRecommendations, analysisResults, majors } from "@/db/schema";
import { prepareAnalysisData } from "@/lib/analysis/prepare";

const CATEGORY_LABELS: Record<string, string> = {
  MINAT: "Minat",
  BAKAT: "Bakat",
  KEPRIBADIAN: "Kepribadian",
  GAYA_BELAJAR: "Gaya belajar",
};

function formatTuition(value: string | null) {
  if (!value) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  const millions = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(amount / 1_000_000);
  return `sekitar Rp ${millions}jt per semester`;
}

export async function getUserChatContext(userId: string): Promise<string> {
  const data = await prepareAnalysisData(userId);

  const [resultRows, recommendationRows] = await Promise.all([
    db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.userId, userId))
      .limit(1),
    db
      .select({
        majorName: majors.name,
        matchPercentage: analysisRecommendations.matchPercentage,
        rankOrder: analysisRecommendations.rankOrder,
        reason: analysisRecommendations.reason,
      })
      .from(analysisRecommendations)
      .innerJoin(majors, eq(analysisRecommendations.majorId, majors.id))
      .where(eq(analysisRecommendations.userId, userId))
      .orderBy(asc(analysisRecommendations.rankOrder)),
  ]);

  const sections: string[] = [];

  sections.push(
    [
      "PROFIL SISWA:",
      `- Nama panggilan: ${data.profile.fullName.split(" ")[0]}`,
      `- Kelas: ${data.profile.gradeLevel ?? "tidak diketahui"}`,
      `- Sekolah: ${data.profile.schoolOrigin ?? "tidak diketahui"}`,
      `- Minat awal saat onboarding: ${
        data.profile.initialInterests.length > 0
          ? data.profile.initialInterests.join(", ")
          : "tidak diisi"
      }`,
    ].join("\n"),
  );

  const categoryLines = Object.entries(data.assessment.categoryAverages)
    .map(([category, average]) => {
      const label = CATEGORY_LABELS[category] ?? category;
      return `- ${label}: ${
        average === null ? "tidak ada data" : `${average} dari 5`
      }`;
    })
    .join("\n");
  sections.push(
    [
      `HASIL ASESMEN (${data.assessment.answeredCount} soal terjawab):`,
      categoryLines,
      data.assessment.topAnswers.length > 0
        ? `- Kecenderungan terkuat: ${data.assessment.topAnswers
            .slice(0, 3)
            .map((item) => item.text)
            .join("; ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  if (data.academic.subjects.length > 0) {
    sections.push(
      [
        "NILAI RAPOR (rata-rata per mapel):",
        data.academic.subjects
          .slice(0, 8)
          .map((item) => `- ${item.subject}: ${item.average}`)
          .join("\n"),
      ].join("\n"),
    );
  }

  const result = resultRows[0];
  if (result) {
    const details = (result.details ?? {}) as {
      strengths?: string[];
      alignmentNote?: string;
    };
    const recommendationLines = recommendationRows
      .map(
        (item) =>
          `- Rank ${item.rankOrder}: ${item.majorName} (kecocokan ${Number(
            item.matchPercentage,
          ).toFixed(0)}%). Alasan: ${item.reason ?? "-"}`,
      )
      .join("\n");
    sections.push(
      [
        "HASIL ANALISIS TERANG.IN:",
        `- Tipe kepribadian dominan: ${result.personalityType ?? "-"}`,
        details.alignmentNote ? `- Catatan minat: ${details.alignmentNote}` : "",
        details.strengths && details.strengths.length > 0
          ? `- Kekuatan: ${details.strengths.join("; ")}`
          : "",
        "- Rekomendasi jurusan:",
        recommendationLines,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const campusLines = data.majors
    .map((major) => {
      const campuses = data.campusesByMajor.get(major.id) ?? [];
      if (campuses.length === 0) return null;
      const campusText = campuses
        .map((campus) => {
          const parts = [campus.universityName];
          if (campus.location) parts.push(campus.location);
          if (campus.type) parts.push(campus.type);
          if (campus.capacity) parts.push(`daya tampung sekitar ${campus.capacity}`);
          const tuition = formatTuition(campus.estimatedTuition);
          if (tuition) parts.push(`UKT ${tuition}`);
          return `${parts[0]} (${parts.slice(1).join(", ")})`;
        })
        .join("; ");
      return `- ${major.name}: ${campusText}`;
    })
    .filter(Boolean)
    .join("\n");

  sections.push(
    [
      "KATALOG KAMPUS DAN JURUSAN (data internal Terang.in, angka UKT dan daya tampung adalah perkiraan):",
      campusLines,
    ].join("\n"),
  );

  return sections.join("\n\n");
}
