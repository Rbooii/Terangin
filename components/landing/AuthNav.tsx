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
        className="hidden h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] text-zinc-300 transition-colors hover:text-white sm:flex"
      >
        Ask Us
        <ArrowRight className="size-3.5" />
      </Link>
      <Link
        href="/signup"
        className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
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
        className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-1.5 pr-3 text-[13px] text-zinc-200 transition-colors hover:border-white/25 hover:bg-white/10"
      >
        <span className="grid size-6 place-items-center rounded-full bg-white text-[10px] font-semibold text-black">
          {initial}
        </span>
        <span className="max-w-28 truncate">{session.user.name}</span>
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex h-9 items-center rounded-full border border-white/10 px-3.5 text-[13px] text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          Keluar
        </button>
      </form>
    </div>
  );
}
