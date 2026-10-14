import { eq } from "drizzle-orm";
import { db } from "@/db";
import { analysisResults, users } from "@/db/schema";

export type JourneyStep = {
  n: number;
  title: string;
  status: string;
  state: "done" | "active" | "todo";
};

export async function getUserProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return profile ?? null;
}

export async function getJourneySteps(userId: string): Promise<JourneyStep[]> {
  const [profile, results] = await Promise.all([
    getUserProfile(userId),
    db
      .select({ id: analysisResults.id })
      .from(analysisResults)
      .where(eq(analysisResults.userId, userId))
      .limit(1),
  ]);

  const done = [
    profile?.onboardingCompletedAt != null,
    profile?.assessmentCompletedAt != null,
    profile?.gradesCompletedAt != null,
    results.length > 0,
  ];
  const titles = [
    "Onboarding",
    "Assessment Bakat",
    "Input Nilai",
    "Hasil Analisis",
  ];
  const activeIndex = done.findIndex((value) => !value);

  return titles.map((title, i) => ({
    n: i + 1,
    title,
    status: done[i] ? "Done" : "Not yet Completed",
    state: done[i] ? "done" : i === activeIndex ? "active" : "todo",
  }));
}
