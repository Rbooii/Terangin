import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  analysisRecommendations,
  analysisResults,
  chatMessages,
  chatSessions,
  majors,
} from "@/db/schema";
import AppShell from "@/components/app/AppShell";
import ChatPanel from "@/components/chat/ChatPanel";
import { TeraMark } from "@/components/landing/TeraMark";
import { rowToUIMessage } from "@/lib/chat/messages";
import { getJourneySteps, getUserProfile } from "@/lib/onboarding";
import { CHAT_ACCESS_DAYS, formatDateId } from "@/lib/payment";
import { getChatAccess } from "@/lib/payment/queries";

export const instant = false;

export const metadata: Metadata = {
  title: "Chat Tera: Terang.in",
  description: "Ngobrol sama Tera soal jurusan, kampus, dan rencanamu.",
};

export default async function ChatPage() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    redirect("/login");
  }
  if (!profile.onboardingCompletedAt) {
    redirect("/onboarding");
  }
  if (!profile.assessmentCompletedAt) {
    redirect("/assessment");
  }
  if (!profile.gradesCompletedAt) {
    redirect("/nilai");
  }

  const [analysisRow] = await db
    .select({ id: analysisResults.id })
    .from(analysisResults)
    .where(eq(analysisResults.userId, session.user.id))
    .limit(1);

  if (!analysisRow) {
    redirect("/analisis");
  }

  const [steps, access] = await Promise.all([
    getJourneySteps(session.user.id),
    getChatAccess(session.user.id),
  ]);

  if (!access.active) {
    return (
      <AppShell
        user={{ name: profile.fullName, id: session.user.id }}
        steps={steps}
      >
        <div className="rounded-2xl border border-overlay/8 bg-surface px-7 py-10 sm:px-10 sm:py-12">
          <TeraMark className="size-12" />
          <h2 className="mt-6 text-xl font-medium tracking-tight text-fg sm:text-2xl">
            Akses chat kamu udah berakhir
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
            Akses chat Tera berlaku {CHAT_ACCESS_DAYS} hari sejak pembayaran
            sesi terakhir
            {access.endsAt
              ? `, dan akses terakhirmu berakhir ${formatDateId(access.endsAt)}`
              : ""}
            . Jalankan analisis ulang buat membuka lagi, ya. Obrolan lamamu
            tetap tersimpan.
          </p>
          <Link
            href="/analisis"
            className="mt-6 flex h-11 w-fit items-center rounded-full bg-primary px-6 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
          >
            Buka halaman analisis
          </Link>
        </div>
      </AppShell>
    );
  }

  const [topRecommendation, recentRows] = await Promise.all([
    db
      .select({ majorName: majors.name })
      .from(analysisRecommendations)
      .innerJoin(majors, eq(analysisRecommendations.majorId, majors.id))
      .where(eq(analysisRecommendations.userId, session.user.id))
      .orderBy(asc(analysisRecommendations.rankOrder))
      .limit(1),
    db
      .select({
        id: chatMessages.id,
        senderType: chatMessages.senderType,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(eq(chatSessions.userId, session.user.id))
      .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
      .limit(50),
  ]);

  const initialMessages = recentRows
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(rowToUIMessage);

  const topMajorName = topRecommendation[0]?.majorName;
  const suggestions = [
    topMajorName
      ? `Kenapa aku cocok di ${topMajorName}?`
      : "Jurusan apa yang paling cocok buat aku?",
    "Beda Informatika dan Sistem Informasi apa?",
    "Berapa biaya kuliah dan beasiswanya?",
  ];

  return (
    <AppShell user={{ name: profile.fullName, id: session.user.id }} steps={steps}>
      <ChatPanel initialMessages={initialMessages} suggestions={suggestions} />
    </AppShell>
  );
}
