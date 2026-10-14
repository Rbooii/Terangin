"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { questions, userAssessmentAnswers, users } from "@/db/schema";
import {
  assessmentAnswerSchema,
  assessmentSkipSchema,
} from "@/lib/validation";

export type SaveAnswerResult = { ok: boolean; error?: string };
export type SkipQuestionResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};
export type CompleteAssessmentResult = { ok: false; error: string } | undefined;

export async function saveAnswerAction(input: {
  questionId: string;
  score: number;
}): Promise<SaveAnswerResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sesi kamu habis. Coba muat ulang halaman ini." };
  }

  const parsed = assessmentAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Jawaban nggak valid.",
    };
  }

  const [question] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.id, parsed.data.questionId))
    .limit(1);

  if (!question) {
    return { ok: false, error: "Soal nggak ditemukan di bank soal." };
  }

  await db
    .insert(userAssessmentAnswers)
    .values({
      userId: session.user.id,
      questionId: parsed.data.questionId,
      score: parsed.data.score,
    })
    .onConflictDoUpdate({
      target: [
        userAssessmentAnswers.userId,
        userAssessmentAnswers.questionId,
      ],
      set: { score: parsed.data.score },
    });

  return { ok: true };
}

export async function skipQuestionAction(input: {
  questionId: string;
}): Promise<SkipQuestionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sesi kamu habis. Coba muat ulang halaman ini." };
  }

  const parsed = assessmentSkipSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Soal nggak valid." };
  }

  const [question] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.id, parsed.data.questionId))
    .limit(1);

  if (!question) {
    return { ok: false, error: "Soal nggak ditemukan di bank soal." };
  }

  const inserted = await db
    .insert(userAssessmentAnswers)
    .values({
      userId: session.user.id,
      questionId: parsed.data.questionId,
      score: 0,
    })
    .onConflictDoNothing({
      target: [
        userAssessmentAnswers.userId,
        userAssessmentAnswers.questionId,
      ],
    })
    .returning({ id: userAssessmentAnswers.id });

  return { ok: true, skipped: inserted.length > 0 };
}

export async function completeAssessmentAction(): Promise<CompleteAssessmentResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [[bank], answers] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(questions),
    db
      .select({ id: userAssessmentAnswers.id })
      .from(userAssessmentAnswers)
      .where(eq(userAssessmentAnswers.userId, session.user.id)),
  ]);

  if (bank.count === 0 || answers.length < bank.count) {
    const remaining = Math.max(bank.count - answers.length, 0);
    return {
      ok: false,
      error: `Masih ada ${remaining} soal yang belum dijawab.`,
    };
  }

  await db
    .update(users)
    .set({ assessmentCompletedAt: new Date() })
    .where(eq(users.id, session.user.id));

  redirect("/dashboard");
}

export async function restartAssessmentAction() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await db
    .delete(userAssessmentAnswers)
    .where(eq(userAssessmentAnswers.userId, session.user.id));

  await db
    .update(users)
    .set({ assessmentCompletedAt: null })
    .where(eq(users.id, session.user.id));

  redirect("/assessment");
}
