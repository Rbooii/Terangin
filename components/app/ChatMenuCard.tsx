"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TeraMark } from "@/components/landing/TeraMark";

function ChatTile() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
      <TeraMark className="size-5" />
    </span>
  );
}

export default function ChatMenuCard({ unlocked }: { unlocked: boolean }) {
  const pathname = usePathname();
  const active = pathname.startsWith("/chat");

  if (!unlocked) {
    return (
      <div
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-white/8 bg-[#1b1b1b] p-3.5 opacity-50"
      >
        <ChatTile />
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-zinc-200">
            Chat sama Tera
          </span>
          <span className="block truncate text-[11px] text-zinc-500">
            Terbuka setelah analisis selesai
          </span>
        </span>
      </div>
    );
  }

  return (
    <Link
      href="/chat"
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex items-center gap-3 rounded-xl border border-white/20 bg-[#1e1e1e] p-3.5"
          : "flex items-center gap-3 rounded-xl border border-white/8 bg-[#1b1b1b] p-3.5 transition-colors hover:border-white/20"
      }
    >
      <ChatTile />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-zinc-200">
          Chat sama Tera
        </span>
        <span className="block truncate text-[11px] text-zinc-500">
          {active ? "Lagi ngobrol" : "Kenapa aku cocok di Psikologi?"}
        </span>
      </span>
    </Link>
  );
}
