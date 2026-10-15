import type { Metadata } from "next";
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
import { rowToUIMessage } from "@/lib/chat/messages";
import { getJourneySteps, getUserProfile } from "@/lib/onboarding";

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

  const [steps, topRecommendation, recentRows] = await Promise.all([
    getJourneySteps(session.user.id),
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
    <AppShell user={{ name: profile.fullName }} steps={steps}>
      <ChatPanel initialMessages={initialMessages} suggestions={suggestions} />
    </AppShell>
  );
}
