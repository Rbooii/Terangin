import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { academicRecords } from "@/db/schema";
import AppShell from "@/components/app/AppShell";
import GradeInput from "@/components/grades/GradeInput";
import { defaultSemestersFor } from "@/lib/grades";
import { getJourneySteps, getUserProfile } from "@/lib/onboarding";

export const instant = false;

export const metadata: Metadata = {
  title: "Input Nilai: Terang.in",
  description: "Masukin nilai rapor tiap semester sesuai kecepatanmu.",
};

export default async function GradesPage() {
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

  const [steps, records] = await Promise.all([
    getJourneySteps(session.user.id),
    db
      .select({
        subject: academicRecords.subject,
        semester: academicRecords.semester,
        score: academicRecords.score,
      })
      .from(academicRecords)
      .where(eq(academicRecords.userId, session.user.id))
      .orderBy(asc(academicRecords.semester), asc(academicRecords.subject)),
  ]);

  return (
    <AppShell user={{ name: profile.fullName, id: session.user.id }} steps={steps}>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">
        Input Nilai
      </h1>
      <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-fg-muted">
        Masukin nilai rapor tiap semester. Minimal 7 mata pelajaran per
        semester biar analisisnya akurat. Kamu tetap bisa ngubah kapan aja.
      </p>
      <div className="mt-8">
        <GradeInput
          initialRecords={records}
          defaultSemesters={defaultSemestersFor(profile.gradeLevel)}
          completed={profile.gradesCompletedAt != null}
        />
      </div>
    </AppShell>
  );
}
