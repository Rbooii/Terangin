import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import AppShell from "@/components/app/AppShell";
import BasicsForm from "@/components/onboarding/BasicsForm";
import TourSlides from "@/components/onboarding/TourSlides";
import { getJourneySteps, getUserProfile } from "@/lib/onboarding";

export const instant = false;

export const metadata: Metadata = {
  title: "Onboarding: Terang.in",
  description: "Kenalan dulu sama Tera dan mulai perjalananmu.",
};

export default async function OnboardingPage() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    redirect("/login");
  }
  if (profile.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  const steps = await getJourneySteps(session.user.id);
  const hasBasics = Boolean(profile.schoolOrigin && profile.gradeLevel);

  return (
    <AppShell user={{ name: profile.fullName, id: session.user.id }} steps={steps}>
      {hasBasics ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Tur singkat
          </h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-fg-muted">
            Kenalan sama cara kerja Terang.in, satu menit aja.
          </p>
          <TourSlides />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Kenalan dulu, yuk
          </h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-fg-muted">
            Beberapa info dasar biar Tera bisa nemenin kamu. Cepet kok, nggak
            sampai satu menit.
          </p>
          <BasicsForm />
        </>
      )}
    </AppShell>
  );
}
