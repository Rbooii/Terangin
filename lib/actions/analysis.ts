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
import {
  FACTOR_WEIGHTS,
  scoreMajors,
  type FactorScores,
  type MajorProfile,
} from "@/lib/analysis/score";
import { getUserProfile } from "@/lib/onboarding";

export type RunAnalysisResult = { ok: true } | { ok: false; error: string };

const MIN_SCORABLE_MAJORS = 3;
const TOP_RECOMMENDATIONS = 5;

function defaultReason(majorName: string, factors: FactorScores): string {
  const entries: Array<[string, number | null]> = [
    ["minat", factors.minat],
    ["bakat", factors.bakat],
    ["nilai rapor", factors.nilai],
    ["kepribadian", factors.kepribadian],
    ["gaya belajar", factors.gayaBelajar],
  ];
  const best = entries
    .filter((entry): entry is [string, number] => entry[1] !== null)
    .sort((a, b) => b[1] - a[1])[0];
  if (!best) {
    return `Skor kecocokanmu untuk ${majorName} belum didukung data yang cukup.`;
  }
  return `Kecocokanmu di ${majorName} paling didorong faktor ${best[0]} (skor ${Math.round(best[1])}). Bandingkan juga dengan pilihan lain di daftar ini, ya.`;
}

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
  if (data.majors.length < MIN_SCORABLE_MAJORS) {
    return {
      ok: false,
      error:
        "Data jurusan belum tersedia. Jalankan perintah db:seed-colleges dulu.",
    };
  }

  const subjectAverages: Record<string, number | null> = Object.fromEntries(
    data.academic.subjects.map((item) => [item.subject, item.average]),
  );

  const scored = scoreMajors(
    data.majors.map((major) => ({
      id: major.id,
      name: major.name,
      profile: (major.profile as MajorProfile | null) ?? null,
    })),
    data.assessment.dimensionScores,
    subjectAverages,
  );

  const scorable = scored.filter((item) => item.factors.total !== null);
  if (scorable.length < MIN_SCORABLE_MAJORS) {
    return {
      ok: false,
      error:
        "Data kamu belum cukup untuk menghitung rekomendasi. Lengkapi asesmen dan nilai rapor dulu ya.",
    };
  }

  const ranked = scorable.slice(0, TOP_RECOMMENDATIONS);
  const narrationIds = ranked.map((item) => item.majorId) as [
    string,
    ...string[],
  ];

  let rawOutput;
  try {
    const result = await generateText({
      model: groq("openai/gpt-oss-120b"),
      output: Output.object({ schema: buildAnalysisSchema(narrationIds) }),
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(data, ranked),
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

  const reasonByMajor = new Map(
    rawOutput.recommendations.map((item) => [item.majorId, item.reason.trim()]),
  );

  const recommendations = ranked.map((item, index) => ({
    majorId: item.majorId,
    matchPercentage: item.factors.match ?? 40,
    rankOrder: index + 1,
    reason:
      reasonByMajor.get(item.majorId) ?? defaultReason(item.name, item.factors),
    factors: item.factors,
  }));

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
        details: {
          strengths,
          alignmentNote,
          weights: FACTOR_WEIGHTS,
          method: "deterministic-v1",
        },
        generatedAt,
      })
      .onConflictDoUpdate({
        target: analysisResults.userId,
        set: {
          personalityType,
          analysisSummary,
          details: {
            strengths,
            alignmentNote,
            weights: FACTOR_WEIGHTS,
            method: "deterministic-v1",
          },
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
        factors: item.factors,
      })),
    );
  });

  return { ok: true };
}
