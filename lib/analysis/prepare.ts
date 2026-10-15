import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { computeDimensionScores } from "@/lib/assessment/summary";
import {
  academicRecords,
  majors,
  questions,
  universities,
  universityMajors,
  userAssessmentAnswers,
  users,
} from "@/db/schema";

export type CategoryName = "MINAT" | "BAKAT" | "KEPRIBADIAN" | "GAYA_BELAJAR";

export type CampusInfo = {
  universityName: string;
  type: string;
  location: string | null;
  capacity: number | null;
  estimatedTuition: string | null;
};

export type AnalysisData = Awaited<ReturnType<typeof prepareAnalysisData>>;

export async function prepareAnalysisData(userId: string) {
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Profil user tidak ditemukan.");
  }

  const answerRows = await db
    .select({
      category: questions.category,
      questionText: questions.questionText,
      score: userAssessmentAnswers.score,
      dimension: questions.dimension,
    })
    .from(userAssessmentAnswers)
    .innerJoin(questions, eq(userAssessmentAnswers.questionId, questions.id))
    .where(eq(userAssessmentAnswers.userId, userId));

  const answered = answerRows.filter((row) => row.score > 0);
  const categoryValues: Record<CategoryName, number[]> = {
    MINAT: [],
    BAKAT: [],
    KEPRIBADIAN: [],
    GAYA_BELAJAR: [],
  };
  for (const row of answered) {
    categoryValues[row.category].push(row.score);
  }

  const categoryAverages = Object.fromEntries(
    (Object.keys(categoryValues) as CategoryName[]).map((category) => {
      const values = categoryValues[category];
      const average =
        values.length > 0
          ? Number(
              (
                values.reduce((sum, value) => sum + value, 0) / values.length
              ).toFixed(2),
            )
          : null;
      return [category, average];
    }),
  ) as Record<CategoryName, number | null>;

  const dimensionScores = computeDimensionScores(answered);

  const sortedAnswers = [...answered].sort((a, b) => b.score - a.score);
  const topAnswers = sortedAnswers
    .slice(0, 4)
    .map((row) => ({ text: row.questionText, score: row.score }));
  const lowAnswers = sortedAnswers
    .slice(-3)
    .reverse()
    .map((row) => ({ text: row.questionText, score: row.score }));

  const gradeRows = await db
    .select({
      subject: academicRecords.subject,
      semester: academicRecords.semester,
      score: academicRecords.score,
    })
    .from(academicRecords)
    .where(eq(academicRecords.userId, userId))
    .orderBy(asc(academicRecords.subject));

  const gradeBySubject = new Map<
    string,
    { total: number; count: number; semesters: number[] }
  >();
  for (const row of gradeRows) {
    const entry = gradeBySubject.get(row.subject) ?? {
      total: 0,
      count: 0,
      semesters: [],
    };
    entry.total += Number(row.score);
    entry.count += 1;
    entry.semesters.push(row.semester);
    gradeBySubject.set(row.subject, entry);
  }

  const subjects = Array.from(gradeBySubject.entries())
    .map(([subject, entry]) => ({
      subject,
      average: Number((entry.total / entry.count).toFixed(1)),
      semesters: entry.semesters.sort((a, b) => a - b),
    }))
    .sort((a, b) => b.average - a.average);

  const majorRows = await db
    .select({
      id: majors.id,
      name: majors.name,
      description: majors.description,
      careerProspects: majors.careerProspects,
      profile: majors.profile,
    })
    .from(majors)
    .orderBy(asc(majors.name));

  const campusRows = await db
    .select({
      majorId: universityMajors.majorId,
      universityName: universities.name,
      type: universities.type,
      location: universities.location,
      capacity: universityMajors.capacity,
      estimatedTuition: universityMajors.estimatedTuition,
    })
    .from(universityMajors)
    .innerJoin(universities, eq(universityMajors.universityId, universities.id))
    .orderBy(asc(universities.name));

  const campusesByMajor = new Map<string, CampusInfo[]>();
  for (const row of campusRows) {
    const list = campusesByMajor.get(row.majorId) ?? [];
    list.push({
      universityName: row.universityName,
      type: row.type,
      location: row.location,
      capacity: row.capacity,
      estimatedTuition: row.estimatedTuition,
    });
    campusesByMajor.set(row.majorId, list);
  }

  return {
    profile: {
      fullName: profile.fullName,
      gradeLevel: profile.gradeLevel,
      schoolOrigin: profile.schoolOrigin,
      initialInterests: profile.initialInterests ?? [],
    },
    assessment: {
      answeredCount: answered.length,
      skippedCount: answerRows.length - answered.length,
      categoryAverages,
      dimensionScores,
      topAnswers,
      lowAnswers,
    },
    academic: {
      subjects,
      semesterCount: new Set(gradeRows.map((row) => row.semester)).size,
    },
    majors: majorRows,
    campusesByMajor,
  };
}
