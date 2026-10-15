"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { TeraMark } from "@/components/landing/TeraMark";
import {
  ArrowUp,
  CheckIcon,
  ChevronDown,
  CopyIcon,
  TrashIcon,
} from "@/components/landing/icons";
import { resetChatAction } from "@/lib/actions/chat";

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
  blockquote: ({ children }) => (
    <blockquote className="mb-2.5 border-l-2 border-white/15 pl-3 text-zinc-400 last:mb-0">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-2.5 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-[12px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/10 px-3 py-1.5 text-left font-medium text-zinc-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/6 px-3 py-1.5 align-top text-zinc-300">
      {children}
    </td>
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

function getScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
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

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => setCopied(false), 1600);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? "Tersalin" : "Salin balasan"}
      className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

function ResetChatControl({
  onReset,
}: {
  onReset: () => Promise<boolean>;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  function clearTimer() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => clearTimer, []);

  function arm() {
    setFailed(false);
    setConfirming(true);
    clearTimer();
    timeoutRef.current = window.setTimeout(() => setConfirming(false), 5000);
  }

  function disarm() {
    if (pending) {
      return;
    }
    clearTimer();
    setConfirming(false);
    setFailed(false);
  }

  async function confirm() {
    clearTimer();
    setPending(true);
    const ok = await onReset();
    setPending(false);
    if (ok) {
      setConfirming(false);
      setFailed(false);
      return;
    }
    setFailed(true);
    timeoutRef.current = window.setTimeout(() => {
      setConfirming(false);
      setFailed(false);
    }, 3000);
  }

  return (
    <div className="flex items-center">
      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="flex items-center rounded-full border border-red-400/25 bg-red-400/5 py-1 pl-3 pr-1"
          >
            <span className="mr-1.5 text-[11px] text-red-300">
              {failed ? "Gagal. Coba lagi?" : "Hapus semua obrolan?"}
            </span>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={pending}
              className="h-6 rounded-full px-2 text-[11px] font-medium text-red-200 transition-colors hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Menghapus..." : "Hapus"}
            </button>
            <button
              type="button"
              onClick={disarm}
              disabled={pending}
              className="h-6 rounded-full px-2 text-[11px] text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="idle"
            type="button"
            onClick={arm}
            aria-label="Hapus semua obrolan"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="grid size-8 place-items-center rounded-full text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <TrashIcon className="size-4" />
          </motion.button>
        )}
      </AnimatePresence>
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
  const reduceMotion = useReducedMotion() ?? false;
  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    clearError,
    regenerate,
    setMessages,
  } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const isBusy = status === "submitted" || status === "streaming";
  const waitingFirstToken = status === "submitted";
  const lastAssistantId = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.id;

  function scrollToBottom(behavior: ScrollBehavior) {
    const sentinel = endRef.current;
    if (!sentinel) {
      return;
    }
    const scroller = getScrollParent(sentinel);
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior,
      });
    }
  }

  useEffect(() => {
    scrollToBottom("instant");
  }, []);

  useEffect(() => {
    const sentinel = endRef.current;
    if (!sentinel) {
      return;
    }
    const scroller = getScrollParent(sentinel);
    const target: HTMLElement | Window = scroller ?? window;
    const compute = () => {
      const distance = scroller
        ? scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight
        : document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight;
      setAtBottom(distance < 140);
    };
    target.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      target.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  useEffect(() => {
    if (!atBottom) {
      return;
    }
    scrollToBottom(status === "streaming" ? "instant" : "smooth");
  }, [messages, status, atBottom]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) {
      return;
    }
    setAtBottom(true);
    void sendMessage({ text: trimmed.slice(0, 2000) });
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }

  async function handleReset() {
    if (isBusy) {
      await stop();
    }
    const result = await resetChatAction();
    if (!result.ok) {
      return false;
    }
    clearError();
    setMessages([]);
    setInput("");
    setAtBottom(true);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    return true;
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-20 -mx-5 mb-5 flex items-center gap-3 border-b border-white/6 bg-[#050505]/85 px-5 py-3 backdrop-blur md:-mx-10 md:px-10">
        <TeraMark className="size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-medium text-white">Tera</h1>
          <p className="truncate text-[11px] text-zinc-500">
            Konselor jurusanmu, jawab pakai data profilmu
          </p>
        </div>
        <ResetChatControl onReset={handleReset} />
      </header>

      {messages.length === 0 && !isBusy ? (
        <div className="flex flex-col items-center py-14 text-center sm:py-20">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 260, damping: 22 }
            }
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <TeraMark className="size-16" />
            </motion.div>
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
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
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
              const text = messageText(message);
              if (!text && message.role === "assistant") return null;
              if (message.role === "user") {
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22 }}
                    className="flex justify-end"
                  >
                    <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-white px-4 py-2.5 text-[13px] leading-relaxed text-black">
                      {text}
                    </div>
                  </motion.div>
                );
              }
              const streaming =
                status === "streaming" && message.id === lastAssistantId;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22 }}
                  className="group"
                >
                  <div className="flex items-start gap-3">
                    <TeraMark className="mt-0.5 size-7 shrink-0" />
                    <div
                      className={`min-w-0 flex-1 text-[13px] leading-relaxed text-zinc-300 ${
                        streaming ? "chat-streaming" : ""
                      }`}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {!streaming && (
                    <div className="mt-0.5 flex pl-10 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                      <CopyMessageButton text={text} />
                    </div>
                  )}
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
        <AnimatePresence>
          {!atBottom && (
            <motion.button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              aria-label="Ke pesan terbaru"
              initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              style={{ x: "-50%" }}
              className="absolute -top-11 left-1/2 grid size-8 place-items-center rounded-full border border-white/10 bg-[#1b1b1b]/95 text-zinc-300 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)] backdrop-blur transition-colors hover:border-white/25 hover:text-white"
            >
              <ChevronDown className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#161616] p-2 pl-4 transition-[border-color,box-shadow] focus-within:border-white/25 focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.04)]"
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
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-[13px] text-white outline-none transition-[height] duration-150 placeholder:text-zinc-600"
          />
          {isBusy ? (
            <motion.button
              type="button"
              onClick={() => void stop()}
              whileTap={reduceMotion ? undefined : { scale: 0.92 }}
              aria-label="Hentikan balasan"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black transition-colors hover:bg-zinc-200"
            >
              <span className="size-2.5 rounded-[3px] bg-black" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={!input.trim()}
              whileTap={reduceMotion ? undefined : { scale: 0.92 }}
              aria-label="Kirim pesan"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </motion.button>
          )}
        </form>
        <p className="mt-2 text-center text-[10px] text-zinc-600">
          Tera bisa keliru. Cek info resmi kampus sebelum memutuskan ya.
        </p>
      </div>
    </div>
  );
}
