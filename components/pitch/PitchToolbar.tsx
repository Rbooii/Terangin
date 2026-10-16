"use client";

import Link from "next/link";
import { DownloadIcon } from "@/components/landing/icons";

export default function PitchToolbar() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 print:hidden">
      <Link
        href="/"
        className="flex h-10 items-center rounded-full border border-overlay/10 px-4 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
      >
        Kembali
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
      >
        <DownloadIcon className="size-4" />
        Cetak / Simpan PDF
      </button>
    </div>
  );
}
