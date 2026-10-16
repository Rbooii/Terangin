import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import AppShell from "@/components/app/AppShell";
import DeleteAccountCard from "@/components/account/DeleteAccountCard";
import ThemeSwitch from "@/components/account/ThemeSwitch";
import TransactionHistory from "@/components/account/TransactionHistory";
import { getJourneySteps, getUserProfile } from "@/lib/onboarding";
import {
  expireStaleTransactions,
  getChatAccess,
  listTransactionViews,
} from "@/lib/payment/queries";

export const instant = false;

export const metadata: Metadata = {
  title: "Akun: Terang.in",
  description: "Pengaturan tampilan dan keamanan akun Terang.in.",
};

export default async function AccountPage() {
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

  await expireStaleTransactions(session.user.id);

  const [steps, transactions, chatAccess] = await Promise.all([
    getJourneySteps(session.user.id),
    listTransactionViews(session.user.id),
    getChatAccess(session.user.id),
  ]);

  return (
    <AppShell
      user={{ name: profile.fullName, id: session.user.id }}
      steps={steps}
    >
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Akun</h1>
      <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-fg-muted">
        Pengaturan tampilan dan keamanan akunmu. Kamu masuk sebagai{" "}
        {profile.email}.
      </p>

      <div className="mt-8 rounded-2xl border border-overlay/8 bg-surface p-6 sm:p-7">
        <h2 className="text-[15px] font-medium text-fg">Tampilan</h2>
        <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-fg-muted">
          Pilih tema yang paling nyaman buat matamu. Pilihanmu tersimpan di
          perangkat ini.
        </p>
        <div className="mt-5">
          <ThemeSwitch />
        </div>
      </div>

      <div className="mt-5">
        <TransactionHistory
          transactions={transactions}
          chatActive={chatAccess.active}
          chatEndsAt={chatAccess.endsAt ? chatAccess.endsAt.toISOString() : null}
        />
      </div>

      <div className="mt-5">
        <DeleteAccountCard />
      </div>
    </AppShell>
  );
}
