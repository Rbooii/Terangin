"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { deleteAccountSchema } from "@/lib/validation";

export type DeleteAccountState = { error?: string } | undefined;

export async function deleteAccountAction(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = deleteAccountSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Isi password dan ketik HAPUS untuk konfirmasi.",
    };
  }

  if (parsed.data.confirmation !== "HAPUS") {
    return { error: "Ketik HAPUS dengan huruf kapital semua ya." };
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    redirect("/login");
  }

  const passwordValid = await compare(parsed.data.password, user.passwordHash);
  if (!passwordValid) {
    return { error: "Password salah. Coba lagi." };
  }

  await db.delete(users).where(eq(users.id, session.user.id));

  await signOut({ redirectTo: "/" });
  return undefined;
}
