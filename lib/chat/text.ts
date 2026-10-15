// Merapikan teks balasan AI: mengganti karakter tipografis non-standar
// (em dash, en dash, non-breaking hyphen/space) dengan padanan ASCII,
// sesuai kebijakan anti AI-slop di ui.md.
export function sanitizeChatText(text: string): string {
  return text
    .replace(/\s*\u2014\s*/g, ", ")
    .replace(/\s*\u2013\s*/g, "-")
    .replace(/\u2011/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim();
}
