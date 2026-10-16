"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckIcon } from "@/components/landing/icons";
import { TeraMark } from "@/components/landing/TeraMark";
import {
  confirmPaymentAction,
  createQrisTransactionAction,
} from "@/lib/actions/payment";
import {
  formatCountdown,
  formatRupiah,
  type PaymentView,
} from "@/lib/payment";
import QrisPlaceholder from "./QrisPlaceholder";

type Phase = "preparing" | "qr" | "verifying" | "paid";

export default function QrisPaymentFlow({
  initial,
  onPaid,
  onClose,
}: {
  initial: PaymentView | null;
  onPaid: () => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [transaction, setTransaction] = useState<PaymentView | null>(initial);
  const [phase, setPhase] = useState<Phase>(initial ? "qr" : "preparing");
  const [error, setError] = useState<string>();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    void (async () => {
      const result = await createQrisTransactionAction();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setPhase("qr");
        return;
      }
      setTransaction(result.transaction);
      setPhase("qr");
    })();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  useEffect(() => {
    if (phase !== "qr" || !transaction?.expiresAt) return;
    const expiresAt = new Date(transaction.expiresAt).getTime();
    const interval = window.setInterval(() => {
      setSecondsLeft(
        Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
      );
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, transaction]);

  const expired =
    phase === "qr" && secondsLeft !== null && secondsLeft <= 0;

  async function regenerate() {
    setPhase("preparing");
    setError(undefined);
    setSecondsLeft(null);
    const result = await createQrisTransactionAction();
    if (!result.ok) {
      setError(result.error);
      setPhase("qr");
      return;
    }
    setTransaction(result.transaction);
    setPhase("qr");
  }

  async function confirm() {
    if (!transaction || phase !== "qr" || expired) return;
    setPhase("verifying");
    setError(undefined);
    if (!reduceMotion) {
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
    }
    const result = await confirmPaymentAction(transaction.id);
    if (!result.ok) {
      setError(result.error);
      if (result.error.includes("kedaluwarsa")) {
        setSecondsLeft(0);
      }
      setPhase("qr");
      return;
    }
    setPhase("paid");
    window.setTimeout(
      () => onPaid(),
      reduceMotion ? 0 : 700,
    );
  }

  if (phase === "preparing") {
    return (
      <div className="rounded-2xl border border-overlay/8 bg-surface px-7 py-10 sm:px-10 sm:py-12">
        <motion.div
          animate={reduceMotion ? undefined : { opacity: [1, 0.6, 1] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 1.8, repeat: Infinity }
          }
          className="w-fit"
        >
          <TeraMark className="size-12" />
        </motion.div>
        <h2 className="mt-6 text-xl font-medium tracking-tight text-fg sm:text-2xl">
          Menyiapkan kode pembayaran
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
          Sebentar ya, Tera lagi bikin kode QRIS buat sesi analisismu.
        </p>
      </div>
    );
  }

  if (phase === "verifying" || phase === "paid") {
    const success = phase === "paid";
    return (
      <div className="rounded-2xl border border-overlay/8 bg-surface px-7 py-10 sm:px-10 sm:py-12">
        <span
          className={
            success
              ? "grid size-12 place-items-center rounded-full bg-success/15 text-success"
              : "grid size-12 place-items-center rounded-full border border-overlay/10"
          }
        >
          {success ? (
            <CheckIcon className="size-5" />
          ) : (
            <motion.span
              animate={reduceMotion ? undefined : { scale: [1, 0.5, 1] }}
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 1.2, repeat: Infinity }
              }
              className="size-2.5 rounded-full bg-primary"
            />
          )}
        </span>
        <h2 className="mt-6 text-xl font-medium tracking-tight text-fg sm:text-2xl">
          {success ? "Pembayaran diterima" : "Memverifikasi pembayaran"}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
          {success
            ? "Kredit sesi kamu aktif. Tera mulai menganalisis sekarang."
            : "Lagi memastikan pembayaranmu masuk. Jangan tutup halaman ini ya."}
        </p>
      </div>
    );
  }

  const amount = transaction?.amount ?? 0;
  const countdown =
    secondsLeft === null ? "--:--" : formatCountdown(secondsLeft);
  const countdownTone =
    expired || (secondsLeft !== null && secondsLeft <= 60)
      ? "border-warning/30 text-warning"
      : "border-overlay/10 text-fg";

  return (
    <div className="rounded-2xl border border-overlay/8 bg-surface px-7 py-10 sm:px-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium tracking-tight text-fg sm:text-2xl">
            Pembayaran sesi analisis
          </h2>
          <p className="mt-1 text-[12px] text-fg-faint">
            Scan QRIS pakai aplikasi bank atau e-wallet kamu.
          </p>
        </div>
        <span
          className={`flex items-baseline gap-1 rounded-xl border px-3 py-1.5 tabular-nums ${countdownTone}`}
        >
          <span className="text-lg font-semibold leading-none">
            {expired ? "00:00" : countdown}
          </span>
          <span className="text-[11px] opacity-70">
            {expired ? "kedaluwarsa" : "sisa waktu"}
          </span>
        </span>
      </div>

      <div className="mt-7 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
        <div
          className={
            expired
              ? "relative w-fit rounded-xl border border-overlay/10 bg-white p-4 opacity-40"
              : "relative w-fit rounded-xl border border-overlay/10 bg-white p-4"
          }
        >
          <p className="text-center text-[11px] font-semibold tracking-wide text-black">
            QRIS
          </p>
          <QrisPlaceholder
            payload={transaction?.qrisPayload ?? "terangin"}
            className="mt-1.5 size-44 sm:size-48"
          />
          <div className="mt-2 text-center">
            <p className="text-[12px] font-medium text-black">TERANG.IN</p>
            <p className="mt-0.5 text-[10px] tabular-nums text-zinc-500">
              NMID ID102400000000{transaction?.reference.slice(4, 8) ?? ""}
            </p>
          </div>
          {expired && (
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-black/70 py-2 text-center text-[11px] text-white">
              Kode kedaluwarsa
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight text-fg">
            {formatRupiah(amount)}
          </p>
          <dl className="mt-4 space-y-2.5 text-[12px]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-fg-faint">Untuk</dt>
              <dd className="text-right text-fg-secondary">
                {transaction?.description ?? "Sesi analisis jurusan"} (1 sesi)
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-fg-faint">Metode</dt>
              <dd className="text-right text-fg-secondary">QRIS (demo)</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-fg-faint">Referensi</dt>
              <dd className="text-right tabular-nums text-fg-secondary">
                {transaction?.reference ?? "-"}
              </dd>
            </div>
          </dl>

          {error && <p className="mt-4 text-[12px] text-danger">{error}</p>}

          <div className="mt-6 flex flex-wrap gap-2.5">
            {expired ? (
              <button
                type="button"
                onClick={() => void regenerate()}
                className="h-11 rounded-full bg-primary px-6 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
              >
                Buat kode baru
              </button>
            ) : (
              <button
                type="button"
                disabled={!transaction}
                onClick={() => void confirm()}
                className="h-11 rounded-full bg-primary px-6 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                Saya sudah bayar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full border border-overlay/10 px-5 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
            >
              Batal
            </button>
          </div>

          <p className="mt-5 max-w-sm text-[11px] leading-relaxed text-fg-faintest">
            Mode demo: pembayaran ini simulasi buat memperlihatkan alurnya.
            Tidak ada uang yang benar-benar berpindah.
          </p>
        </div>
      </div>
    </div>
  );
}
