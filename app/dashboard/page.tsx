import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import AppShell from "@/components/app/AppShell";
import { TeraMark } from "@/components/landing/TeraMark";
import { SendIcon } from "@/components/landing/icons";
import { getJourneySteps, getUserProfile } from "@/lib/onboarding";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard: Terang.in",
  description: "Pantau perjalananmu menentukan jurusan bersama Tera.",
};

export default async function DashboardPage() {
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

  const steps = await getJourneySteps(session.user.id);
  const firstName = profile.fullName.trim().split(" ")[0];
  const interests = profile.initialInterests ?? [];
  const assessmentDone = profile.assessmentCompletedAt != null;
  const gradesDone = profile.gradesCompletedAt != null;
  const analysisDone = steps.find((step) => step.n === 4)?.state === "done";

  return (
    <AppShell user={{ name: profile.fullName }} steps={steps}>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">
        Halo, {firstName}
      </h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-fg-muted">
        Profil kamu udah siap. Lanjut ke langkah berikutnya biar Tera makin
        kenal kamu.
      </p>

      {(profile.schoolOrigin || profile.gradeLevel || interests.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {profile.schoolOrigin && (
            <span className="rounded-full border border-overlay/10 px-3 py-1 text-[11px] text-fg-muted">
              {profile.schoolOrigin}
            </span>
          )}
          {profile.gradeLevel && (
            <span className="rounded-full border border-overlay/10 px-3 py-1 text-[11px] text-fg-muted">
              Kelas {profile.gradeLevel}
            </span>
          )}
          {interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-overlay/10 px-3 py-1 text-[11px] text-fg-muted"
            >
              {interest}
            </span>
          ))}
        </div>
      )}

      <section className="mt-8 grid gap-5">
        <div className="rounded-2xl border border-overlay/8 bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-md bg-success/10 px-2 py-1 text-[10px] text-success">
              Langkah 2
            </span>
            {assessmentDone ? (
              <span className="flex items-center gap-1.5 text-[11px] text-fg-muted">
                <span className="size-1.5 rounded-full bg-success/80" />
                Selesai
              </span>
            ) : (
              <span className="text-[11px] text-fg-faint">Belum dimulai</span>
            )}
          </div>
          <h2 className="mt-4 text-[15px] font-medium text-fg">
            Asesmen Bakat
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
            Kuis interaktif buat gali minat, bakat, kepribadian, dan gaya
            belajarmu. Nggak ada jawaban benar atau salah.
          </p>
          <Link
            href="/assessment"
            className={
              assessmentDone
                ? "mt-5 flex h-10 w-full items-center justify-center rounded-full border border-overlay/10 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
                : "mt-5 flex h-10 w-full items-center justify-center rounded-full bg-primary text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
            }
          >
            {assessmentDone ? "Ulangi asesmen" : "Mulai asesmen"}
          </Link>
        </div>

        <div className="rounded-2xl border border-overlay/8 bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-md bg-success/10 px-2 py-1 text-[10px] text-success">
              Langkah 3
            </span>
            {gradesDone ? (
              <span className="flex items-center gap-1.5 text-[11px] text-fg-muted">
                <span className="size-1.5 rounded-full bg-success/80" />
                Selesai
              </span>
            ) : (
              <span className="text-[11px] text-fg-faint">Belum dimulai</span>
            )}
          </div>
          <h2 className="mt-4 text-[15px] font-medium text-fg">
            Input Nilai
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
            Masukin nilai rapor tiap semester. Tambahin mata pelajarannya
            sebanyak yang kamu mau.
          </p>
          {assessmentDone ? (
            <Link
              href="/nilai"
              className={
                gradesDone
                  ? "mt-5 flex h-10 w-full items-center justify-center rounded-full border border-overlay/10 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
                  : "mt-5 flex h-10 w-full items-center justify-center rounded-full bg-primary text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
              }
            >
              {gradesDone ? "Ubah nilai" : "Mulai input nilai"}
            </Link>
          ) : (
            <span className="mt-5 flex h-10 w-full cursor-not-allowed items-center justify-center rounded-full border border-overlay/10 text-[13px] text-fg-faint">
              Selesaikan asesmen dulu
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-overlay/8 bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-md bg-success/10 px-2 py-1 text-[10px] text-success">
              Langkah 4
            </span>
            {analysisDone ? (
              <span className="flex items-center gap-1.5 text-[11px] text-fg-muted">
                <span className="size-1.5 rounded-full bg-success/80" />
                Selesai
              </span>
            ) : (
              <span className="text-[11px] text-fg-faint">Belum dimulai</span>
            )}
          </div>
          <h2 className="mt-4 text-[15px] font-medium text-fg">
            Hasil Analisis
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
            Tera nyocokin minat, bakat, kepribadian, dan nilai rapormu jadi
            rekomendasi jurusan yang masuk akal.
          </p>
          {gradesDone ? (
            <Link
              href="/analisis"
              className={
                analysisDone
                  ? "mt-5 flex h-10 w-full items-center justify-center rounded-full border border-overlay/10 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
                  : "mt-5 flex h-10 w-full items-center justify-center rounded-full bg-primary text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
              }
            >
              {analysisDone ? "Lihat hasil analisis" : "Jalankan analisis"}
            </Link>
          ) : (
            <span className="mt-5 flex h-10 w-full cursor-not-allowed items-center justify-center rounded-full border border-overlay/10 text-[13px] text-fg-faint">
              Selesaikan input nilai dulu
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-overlay/8 bg-surface p-6">
          <div className="flex items-center gap-2">
            <TeraMark className="size-5" />
            <span className="text-[13px] font-medium text-fg-soft">Tera</span>
            <span className="ml-auto text-[11px] text-fg-faint">
              Sebentar lagi
            </span>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-fg-muted">
            Chat personal sama Tera nyala setelah analisis kamu selesai.
            Selesaikan langkah sebelumnya dulu, ya.
          </p>
          <div className="mt-4 flex h-11 items-center gap-2 rounded-full border border-overlay/10 bg-surface-elevated pl-4 pr-1.5 opacity-50">
            <span className="flex-1 truncate text-[13px] text-fg-faintest">
              Pesan Tera
            </span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-overlay/25 text-primary-fg">
              <SendIcon className="size-4" />
            </span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
