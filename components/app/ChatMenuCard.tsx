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

export default function ChatMenuCard({
  unlocked,
  expired = false,
}: {
  unlocked: boolean;
  expired?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith("/chat");

  if (!unlocked) {
    return (
      <div
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-overlay/8 bg-surface-elevated p-3.5 opacity-50"
      >
        <ChatTile />
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-fg-soft">
            Chat sama Tera
          </span>
          <span className="block truncate text-[11px] text-fg-faint">
            {expired
              ? "Akses berakhir, analisis lagi"
              : "Terbuka setelah analisis selesai"}
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
          ? "flex items-center gap-3 rounded-xl border border-overlay/20 bg-surface-elevated p-3.5"
          : "flex items-center gap-3 rounded-xl border border-overlay/8 bg-surface-elevated p-3.5 transition-colors hover:border-overlay/20"
      }
    >
      <ChatTile />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-fg-soft">
          Chat sama Tera
        </span>
        <span className="block truncate text-[11px] text-fg-faint">
          {active ? "Lagi ngobrol" : "Kenapa aku cocok di Psikologi?"}
        </span>
      </span>
    </Link>
  );
}
