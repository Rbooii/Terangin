import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  analysisRecommendations,
  analysisResults,
  majors,
  universities,
  universityMajors,
} from "@/db/schema";
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
  return `Rp ${millions}jt/semester`;
}

const CATALOG_CAMPUSES_PER_MAJOR = 4;

const NAME_PREFIXES = [
  "universitas ",
  "national university of ",
  "university of ",
  "uin ",
  "upn ",
  "isi ",
  "institut ",
  "politeknik ",
];

type DirectoryRow = {
  id: string;
  name: string;
  type: string;
  location: string | null;
};

function findMentionedUniversities(
  rows: DirectoryRow[],
  text: string,
): DirectoryRow[] {
  const haystack = text.toLowerCase();
  const matches: DirectoryRow[] = [];
  for (const row of rows) {
    const full = row.name.toLowerCase();
    let short = full;
    for (const prefix of NAME_PREFIXES) {
      if (short.startsWith(prefix)) {
        short = short.slice(prefix.length);
        break;
      }
    }
    const tokens = [full, ...short.split(",").map((part) => part.trim())];
    if (tokens.some((token) => token.length >= 5 && haystack.includes(token))) {
      matches.push(row);
    }
  }
  return matches.slice(0, 3);
}

type FactorBreakdown = {
  minat?: number | null;
  bakat?: number | null;
  nilai?: number | null;
  kepribadian?: number | null;
  gayaBelajar?: number | null;
  total?: number | null;
  match?: number | null;
};

export async function getUserChatContext(
  userId: string,
  focusText?: string,
): Promise<string> {
  const data = await prepareAnalysisData(userId);

  const [resultRows, recommendationRows, directoryRows] = await Promise.all([
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
        factors: analysisRecommendations.factors,
      })
      .from(analysisRecommendations)
      .innerJoin(majors, eq(analysisRecommendations.majorId, majors.id))
      .where(eq(analysisRecommendations.userId, userId))
      .orderBy(asc(analysisRecommendations.rankOrder)),
    db
      .select({
        id: universities.id,
        name: universities.name,
        type: universities.type,
        location: universities.location,
      })
      .from(universities)
      .orderBy(asc(universities.type), asc(universities.name)),
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
      .map((item) => {
        const factors = (item.factors ?? null) as FactorBreakdown | null;
        const factorText = factors
          ? ` Sub-skor: minat ${factors.minat ?? "-"}, bakat ${factors.bakat ?? "-"}, nilai ${factors.nilai ?? "-"}, kepribadian ${factors.kepribadian ?? "-"}, gaya belajar ${factors.gayaBelajar ?? "-"}.`
          : "";
        return `- Rank ${item.rankOrder}: ${item.majorName} (kecocokan ${Number(
          item.matchPercentage,
        ).toFixed(0)}%).${factorText} Alasan: ${item.reason ?? "-"}`;
      })
      .join("\n");
    sections.push(
      [
        "HASIL ANALISIS TERANG.IN:",
        `- Tipe kepribadian dominan: ${result.personalityType ?? "-"}`,
        details.alignmentNote ? `- Catatan minat: ${details.alignmentNote}` : "",
        details.strengths && details.strengths.length > 0
          ? `- Kekuatan: ${details.strengths.join("; ")}`
          : "",
        "- Skor kecocokan dihitung sistem dengan bobot tetap: Minat 30 persen, Bakat 25 persen, Nilai rapor 20 persen, Kepribadian 15 persen, Gaya belajar 10 persen.",
        "- Rekomendasi jurusan:",
        recommendationLines,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const campusLines = data.majors
    .map((major) => {
      const campuses = (data.campusesByMajor.get(major.id) ?? []).slice(
        0,
        CATALOG_CAMPUSES_PER_MAJOR,
      );
      if (campuses.length === 0) return null;
      const campusText = campuses
        .map((campus) => {
          const meta = [campus.location, campus.type].filter(Boolean).join(", ");
          const name = meta
            ? `${campus.universityName} (${meta})`
            : campus.universityName;
          const details: string[] = [];
          if (campus.capacity)
            details.push(`daya tampung ${campus.capacity}`);
          const tuition = formatTuition(campus.estimatedTuition);
          if (tuition) details.push(`UKT ${tuition}`);
          const detailText = details.length > 0 ? `: ${details.join(", ")}` : "";
          return `  - ${name}${detailText}`;
        })
        .join("\n");
      return `- ${major.name}:\n${campusText}`;
    })
    .filter(Boolean)
    .join("\n");

  sections.push(
    [
      "KATALOG KAMPUS DAN JURUSAN (data internal Terang.in, angka daya tampung dan UKT adalah perkiraan):",
      campusLines,
    ].join("\n"),
  );

  if (focusText) {
    const mentioned = findMentionedUniversities(directoryRows, focusText);
    if (mentioned.length > 0) {
      const relationRows = await db
        .select({
          universityId: universityMajors.universityId,
          majorName: majors.name,
          capacity: universityMajors.capacity,
          estimatedTuition: universityMajors.estimatedTuition,
        })
        .from(universityMajors)
        .innerJoin(majors, eq(universityMajors.majorId, majors.id))
        .where(
          inArray(
            universityMajors.universityId,
            mentioned.map((row) => row.id),
          ),
        );

      const relationsByUniversity = new Map<string, typeof relationRows>();
      for (const row of relationRows) {
        const list = relationsByUniversity.get(row.universityId) ?? [];
        list.push(row);
        relationsByUniversity.set(row.universityId, list);
      }

      const focusLines = mentioned
        .map((university) => {
          const meta = [university.location, university.type]
            .filter(Boolean)
            .join(", ");
          const relations = relationsByUniversity.get(university.id) ?? [];
          const relationText = relations
            .slice(0, 6)
            .map((relation) => {
              const details: string[] = [];
              if (relation.capacity)
                details.push(`daya tampung ${relation.capacity}`);
              const tuition = formatTuition(relation.estimatedTuition);
              if (tuition) details.push(`UKT ${tuition}`);
              return `${relation.majorName}${details.length > 0 ? ` (${details.join(", ")})` : ""}`;
            })
            .join("; ");
          return `- ${university.name}${meta ? ` (${meta})` : ""}${relationText ? `. Jurusan terkait: ${relationText}.` : "."}`;
        })
        .join("\n");

      sections.push(
        [
          "KAMPUS YANG DISEBUT USER (dari database Terang.in):",
          focusLines,
        ].join("\n"),
      );
    }
  }

  return sections.join("\n\n");
}
