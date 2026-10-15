"use client";

import Link from "next/link";
import { DownloadIcon } from "@/components/landing/icons";

export default function PrintToolbar() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 print:hidden">
      <Link
        href="/analisis"
        className="flex h-10 items-center rounded-full border border-zinc-300 bg-white px-4 text-[13px] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
      >
        Kembali
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-700"
      >
        <DownloadIcon className="size-4" />
        Cetak / Simpan PDF
      </button>
    </div>
  );
}
