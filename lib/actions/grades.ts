"use server";

import { and, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { academicRecords, users } from "@/db/schema";
import {
  defaultSemestersFor,
  formatShortfallMessage,
  getRequiredSemesters,
  getSemesterShortfalls,
} from "@/lib/grades";
import { getUserProfile } from "@/lib/onboarding";
import { gradeDeleteSchema, gradeSchema } from "@/lib/validation";

export type GradeActionResult = { ok: boolean; error?: string };
export type CompleteGradesResult = { ok: false; error: string } | undefined;

export async function saveGradeAction(input: {
  subject: string;
  semester: number;
  score: number;
}): Promise<GradeActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sesi kamu habis. Coba muat ulang halaman ini." };
  }

  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data nilai nggak valid.",
    };
  }

  const { subject, semester, score } = parsed.data;

  await db
    .insert(academicRecords)
    .values({
      userId: session.user.id,
      subject,
      semester,
      score: score.toFixed(2),
    })
    .onConflictDoUpdate({
      target: [
        academicRecords.userId,
        academicRecords.subject,
        academicRecords.semester,
      ],
      set: { score: score.toFixed(2) },
    });

  return { ok: true };
}

export async function deleteGradeAction(input: {
  subject: string;
  semester: number;
}): Promise<GradeActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sesi kamu habis. Coba muat ulang halaman ini." };
  }

  const parsed = gradeDeleteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Data nilai nggak valid." };
  }

  await db
    .delete(academicRecords)
    .where(
      and(
        eq(academicRecords.userId, session.user.id),
        eq(academicRecords.subject, parsed.data.subject),
        eq(academicRecords.semester, parsed.data.semester),
      ),
    );

  return { ok: true };
}

export async function completeGradesAction(): Promise<CompleteGradesResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return {
      ok: false,
      error: "Profil kamu nggak ketemu. Coba muat ulang halaman ini.",
    };
  }

  const grouped = await db
    .select({
      semester: academicRecords.semester,
      total: count(),
    })
    .from(academicRecords)
    .where(eq(academicRecords.userId, session.user.id))
    .groupBy(academicRecords.semester);

  const countBySemester = new Map(
    grouped.map((row) => [row.semester, Number(row.total)]),
  );
  const requiredSemesters = getRequiredSemesters(
    defaultSemestersFor(profile.gradeLevel),
    grouped.map((row) => row.semester),
  );
  const shortfalls = getSemesterShortfalls(requiredSemesters, countBySemester);

  if (shortfalls.length > 0) {
    return { ok: false, error: formatShortfallMessage(shortfalls) };
  }

  await db
    .update(users)
    .set({ gradesCompletedAt: new Date() })
    .where(eq(users.id, session.user.id));

  redirect("/dashboard");
}
