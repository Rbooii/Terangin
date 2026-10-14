import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import AppShell from "@/components/app/AppShell";
import ProfileForm from "@/components/profile/ProfileForm";
import { restartTourAction } from "@/lib/actions/profile";
import { getJourneySteps, getUserProfile } from "@/lib/onboarding";

export const instant = false;

export const metadata: Metadata = {
  title: "Profil: Terang.in",
  description: "Data dasar profilmu di Terang.in.",
};

export default async function ProfilePage() {
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

  return (
    <AppShell user={{ name: profile.fullName }} steps={steps}>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Profil
      </h1>
      <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-zinc-400">
        Data dasar yang kamu isi waktu kenalan. Berubah pikiran? Ubah aja,
        Tera bakal ikut menyesuaikan.
      </p>

      <div className="mt-8">
        <ProfileForm
          profile={{
            fullName: profile.fullName,
            email: profile.email,
            schoolOrigin: profile.schoolOrigin,
            gradeLevel: profile.gradeLevel,
            interests: profile.initialInterests ?? [],
          }}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/8 bg-[#161616] p-6">
        <h2 className="text-[15px] font-medium text-white">Tur onboarding</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
          Mau lihat lagi cara kerja Terang.in? Ulang turnya dari awal, nggak
          ada datamu yang hilang.
        </p>
        <form action={restartTourAction}>
          <button
            type="submit"
            className="mt-5 h-10 rounded-full border border-white/10 px-5 text-[13px] text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Ulangi tur
          </button>
        </form>
      </div>
    </AppShell>
  );
}
