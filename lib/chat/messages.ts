import type { UIMessage } from "ai";

type ChatMessageRow = {
  id: string;
  senderType: "USER" | "AI";
  content: string;
};

export function rowToUIMessage(row: ChatMessageRow): UIMessage {
  return {
    id: row.id,
    role: row.senderType === "USER" ? "user" : "assistant",
    parts: [{ type: "text", text: row.content }],
  };
}

export function extractMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => {
      return part.type === "text";
    })
    .map((part) => part.text)
    .join("")
    .trim();
}
