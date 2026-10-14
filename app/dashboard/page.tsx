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
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Halo, {firstName}
      </h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-zinc-400">
        Profil kamu udah siap. Lanjut ke langkah berikutnya biar Tera makin
        kenal kamu.
      </p>

      {(profile.schoolOrigin || profile.gradeLevel || interests.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {profile.schoolOrigin && (
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400">
              {profile.schoolOrigin}
            </span>
          )}
          {profile.gradeLevel && (
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400">
              Kelas {profile.gradeLevel}
            </span>
          )}
          {interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400"
            >
              {interest}
            </span>
          ))}
        </div>
      )}

      <section className="mt-8 grid gap-5">
        <div className="rounded-2xl border border-white/8 bg-[#161616] p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
              Langkah 2
            </span>
            {assessmentDone ? (
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="size-1.5 rounded-full bg-emerald-400/80" />
                Selesai
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">Belum dimulai</span>
            )}
          </div>
          <h2 className="mt-4 text-[15px] font-medium text-white">
            Asesmen Bakat
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            Kuis interaktif buat gali minat, bakat, kepribadian, dan gaya
            belajarmu. Nggak ada jawaban benar atau salah.
          </p>
          <Link
            href="/assessment"
            className={
              assessmentDone
                ? "mt-5 flex h-10 w-full items-center justify-center rounded-full border border-white/10 text-[13px] text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                : "mt-5 flex h-10 w-full items-center justify-center rounded-full bg-white text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
            }
          >
            {assessmentDone ? "Ulangi asesmen" : "Mulai asesmen"}
          </Link>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#161616] p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
              Langkah 3
            </span>
            {gradesDone ? (
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="size-1.5 rounded-full bg-emerald-400/80" />
                Selesai
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">Belum dimulai</span>
            )}
          </div>
          <h2 className="mt-4 text-[15px] font-medium text-white">
            Input Nilai
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            Masukin nilai rapor tiap semester. Tambahin mata pelajarannya
            sebanyak yang kamu mau.
          </p>
          {assessmentDone ? (
            <Link
              href="/nilai"
              className={
                gradesDone
                  ? "mt-5 flex h-10 w-full items-center justify-center rounded-full border border-white/10 text-[13px] text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                  : "mt-5 flex h-10 w-full items-center justify-center rounded-full bg-white text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
              }
            >
              {gradesDone ? "Ubah nilai" : "Mulai input nilai"}
            </Link>
          ) : (
            <span className="mt-5 flex h-10 w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 text-[13px] text-zinc-500">
              Selesaikan asesmen dulu
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#161616] p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
              Langkah 4
            </span>
            {analysisDone ? (
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="size-1.5 rounded-full bg-emerald-400/80" />
                Selesai
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">Belum dimulai</span>
            )}
          </div>
          <h2 className="mt-4 text-[15px] font-medium text-white">
            Hasil Analisis
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            Tera nyocokin minat, bakat, kepribadian, dan nilai rapormu jadi
            rekomendasi jurusan yang masuk akal.
          </p>
          {gradesDone ? (
            <Link
              href="/analisis"
              className={
                analysisDone
                  ? "mt-5 flex h-10 w-full items-center justify-center rounded-full border border-white/10 text-[13px] text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                  : "mt-5 flex h-10 w-full items-center justify-center rounded-full bg-white text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
              }
            >
              {analysisDone ? "Lihat hasil analisis" : "Jalankan analisis"}
            </Link>
          ) : (
            <span className="mt-5 flex h-10 w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 text-[13px] text-zinc-500">
              Selesaikan input nilai dulu
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#161616] p-6">
          <div className="flex items-center gap-2">
            <TeraMark className="size-5" />
            <span className="text-[13px] font-medium text-zinc-200">Tera</span>
            <span className="ml-auto text-[11px] text-zinc-500">
              Sebentar lagi
            </span>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-zinc-400">
            Chat personal sama Tera nyala setelah analisis kamu selesai.
            Selesaikan langkah sebelumnya dulu, ya.
          </p>
          <div className="mt-4 flex h-11 items-center gap-2 rounded-full border border-white/10 bg-[#1b1b1b] pl-4 pr-1.5 opacity-50">
            <span className="flex-1 truncate text-[13px] text-zinc-600">
              Pesan Tera
            </span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/25 text-black">
              <SendIcon className="size-4" />
            </span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
