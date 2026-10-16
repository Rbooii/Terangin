"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import {
  buildQrisPayload,
  makeReference,
  PRICE_IDR,
  QR_TTL_MINUTES,
  SESSION_DESCRIPTION,
  type PaymentView,
} from "@/lib/payment";
import {
  expireStaleTransactions,
  getPendingPayment,
  toPaymentView,
} from "@/lib/payment/queries";
import { paymentConfirmSchema } from "@/lib/validation";

export type CreateTransactionResult =
  | { ok: true; transaction: PaymentView }
  | { ok: false; error: string };

export type ConfirmPaymentResult = { ok: true } | { ok: false; error: string };

export async function createQrisTransactionAction(): Promise<CreateTransactionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  await expireStaleTransactions(userId);
  const existing = await getPendingPayment(userId);
  if (existing) {
    return { ok: true, transaction: existing };
  }

  const reference = makeReference();
  const expiresAt = new Date(Date.now() + QR_TTL_MINUTES * 60_000);
  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      reference,
      amount: PRICE_IDR,
      description: SESSION_DESCRIPTION,
      method: "QRIS",
      status: "PENDING",
      qrisPayload: buildQrisPayload(reference),
      expiresAt,
    })
    .returning();

  if (!row) {
    return {
      ok: false,
      error: "Gagal membuat kode pembayaran. Coba lagi ya.",
    };
  }
  return { ok: true, transaction: toPaymentView(row) };
}

export async function confirmPaymentAction(
  transactionId: string,
): Promise<ConfirmPaymentResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = paymentConfirmSchema.safeParse({ transactionId });
  if (!parsed.success) {
    return { ok: false, error: "Kode pembayaran tidak valid." };
  }

  const [row] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, parsed.data.transactionId),
        eq(transactions.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!row) {
    return { ok: false, error: "Transaksi tidak ditemukan." };
  }
  if (row.status === "PAID") {
    return { ok: true };
  }
  if (row.status !== "PENDING") {
    return { ok: false, error: "Kode pembayaran sudah tidak berlaku." };
  }
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    await db
      .update(transactions)
      .set({ status: "EXPIRED" })
      .where(eq(transactions.id, row.id));
    return {
      ok: false,
      error: "Kode pembayaran sudah kedaluwarsa. Buat kode baru ya.",
    };
  }

  await db
    .update(transactions)
    .set({ status: "PAID", paidAt: new Date() })
    .where(eq(transactions.id, row.id));

  return { ok: true };
}
