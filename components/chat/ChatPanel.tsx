"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { TeraMark } from "@/components/landing/TeraMark";
import { ArrowUp } from "@/components/landing/icons";
import { sanitizeChatText } from "@/lib/chat/text";

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mb-2.5 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2.5 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-zinc-200 underline underline-offset-4"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1 py-0.5 text-[12px]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2.5 overflow-x-auto rounded-lg bg-black/40 p-3 text-[12px] last:mb-0">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <p className="mb-2 font-semibold text-white">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="mb-2 font-semibold text-white">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="mb-2 font-semibold text-white">{children}</p>
  ),
};

function messageText(message: UIMessage) {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => {
      return part.type === "text";
    })
    .map((part) => part.text)
    .join("");
}

function TypingDots() {
  return (
    <div className="flex items-center gap-3">
      <TeraMark className="size-7 shrink-0" />
      <div className="flex items-center gap-1.5 py-1">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="size-1.5 rounded-full bg-zinc-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.18,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatPanel({
  initialMessages,
  suggestions,
}: {
  initialMessages: UIMessage[];
  suggestions: string[];
}) {
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const isBusy = status === "submitted" || status === "streaming";
  const waitingFirstToken = status === "submitted";

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: status === "streaming" ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, status]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    void sendMessage({ text: trimmed.slice(0, 2000) });
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }

  return (
    <div className="flex flex-col">
      {messages.length === 0 && !isBusy ? (
        <div className="flex flex-col items-center py-14 text-center sm:py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <TeraMark className="size-16" />
          </motion.div>
          <h2 className="mt-6 text-xl font-medium tracking-tight text-white">
            Halo, aku Tera
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-zinc-400">
            Tanya apa aja soal jurusan, kampus, biaya kuliah, sampai rencana
            belajarmu. Aku jawab pakai data profilmu.
          </p>
          {error && (
            <p className="mt-5 text-[12px] text-red-400">
              Koneksi ke Tera terputus. Coba kirim ulang ya.
            </p>
          )}
          <div className="mt-8 grid w-full max-w-md gap-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.25 }}
                onClick={() => submit(suggestion)}
                className="rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-left text-[13px] text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 pb-2">
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const raw = messageText(message);
              const text =
                message.role === "assistant" ? sanitizeChatText(raw) : raw;
              if (!text && message.role === "assistant") return null;
              if (message.role === "user") {
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex justify-end"
                  >
                    <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-white px-4 py-2.5 text-[13px] leading-relaxed text-black">
                      {text}
                    </div>
                  </motion.div>
                );
              }
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex items-start gap-3"
                >
                  <TeraMark className="mt-0.5 size-7 shrink-0" />
                  <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-zinc-300">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {text}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {waitingFirstToken && <TypingDots />}

          {status === "error" && (
            <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3">
              <span className="text-[12px] text-red-300">
                Tera gagal membalas. Coba lagi ya.
              </span>
              <button
                type="button"
                onClick={() => void regenerate()}
                className="ml-auto h-8 shrink-0 rounded-full border border-red-400/30 px-3 text-[12px] text-red-200 transition-colors hover:bg-red-400/10"
              >
                Coba lagi
              </button>
            </div>
          )}
        </div>
      )}

      <div ref={endRef} />

      <div className="sticky bottom-0 z-10 -mx-5 mt-4 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent px-5 pb-3 pt-5 md:-mx-10 md:px-10">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#161616] p-2 pl-4 transition-colors focus-within:border-white/25"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              const el = event.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Pesan Tera"
            aria-label="Pesan untuk Tera"
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-[13px] text-white outline-none placeholder:text-zinc-600"
          />
          {isBusy ? (
            <button
              type="button"
              onClick={() => void stop()}
              aria-label="Hentikan balasan"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black transition-colors hover:bg-zinc-200"
            >
              <span className="size-2.5 rounded-[3px] bg-black" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Kirim pesan"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </form>
        <p className="mt-2 text-center text-[10px] text-zinc-600">
          Tera bisa keliru. Cek info resmi kampus sebelum memutuskan ya.
        </p>
      </div>
    </div>
  );
}
