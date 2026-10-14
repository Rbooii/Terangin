"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { generateText, Output } from "ai";
import { groq } from "@ai-sdk/groq";
import { auth } from "@/auth";
import { db } from "@/db";
import { analysisRecommendations, analysisResults } from "@/db/schema";
import { prepareAnalysisData } from "@/lib/analysis/prepare";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/analysis/prompt";
import { buildAnalysisSchema } from "@/lib/analysis/schema";
import { getUserProfile } from "@/lib/onboarding";

export type RunAnalysisResult = { ok: true } | { ok: false; error: string };

export async function runAnalysisAction(): Promise<RunAnalysisResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    redirect("/login");
  }
  if (
    !profile.onboardingCompletedAt ||
    !profile.assessmentCompletedAt ||
    !profile.gradesCompletedAt
  ) {
    return {
      ok: false,
      error: "Selesaikan onboarding, asesmen, dan input nilai dulu ya.",
    };
  }

  if (!process.env.GROQ_API_KEY) {
    return {
      ok: false,
      error:
        "GROQ_API_KEY belum diatur. Isi dulu di file .env.local lalu coba lagi.",
    };
  }

  const data = await prepareAnalysisData(session.user.id);
  if (data.majors.length < 3) {
    return {
      ok: false,
      error:
        "Data jurusan belum tersedia. Jalankan perintah db:seed-colleges dulu.",
    };
  }

  const majorIds = data.majors.map((major) => major.id) as [
    string,
    ...string[],
  ];

  let rawOutput;
  try {
    const result = await generateText({
      model: groq("openai/gpt-oss-120b"),
      output: Output.object({ schema: buildAnalysisSchema(majorIds) }),
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(data),
      temperature: 0.6,
      providerOptions: {
        groq: { reasoningEffort: "medium" },
      },
    });
    rawOutput = result.output;
  } catch (error) {
    console.error("[analysis] generasi gagal:", error);
    return {
      ok: false,
      error:
        "Analisis gagal diproses. Coba lagi sebentar, kalau masih gagal cek koneksi dan API key.",
    };
  }

  if (!rawOutput) {
    return {
      ok: false,
      error: "Model tidak mengembalikan hasil. Coba jalankan ulang.",
    };
  }

  const seenMajors = new Set<string>();
  const recommendations = [...rawOutput.recommendations]
    .filter((item) => {
      if (seenMajors.has(item.majorId)) return false;
      seenMajors.add(item.majorId);
      return true;
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 5)
    .map((item, index) => ({
      majorId: item.majorId,
      matchPercentage: Math.min(97, Math.max(40, item.matchPercentage)),
      rankOrder: index + 1,
      reason: item.reason.trim(),
    }));

  if (recommendations.length < 3) {
    return {
      ok: false,
      error: "Hasil analisis kurang lengkap. Coba jalankan ulang ya.",
    };
  }

  const personalityType = rawOutput.personalityType.trim().slice(0, 50);
  const strengths = rawOutput.strengths
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  const alignmentNote = rawOutput.alignmentNote.trim();
  const analysisSummary = rawOutput.analysisSummary.trim();
  const generatedAt = new Date();

  await db.transaction(async (tx) => {
    await tx
      .delete(analysisRecommendations)
      .where(eq(analysisRecommendations.userId, session.user.id));

    await tx
      .insert(analysisResults)
      .values({
        userId: session.user.id,
        personalityType,
        analysisSummary,
        details: { strengths, alignmentNote },
        generatedAt,
      })
      .onConflictDoUpdate({
        target: analysisResults.userId,
        set: {
          personalityType,
          analysisSummary,
          details: { strengths, alignmentNote },
          generatedAt,
        },
      });

    await tx.insert(analysisRecommendations).values(
      recommendations.map((item) => ({
        userId: session.user.id,
        majorId: item.majorId,
        matchPercentage: item.matchPercentage.toFixed(2),
        rankOrder: item.rankOrder,
        reason: item.reason,
      })),
    );
  });

  return { ok: true };
}
