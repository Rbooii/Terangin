"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { TeraMark } from "@/components/landing/TeraMark";

export default function ChatFab({ unlocked }: { unlocked: boolean }) {
  const pathname = usePathname();
  if (!unlocked || pathname.startsWith("/chat")) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="fixed bottom-5 right-5 z-40 md:hidden"
    >
      <Link
        href="/chat"
        aria-label="Chat sama Tera"
        className="grid size-14 place-items-center rounded-full border border-overlay/12 bg-surface/90 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur transition-colors hover:border-overlay/25"
      >
        <TeraMark className="size-9" />
      </Link>
    </motion.div>
  );
}
