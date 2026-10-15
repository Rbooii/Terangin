import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { getUserChatContext } from "@/lib/chat/context";
import { buildChatSystemPrompt } from "@/lib/chat/prompt";
import { extractMessageText, rowToUIMessage } from "@/lib/chat/messages";
import { sanitizeChatText } from "@/lib/chat/text";

export const maxDuration = 60;

const HISTORY_LIMIT = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  let incomingMessages: UIMessage[];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    incomingMessages = body.messages ?? [];
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const lastMessage = incomingMessages[incomingMessages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return new Response("Bad request", { status: 400 });
  }
  const userText = extractMessageText(lastMessage).slice(0, 2000);
  if (!userText) {
    return new Response("Bad request", { status: 400 });
  }

  let [chatSession] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.startedAt))
    .limit(1);

  if (!chatSession) {
    [chatSession] = await db
      .insert(chatSessions)
      .values({ userId })
      .returning();
  }

  await db.insert(chatMessages).values({
    sessionId: chatSession.id,
    senderType: "USER",
    content: userText,
  });

  const recentRows = await db
    .select({
      id: chatMessages.id,
      senderType: chatMessages.senderType,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, chatSession.id))
    .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
    .limit(HISTORY_LIMIT);

  const history: UIMessage[] = recentRows
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(rowToUIMessage);

  let systemPrompt: string;
  try {
    const userContext = await getUserChatContext(userId);
    systemPrompt = buildChatSystemPrompt(userContext);
  } catch (error) {
    console.error("[chat] gagal menyiapkan konteks:", error);
    return new Response("Internal error", { status: 500 });
  }

  const result = streamText({
    model: groq("openai/gpt-oss-120b"),
    system: systemPrompt,
    messages: await convertToModelMessages(history),
    temperature: 0.7,
    providerOptions: {
      groq: { reasoningEffort: "high" },
    },
  });

  const sessionId = chatSession.id;

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: history,
      onFinish: async ({ messages: finalMessages }) => {
        const assistant = [...finalMessages]
          .reverse()
          .find((message) => message.role === "assistant");
        const assistantText = assistant
          ? sanitizeChatText(extractMessageText(assistant))
          : "";
        if (!assistantText) return;
        try {
          await db.insert(chatMessages).values({
            sessionId,
            senderType: "AI",
            content: assistantText,
          });
        } catch (error) {
          console.error("[chat] gagal menyimpan balasan:", error);
        }
      },
    }),
  });
}
