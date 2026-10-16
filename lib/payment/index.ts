export const PRICE_IDR = 15_000;
export const SESSION_DESCRIPTION = "Sesi analisis jurusan";
export const QR_TTL_MINUTES = 15;
export const CHAT_ACCESS_DAYS = 5;

export type TransactionStatusView = "PENDING" | "PAID" | "EXPIRED";

export type PaymentView = {
  id: string;
  reference: string;
  amount: number;
  description: string;
  qrisPayload: string;
  createdAt: string;
  expiresAt: string | null;
};

export type TransactionView = PaymentView & {
  method: string;
  status: TransactionStatusView;
  paidAt: string | null;
  usedAt: string | null;
};

export const STATUS_LABELS: Record<TransactionStatusView, string> = {
  PENDING: "Menunggu pembayaran",
  PAID: "Lunas",
  EXPIRED: "Kedaluwarsa",
};

const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeReference(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  }
  return `TRX-${code}`;
}

export function buildQrisPayload(reference: string): string {
  const ref = reference.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return `00020101021226610014ID.CO.QRIS.WWW011893600911000${ref}0215ID1024000000${ref}5204581253033605802ID5910TERANG.IN6007JAKARTA6105401156304${ref.slice(0, 4)}`;
}

export function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDateTimeId(value: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateId(value: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
    new Date(value),
  );
}
