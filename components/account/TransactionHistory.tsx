"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, DownloadIcon } from "@/components/landing/icons";
import {
  formatDateId,
  formatDateTimeId,
  formatRupiah,
  STATUS_LABELS,
  type TransactionStatusView,
  type TransactionView,
} from "@/lib/payment";

const STATUS_TONES: Record<TransactionStatusView, string> = {
  PAID: "bg-success/10 text-success",
  PENDING: "border border-warning/30 text-warning",
  EXPIRED: "border border-overlay/10 text-fg-faint",
};

function Receipt({ transaction }: { transaction: TransactionView }) {
  const creditLabel =
    transaction.status !== "PAID"
      ? "-"
      : transaction.usedAt
        ? `Dipakai ${formatDateTimeId(transaction.usedAt)}`
        : "Belum dipakai";

  return (
    <div className="receipt-print print-exact rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900">
      <div className="flex items-start justify-between gap-4 border-b-2 border-zinc-900 pb-4">
        <div>
          <p className="text-[15px] font-semibold tracking-tight">Terang.in</p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Struk pembayaran sesi analisis
          </p>
        </div>
        <div className="text-right text-[11px] text-zinc-600">
          <p className="tabular-nums">{transaction.reference}</p>
          <p className="mt-0.5">{formatDateTimeId(transaction.createdAt)}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
        <div>
          <dt className="text-zinc-500">Status</dt>
          <dd className="mt-0.5 font-medium">
            {STATUS_LABELS[transaction.status]}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Metode</dt>
          <dd className="mt-0.5 font-medium">
            {transaction.method} (mockup demo)
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Dibayar</dt>
          <dd className="mt-0.5">
            {transaction.paidAt ? formatDateTimeId(transaction.paidAt) : "-"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Kredit sesi</dt>
          <dd className="mt-0.5">{creditLabel}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-zinc-200 pt-4">
        <div className="flex items-baseline justify-between gap-4 text-[12px]">
          <span>
            {transaction.description} (1 sesi)
          </span>
          <span className="shrink-0 tabular-nums">
            {formatRupiah(transaction.amount)}
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-zinc-900 pt-2 text-[13px] font-semibold">
          <span>Total</span>
          <span className="tabular-nums">
            {formatRupiah(transaction.amount)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 print:hidden">
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Pembayaran simulasi (mockup). Tidak ada uang yang benar-benar
          berpindah.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-4 text-[12px] text-white transition-colors hover:bg-zinc-700"
        >
          <DownloadIcon className="size-3.5" />
          Cetak / Simpan PDF
        </button>
      </div>
    </div>
  );
}

export default function TransactionHistory({
  transactions,
  chatActive,
  chatEndsAt,
}: {
  transactions: TransactionView[];
  chatActive: boolean;
  chatEndsAt: string | null;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-overlay/8 bg-surface p-6 sm:p-7">
      <h2 className="text-[15px] font-medium text-fg">Transaksi</h2>
      <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-fg-muted">
        Riwayat pembayaran sesi analisis dan struknya.{" "}
        {chatActive && chatEndsAt
          ? `Akses chat Tera aktif sampai ${formatDateId(chatEndsAt)}.`
          : "Akses chat tidak aktif. Jalankan analisis ulang buat mengaktifkan lagi."}
      </p>

      {transactions.length === 0 ? (
        <p className="mt-5 text-[12px] leading-relaxed text-fg-faint">
          Belum ada transaksi. Kode pembayaran dibuat otomatis saat kamu
          menjalankan analisis di halaman Hasil Analisis.
        </p>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {transactions.map((transaction) => {
            const open = openId === transaction.id;
            return (
              <li
                key={transaction.id}
                className="rounded-xl border border-overlay/8 bg-sunken"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : transaction.id)}
                  aria-expanded={open}
                  aria-label={`Lihat struk ${transaction.reference}`}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-fg-soft">
                      {transaction.reference}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-fg-faint">
                      {formatDateTimeId(transaction.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] tabular-nums text-fg">
                    {formatRupiah(transaction.amount)}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] ${STATUS_TONES[transaction.status]}`}
                  >
                    {STATUS_LABELS[transaction.status]}
                  </span>
                  <ChevronDown
                    className={`size-3.5 shrink-0 text-fg-faint transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={
                        reduceMotion
                          ? undefined
                          : { height: 0, opacity: 0 }
                      }
                      transition={{ duration: reduceMotion ? 0 : 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <Receipt transaction={transaction} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
