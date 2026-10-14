import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { analysisRecommendations, analysisResults, majors } from "@/db/schema";
import AppShell from "@/components/app/AppShell";
import AnalysisPanel, {
  type AnalysisStats,
  type SavedAnalysisView,
} from "@/components/analysis/AnalysisPanel";
import { prepareAnalysisData } from "@/lib/analysis/prepare";
import { getJourneySteps, getUserProfile } from "@/lib/onboarding";

export const instant = false;

export const metadata: Metadata = {
  title: "Hasil Analisis: Terang.in",
  description: "Analisis minat, bakat, dan nilai rapormu bersama Tera.",
};

const CATEGORY_LABELS: Record<string, string> = {
  MINAT: "Minat",
  BAKAT: "Bakat",
  KEPRIBADIAN: "Kepribadian",
  GAYA_BELAJAR: "Gaya Belajar",
};

export default async function AnalysisPage() {
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

  const [steps, data, resultRows] = await Promise.all([
    getJourneySteps(session.user.id),
    prepareAnalysisData(session.user.id),
    db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.userId, session.user.id))
      .limit(1),
  ]);

  let saved: SavedAnalysisView | null = null;
  const result = resultRows[0];
  if (result) {
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

    saved = {
      personalityType: result.personalityType ?? "Belum diketahui",
      summary: result.analysisSummary ?? "",
      strengths: details.strengths ?? [],
      alignmentNote: details.alignmentNote ?? "",
      generatedAt: result.generatedAt.toISOString(),
      recommendations: recommendationRows.map((row) => ({
        majorId: row.majorId,
        majorName: row.majorName,
        matchPercentage: Number(row.matchPercentage),
        rankOrder: row.rankOrder,
        reason: row.reason ?? "",
        campuses: data.campusesByMajor.get(row.majorId) ?? [],
      })),
    };
  }

  const stats: AnalysisStats = {
    answeredCount: data.assessment.answeredCount,
    subjectCount: data.academic.subjects.length,
    semesterCount: data.academic.semesterCount,
    interests: data.profile.initialInterests,
    categoryAverages: Object.entries(data.assessment.categoryAverages).map(
      ([category, average]) => ({
        label: CATEGORY_LABELS[category] ?? category,
        average,
      }),
    ),
    topSubjects: data.academic.subjects
      .slice(0, 4)
      .map((item) => ({ subject: item.subject, average: item.average })),
  };

  return (
    <AppShell user={{ name: profile.fullName }} steps={steps}>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Hasil Analisis
      </h1>
      <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-zinc-400">
        Terang.in membaca ulang minat, bakat, kepribadian, gaya belajar, dan
        nilai rapormu, lalu merangkumnya jadi rekomendasi jurusan.
      </p>

      <div className="mt-8">
        <AnalysisPanel
          key={saved ? saved.generatedAt : "empty"}
          saved={saved}
          stats={stats}
        />
      </div>
    </AppShell>
  );
}
