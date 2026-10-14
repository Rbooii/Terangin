"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { academicRecords, users } from "@/db/schema";
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

  const [existing] = await db
    .select({ id: academicRecords.id })
    .from(academicRecords)
    .where(eq(academicRecords.userId, session.user.id))
    .limit(1);

  if (!existing) {
    return {
      ok: false,
      error: "Isi minimal satu nilai dulu ya sebelum tandai selesai.",
    };
  }

  await db
    .update(users)
    .set({ gradesCompletedAt: new Date() })
    .where(eq(users.id, session.user.id));

  redirect("/dashboard");
}
