import { and, asc, desc, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import {
  CHAT_ACCESS_DAYS,
  type PaymentView,
  type TransactionView,
} from "@/lib/payment";

const DAY_MS = 24 * 60 * 60 * 1000;

type TransactionRow = typeof transactions.$inferSelect;

export function toPaymentView(row: TransactionRow): PaymentView {
  return {
    id: row.id,
    reference: row.reference,
    amount: row.amount,
    description: row.description,
    qrisPayload: row.qrisPayload,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  };
}

export function toTransactionView(row: TransactionRow): TransactionView {
  return {
    ...toPaymentView(row),
    method: row.method,
    status: row.status,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    usedAt: row.usedAt ? row.usedAt.toISOString() : null,
  };
}

export async function expireStaleTransactions(userId: string): Promise<void> {
  await db
    .update(transactions)
    .set({ status: "EXPIRED" })
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.status, "PENDING"),
        lt(transactions.expiresAt, new Date()),
      ),
    );
}

export async function getPendingPayment(
  userId: string,
): Promise<PaymentView | null> {
  const [row] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.status, "PENDING"),
        gt(transactions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(transactions.createdAt))
    .limit(1);
  return row ? toPaymentView(row) : null;
}

export async function getAvailableCreditId(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.status, "PAID"),
        isNull(transactions.usedAt),
      ),
    )
    .orderBy(asc(transactions.paidAt))
    .limit(1);
  return row?.id ?? null;
}

export async function listTransactionViews(
  userId: string,
  limit = 20,
): Promise<TransactionView[]> {
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
  return rows.map(toTransactionView);
}

export async function getChatAccess(
  userId: string,
): Promise<{ active: boolean; endsAt: Date | null }> {
  const [row] = await db
    .select({ paidAt: transactions.paidAt })
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), eq(transactions.status, "PAID")),
    )
    .orderBy(desc(transactions.paidAt))
    .limit(1);
  if (!row?.paidAt) {
    return { active: false, endsAt: null };
  }
  const endsAt = new Date(row.paidAt.getTime() + CHAT_ACCESS_DAYS * DAY_MS);
  return { active: endsAt.getTime() > Date.now(), endsAt };
}
