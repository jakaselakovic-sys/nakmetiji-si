"use client";

// =============================================================================
// NaKmetiji.si — JozeSidebar
// Compact inline concierge on the farm profile page.
// Uses /api/oracle with farm_slug so Jože knows exactly which farm he's on.
// =============================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, ChevronDown, ChevronUp } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// ---------------------------------------------------------------------------
// Tiny markdown renderer (bold + links — no dep)
// ---------------------------------------------------------------------------

function isSafeUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const { protocol, hostname } = new URL(url);
    return (protocol === "https:" || protocol === "http:") &&
      (hostname === "nakmetiji.si" || hostname.endsWith(".nakmetiji.si"));
  } catch { return false; }
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) return <strong key={i} className="font-semibold text-forest-900">{bold[1]}</strong>;
    const italic = part.match(/^\*(.+)\*$/);
    if (italic) return <em key={i} className="italic">{italic[1]}</em>;
    const link = part.match(/^\[(.+)\]\((.+)\)$/);
    if (link && isSafeUrl(link[2]))
      return <a key={i} href={link[2]} className="underline decoration-dotted text-forest-700 hover:text-amber-700 transition-colors">{link[1]}</a>;
    return <span key={i}>{part}</span>;
  });
}

function MsgText({ content }: { content: string }) {
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {content.split("\n").map((line, i) => {
        const heading = line.match(/^##\s+(.+)$/);
        if (heading) return <p key={i} className="font-bold text-forest-900 mt-1">{renderInline(heading[1])}</p>;
        if (!line.trim()) return null;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seed suggestions
// ---------------------------------------------------------------------------

const SEEDS = [
  "Kaj je posebnega pri tej kmetiji?",
  "Kaj početi v okolici?",
  "Kako pride do vas?",
  "Kaj priporočate za kosilo?",
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface JozeSidebarProps {
  farmSlug: string;
  farmName: string;
  farmRegija: string;
}

export function JozeSidebar({ farmSlug, farmName, farmRegija }: JozeSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setMessages([{
        role: "assistant",
        content: `Bog žegnaj! Sem **Jože**, vaš vodnik po kmetiji **${farmName}**.\n\nKaj bi radi vedeli?`,
      }]);
    }
  }, [isOpen, hasGreeted, farmName]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timeoutId = setTimeout(() => ctrl.abort(), 30_000);

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "", isStreaming: true }]);
    setInput("");
    setIsLoading(true);

    let accumulated = "";

    try {
      const history = messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locale: "sl",
          history,
          farm_slug: farmSlug,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream unavailable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;
            if (currentEvent === null) {
              try {
                const parsed = JSON.parse(raw) as { text?: string };
                if (parsed.text) {
                  accumulated += parsed.text;
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === "assistant") {
                      next[next.length - 1] = { ...last, content: accumulated, isStreaming: true };
                    }
                    return next;
                  });
                }
              } catch { /* non-JSON */ }
            }
          } else if (line === "") {
            currentEvent = null;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      accumulated = "Oprostite, prišlo je do napake. Poskusite znova.";
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          next[next.length - 1] = { ...last, content: accumulated, isStreaming: false };
        }
        return next;
      });
    }
  }, [isLoading, messages, farmSlug]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const userHasSpoken = messages.some((m) => m.role === "user");

  return (
    <div className="rounded-2xl bg-[#fdf8ee] border border-earth-200/60 shadow-sm overflow-hidden">
      {/* ── Toggle header ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-amber-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Jože avatar — minimal SVG */}
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-forest-700 overflow-hidden">
            <svg viewBox="0 0 64 64" width={36} height={36} aria-hidden="true">
              <ellipse cx="32" cy="36" rx="14" ry="15" fill="#f3d5b5" />
              <path d="M18 37 Q20 50 32 52 Q44 50 46 37 Q44 45 38 47 Q32 49 26 47 Q20 45 18 37 Z" fill="#e6e2dc" />
              <path d="M25 33 Q27 31 29 33" stroke="#2d2a24" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <path d="M35 33 Q37 31 39 33" stroke="#2d2a24" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <ellipse cx="32" cy="24" rx="22" ry="4.5" fill="#3f2b1a" />
              <path d="M22 24 Q22 14 32 13 Q42 14 42 24 Z" fill="#4b3420" />
            </svg>
            {/* Online dot */}
            <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-forest-900 leading-none">Vprašaj Jožeta</p>
            <p className="text-xs text-earth-500 mt-0.5">
              {isOpen ? `O kmetiji ${farmName}` : `Vse o kmetiji ${farmRegija}`}
            </p>
          </div>
        </div>
        <div className="text-earth-400">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* ── Chat panel ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="border-t border-earth-200/60">
              {/* Messages */}
              <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-forest-700 text-white rounded-br-md"
                          : "bg-white border border-earth-200/80 text-forest-900 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : msg.isStreaming && !msg.content ? (
                        <div className="flex gap-1 items-center py-0.5">
                          {[0, 1, 2].map((j) => (
                            <motion.span
                              key={j}
                              className="w-1.5 h-1.5 rounded-full bg-forest-600"
                              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                              transition={{ duration: 1, repeat: Infinity, delay: j * 0.15 }}
                            />
                          ))}
                        </div>
                      ) : (
                        <>
                          <MsgText content={msg.content} />
                          {msg.isStreaming && (
                            <motion.span
                              className="inline-block w-0.5 h-3.5 bg-forest-600 align-middle ml-0.5"
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 0.9, repeat: Infinity }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Seed suggestions — only before first user message */}
              <AnimatePresence>
                {!userHasSpoken && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 pb-2 flex flex-wrap gap-1.5"
                  >
                    {SEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        disabled={isLoading}
                        className="rounded-full bg-white border border-earth-200 hover:border-forest-300 hover:bg-forest-50 px-3 py-1 text-[11px] text-earth-700 hover:text-forest-800 font-medium transition-colors disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="border-t border-earth-200/60 px-3 py-2.5">
                <div className="flex items-end gap-2 rounded-xl bg-white border border-earth-200 focus-within:border-forest-300 px-3 py-2 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={1}
                    placeholder="Vprašajte Jožeta..."
                    className="flex-1 resize-none bg-transparent text-[13px] text-forest-900 placeholder:text-earth-400 focus:outline-none leading-relaxed max-h-20 overflow-y-auto"
                    style={{ scrollbarWidth: "none" }}
                  />
                  <motion.button
                    onClick={() => sendMessage(input)}
                    disabled={isLoading || !input.trim()}
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0 h-8 w-8 rounded-full bg-forest-700 hover:bg-forest-600 disabled:bg-earth-300 flex items-center justify-center text-white transition-colors"
                    aria-label="Pošlji"
                  >
                    {isLoading ? (
                      <motion.span
                        className="block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Send size={13} />
                    )}
                  </motion.button>
                </div>
                <p className="handwritten text-center text-earth-400 text-sm mt-1.5 leading-none">
                  — z ljubeznijo, Jože
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
