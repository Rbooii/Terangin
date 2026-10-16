import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { questions, userAssessmentAnswers } from "@/db/schema";
import AppShell from "@/components/app/AppShell";
import AssessmentFlow from "@/components/assessment/AssessmentFlow";
import { restartAssessmentAction } from "@/lib/actions/assessment";
import { getJourneySteps, getUserProfile } from "@/lib/onboarding";

export const instant = false;

export const metadata: Metadata = {
  title: "Asesmen Minat & Bakat: Terang.in",
  description:
    "Kuis interaktif buat gali minat, bakat, kepribadian, dan gaya belajarmu.",
};

export default async function AssessmentPage() {
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

  const [steps, bank, answers] = await Promise.all([
    getJourneySteps(session.user.id),
    db
      .select({
        id: questions.id,
        category: questions.category,
        questionText: questions.questionText,
      })
      .from(questions)
      .orderBy(asc(questions.orderIndex)),
    db
      .select({
        questionId: userAssessmentAnswers.questionId,
        score: userAssessmentAnswers.score,
      })
      .from(userAssessmentAnswers)
      .where(eq(userAssessmentAnswers.userId, session.user.id)),
  ]);

  const completedAt = profile.assessmentCompletedAt;

  return (
    <AppShell user={{ name: profile.fullName, id: session.user.id }} steps={steps}>
      {completedAt ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Asesmen selesai
          </h1>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-fg-muted">
            Kamu sudah menjawab {answers.length} soal. Jawabanmu tersimpan dan
            siap dianalisis bareng data akademikmu.
          </p>
          <p className="mt-2 text-[12px] text-fg-faint">
            Diselesaikan{" "}
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
              completedAt,
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <form action={restartAssessmentAction}>
              <button
                type="submit"
                className="h-10 rounded-full border border-overlay/10 px-5 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
              >
                Ulangi asesmen
              </button>
            </form>
            <Link
              href="/dashboard"
              className="flex h-10 items-center rounded-full bg-primary px-5 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
            >
              Kembali ke dashboard
            </Link>
          </div>
        </>
      ) : bank.length === 0 ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Asesmen Minat & Bakat
          </h1>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-fg-muted">
            Bank soal belum tersedia. Jalankan seed dulu lewat perintah
            db:seed.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Asesmen Minat & Bakat
          </h1>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-fg-muted">
            {bank.length} soal singkat soal minat, kepribadian, bakat, dan
            gaya belajarmu. Tiap soal punya waktu 15 detik, dan sisanya
            tersimpan kalau kamu pindah soal.
          </p>
          <div className="mt-8">
            <AssessmentFlow questions={bank} initialAnswers={answers} />
          </div>
        </>
      )}
    </AppShell>
  );
}
