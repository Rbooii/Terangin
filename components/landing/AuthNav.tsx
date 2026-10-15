import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/actions/auth";
import { ArrowRight } from "./icons";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/login"
        className="hidden h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] text-fg-secondary transition-colors hover:text-fg sm:flex"
      >
        Ask Us
        <ArrowRight className="size-3.5" />
      </Link>
      <Link
        href="/signup"
        className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
      >
        Get Started
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

export default async function AuthNav() {
  await connection();
  const session = await auth();

  if (!session?.user) {
    return <AuthButtons />;
  }

  const initial = (session.user.name?.trim()?.[0] ?? "T").toUpperCase();

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/dashboard"
        className="flex h-9 items-center gap-2 rounded-full border border-overlay/10 bg-overlay/5 pl-1.5 pr-3 text-[13px] text-fg-soft transition-colors hover:border-overlay/25 hover:bg-overlay/10"
      >
        <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-fg">
          {initial}
        </span>
        <span className="max-w-28 truncate">{session.user.name}</span>
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex h-9 items-center rounded-full border border-overlay/10 px-3.5 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
        >
          Keluar
        </button>
      </form>
    </div>
  );
}
