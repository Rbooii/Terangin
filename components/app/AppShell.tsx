import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/lib/actions/auth";
import type { JourneyStep } from "@/lib/onboarding";
import { ArrowRight } from "@/components/landing/icons";
import { TeraMark } from "@/components/landing/TeraMark";
import ChatFab from "./ChatFab";
import ChatMenuCard from "./ChatMenuCard";
import StepList from "./StepList";

export default function AppShell({
  user,
  steps,
  children,
}: {
  user: { name: string };
  steps: JourneyStep[];
  children: ReactNode;
}) {
  const initial = (user.name.trim()[0] ?? "T").toUpperCase();
  const chatUnlocked =
    steps.find((step) => step.n === 4)?.state === "done";

  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row md:overflow-hidden">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-overlay/6 p-5 md:flex md:h-full md:overflow-y-auto">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[13px] font-medium text-fg-soft"
        >
          <TeraMark className="size-4" />
          <span>
            Terang<span className="text-fg-faint">.in</span>
          </span>
        </Link>

        <StepList steps={steps} />

        <div className="mt-auto space-y-3 pt-10">
          <ChatMenuCard unlocked={chatUnlocked} />
          <Link
            href="/akun"
            aria-label="Buka pengaturan akun"
            className="flex items-center gap-3 rounded-xl border border-overlay/8 bg-surface-elevated p-3.5 transition-colors hover:border-overlay/20"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-fg">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-fg-soft">
                {user.name}
              </span>
              <span className="block text-[11px] text-fg-faint">
                Siswa SMA
              </span>
            </span>
            <ArrowRight className="size-3.5 shrink-0 text-fg-faint" />
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="h-9 w-full rounded-full border border-overlay/10 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:h-full md:overflow-y-auto">
        <header className="border-b border-overlay/6 px-5 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-[13px] font-medium text-fg-soft"
            >
              <TeraMark className="size-4" />
              <span>
                Terang<span className="text-fg-faint">.in</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/akun"
                className="rounded-full px-3 py-1.5 text-[12px] text-fg-secondary transition-colors hover:text-fg"
              >
                Akun
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-overlay/10 px-3 py-1.5 text-[12px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
                >
                  Keluar
                </button>
              </form>
            </div>
          </div>
          <StepList steps={steps} />
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 md:px-10 md:py-12">
          {children}
        </main>
      </div>
      <ChatFab unlocked={chatUnlocked} />
    </div>
  );
}
