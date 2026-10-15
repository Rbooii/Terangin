import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { questions, userAssessmentAnswers, users } from "@/db/schema";

export type CategoryKey = "MINAT" | "BAKAT" | "KEPRIBADIAN" | "GAYA_BELAJAR";

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  MINAT: "Minat",
  BAKAT: "Bakat",
  KEPRIBADIAN: "Kepribadian",
  GAYA_BELAJAR: "Gaya belajar",
};

export const CATEGORY_DESCRIPTIONS: Record<CategoryKey, string> = {
  MINAT: "Pola minat berdasarkan enam kelompok RIASEC.",
  BAKAT: "Kemampuan dasar yang paling menonjol saat kamu belajar hal baru.",
  KEPRIBADIAN: "Cara kamu mengambil keputusan, bekerja, dan menghadapi tantangan.",
  GAYA_BELAJAR: "Cara kamu paling cepat memahami dan mengingat materi.",
};

export const DIMENSION_LABELS: Record<string, string> = {
  I: "Investigatif",
  A: "Artistik",
  S: "Sosial",
  E: "Enterprising",
  C: "Konvensional",
  R: "Realistis",
  numerik: "Numerik",
  verbal: "Verbal",
  spasial: "Spasial",
  mekanikal: "Mekanikal",
  data: "Analisis data",
  memori: "Daya ingat",
  sosial: "Sosial",
  terencana: "Terencana",
  pemberani: "Pemberani",
  tangguh: "Tangguh",
  kolaboratif: "Kolaboratif",
  rasional: "Rasional",
  visual: "Visual",
  auditori: "Auditori",
  praktik: "Praktik",
  latihan: "Latihan",
  mandiri: "Mandiri",
  diskusi: "Diskusi",
};

export type DimensionScore = {
  key: string;
  label: string;
  category: CategoryKey;
  categoryLabel: string;
  score: number;
  answeredCount: number;
};

export type CategoryBreakdown = {
  key: CategoryKey;
  label: string;
  description: string;
  dimensions: DimensionScore[];
};

export type AssessmentSummary = {
  fullName: string;
  schoolOrigin: string | null;
  gradeLevel: number | null;
  completedAt: Date | null;
  answeredCount: number;
  lockedCount: number;
  unansweredCount: number;
  totalQuestions: number;
  categories: CategoryBreakdown[];
  topStrengths: DimensionScore[];
};

export function computeDimensionScores(
  rows: Array<{ dimension: string | null; score: number }>,
): Record<string, number | null> {
  const values = new Map<string, number[]>();
  for (const row of rows) {
    if (!row.dimension || row.score <= 0) {
      continue;
    }
    const list = values.get(row.dimension) ?? [];
    list.push(row.score);
    values.set(row.dimension, list);
  }

  const scores: Record<string, number | null> = {};
  for (const [dimension, list] of values) {
    const average = list.reduce((sum, value) => sum + value, 0) / list.length;
    scores[dimension] = Number((((average - 1) / 4) * 100).toFixed(1));
  }
  return scores;
}

export async function getAssessmentSummary(
  userId: string,
): Promise<AssessmentSummary | null> {
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!profile) {
    return null;
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions);
  const totalQuestions = countRow?.count ?? 0;

  const rows = await db
    .select({
      category: questions.category,
      dimension: questions.dimension,
      score: userAssessmentAnswers.score,
    })
    .from(userAssessmentAnswers)
    .innerJoin(questions, eq(userAssessmentAnswers.questionId, questions.id))
    .where(eq(userAssessmentAnswers.userId, userId))
    .orderBy(asc(questions.orderIndex));

  const answeredRows = rows.filter((row) => row.score > 0);
  const lockedCount = rows.length - answeredRows.length;
  const unansweredCount = Math.max(0, totalQuestions - rows.length);

  const dimensionScores = computeDimensionScores(answeredRows);

  const countsByDimension = new Map<string, number>();
  const categoryByDimension = new Map<string, CategoryKey>();
  for (const row of answeredRows) {
    if (!row.dimension) {
      continue;
    }
    countsByDimension.set(
      row.dimension,
      (countsByDimension.get(row.dimension) ?? 0) + 1,
    );
    if (!categoryByDimension.has(row.dimension)) {
      categoryByDimension.set(row.dimension, row.category);
    }
  }

  const categories = (Object.keys(CATEGORY_LABELS) as CategoryKey[]).map(
    (category) => {
      const dimensions = Array.from(countsByDimension.keys())
        .filter((key) => categoryByDimension.get(key) === category)
        .map((key) => ({
          key,
          label: DIMENSION_LABELS[key] ?? key,
          category,
          categoryLabel: CATEGORY_LABELS[category],
          score: Math.round(dimensionScores[key] ?? 0),
          answeredCount: countsByDimension.get(key) ?? 0,
        }))
        .sort((a, b) => b.score - a.score);

      return {
        key: category,
        label: CATEGORY_LABELS[category],
        description: CATEGORY_DESCRIPTIONS[category],
        dimensions,
      };
    },
  );

  const topStrengths = categories
    .flatMap((category) => category.dimensions)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    fullName: profile.fullName,
    schoolOrigin: profile.schoolOrigin,
    gradeLevel: profile.gradeLevel,
    completedAt: profile.assessmentCompletedAt,
    answeredCount: answeredRows.length,
    lockedCount,
    unansweredCount,
    totalQuestions,
    categories,
    topStrengths,
  };
}
