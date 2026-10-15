"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";

export type ResetChatResult = { ok: true } | { ok: false; error: string };

export async function resetChatAction(): Promise<ResetChatResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    await db
      .delete(chatSessions)
      .where(eq(chatSessions.userId, session.user.id));
    return { ok: true };
  } catch (error) {
    console.error("[chat] gagal reset obrolan:", error);
    return { ok: false, error: "Gagal menghapus obrolan. Coba lagi ya." };
  }
}
