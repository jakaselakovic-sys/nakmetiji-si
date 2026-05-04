"use client";

// =============================================================================
// NaKmetiji.si — StrategistAdvisor
// Hardcore AI business advisor for farm owners. Lives in the "AI Orodja" tab
// of the vendor dashboard. Uses /api/strategist (SSE stream).
//
// Design: dark slate/charcoal — deliberately different from the warm paper-
// texture Jože concierge. Signals: this is serious business, not tourism chit-chat.
// =============================================================================

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, TrendingUp, Zap, Target, DollarSign,
  BarChart2, ChevronRight, Loader2,
} from "lucide-react";
import type { FarmContext } from "@/app/api/strategist/route";
import type { Kmetija, Rezervacija } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// ---------------------------------------------------------------------------
// Starter prompts — the 20% questions that drive 80% of value
// ---------------------------------------------------------------------------

const STARTER_PROMPTS = [
  { icon: DollarSign,  label: "Optimizacija cene",    prompt: "Analiziraj moje podatke in mi povej, ali je moja cena nočitve optimalna. Kaj moram narediti, da povečam prihodek na rezervacijo?" },
  { icon: TrendingUp,  label: "Povečaj konverzijo",   prompt: "Moja stopnja konverzije je nizka. Daj mi konkretnih 5 korakov, ki jih moram narediti ta teden, da dobim več rezervacij iz obstoječih obiskov profila." },
  { icon: Target,      label: "Grand Slam ponudba",   prompt: "Sestavi mi neustavljivo paketno ponudbo — cena, bonusi, garancija in nujnost — ki bo goste prepričala, da rezervirajo pri meni namesto pri konkurenci." },
  { icon: Zap,         label: "Quick Win ta teden",   prompt: "Katera je ena stvar, ki jo lahko naredim v naslednjih 48 urah in bo imela największi vpliv na moje rezervacije? Bodi konkreten." },
  { icon: BarChart2,   label: "80/20 analiza",        prompt: "Na podlagi mojih podatkov: katera doživetja, termini ali tipi gostov mi prinašajo 80% vrednosti? Kaj moram ubiti in kaj podvojiti?" },
  { icon: ChevronRight,label: "Upgrade na višji tier", prompt: "Pojasni mi, ali se mi finančno splača nadgradnja paketa na NaKmetiji. Pokaži mi matematiko — koliko dodatnih rezervacij moram dobiti, da se investicija povrne?" },
];

// ---------------------------------------------------------------------------
// Markdown-lite renderer
// ---------------------------------------------------------------------------

function renderContent(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`list-${nodes.length}`} className="my-2 space-y-1 pl-3">
        {listItems.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-200">
            <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      flushList();
      listItems.push(numMatch[2]);
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      flushList();
      listItems.push(bulletMatch[1]);
      continue;
    }

    flushList();

    // Heading
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      nodes.push(<p key={i} className="text-[11px] font-black uppercase tracking-[0.18em] text-[#D4AF37]/70 mt-4 mb-1">{h2[1]}</p>);
      continue;
    }

    // Bold inline
    if (line.trim()) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        const bold = part.match(/^\*\*(.+)\*\*$/);
        if (bold) return <strong key={j} className="font-bold text-white">{bold[1]}</strong>;
        return <span key={j}>{part}</span>;
      });
      nodes.push(<p key={i} className="text-sm leading-relaxed text-slate-200 my-1">{parts}</p>);
    }
  }

  flushList();
  return nodes;
}

// ---------------------------------------------------------------------------
// Farm stats header — shows key metrics at a glance
// ---------------------------------------------------------------------------

function FarmStatsBar({ farm, rezervacije }: { farm: Kmetija; rezervacije: Rezervacija[] }) {
  const skupaj = rezervacije.length;
  const potrjene = rezervacije.filter((r) => r.status === "potrjena" || r.status === "zakljucena").length;
  const konverzija = skupaj > 0 ? Math.round((potrjene / skupaj) * 100) : 0;

  const stats = [
    { label: "Cena/noč", value: farm.cena_noc ? `${farm.cena_noc} €` : "—" },
    { label: "Rezervacije", value: String(skupaj) },
    { label: "Konverzija", value: `${konverzija}%`, highlight: konverzija < 40 },
    { label: "Ocena", value: farm.ocena ? `${farm.ocena.toFixed(1)} ★` : "—" },
    { label: "Tier", value: farm.paket ?? "korenine", isTag: true },
  ];

  return (
    <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-white/[0.06]">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</span>
          <span
            className={`text-[11px] font-black ${
              s.isTag
                ? "px-1.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37]"
                : s.highlight
                  ? "text-red-400"
                  : "text-white"
            }`}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  farm: Kmetija;
  rezervacije: Rezervacija[];
}

export function StrategistAdvisor({ farm, rezervacije }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [started, setStarted]   = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const farmContext = useMemo<FarmContext>(() => ({
    ime: farm.ime,
    regija: farm.regija,
    paket: farm.paket ?? "korenine",
    cena_noc: farm.cena_noc ?? null,
    ocena: farm.ocena ?? null,
    stevilo_ocen: farm.stevilo_ocen ?? 0,
    skupaj_rezervacij: rezervacije.length,
    potrjene_rezervacij: rezervacije.filter(
      (r) => r.status === "potrjena" || r.status === "zakljucena"
    ).length,
    dozivetja: [],
  }), [farm, rezervacije]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || streaming) return;

    setStarted(true);
    setError(null);
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    const assistantMsg: Message = { role: "assistant", content: "", isStreaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/strategist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          farmContext,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Napaka strežnika");
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += dec.decode(value, { stream: true });
        const eventBlocks = buffer.split("\n\n");
        buffer = eventBlocks.pop() ?? "";

        for (const block of eventBlocks) {
          const eventMatch = block.match(/^event: (\w+)/m);
          const dataMatch  = block.match(/^data: (.+)/m);
          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          let payload: { text?: string; message?: string };
          try { payload = JSON.parse(dataMatch[1]); }
          catch { continue; }

          if (event === "delta" && payload.text) {
            accumulated += payload.text;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: accumulated, isStreaming: true };
              return next;
            });
          } else if (event === "error") {
            throw new Error(payload.message ?? "Neznana napaka");
          }
        }
      }

      // Mark streaming done
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: accumulated, isStreaming: false };
        return next;
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Neznana napaka";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1)); // remove empty assistant bubble
    } finally {
      setStreaming(false);
    }
  }, [streaming, messages, farmContext]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl"
      style={{ background: "#0f1117", minHeight: "600px", maxHeight: "80vh" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]"
        style={{ background: "linear-gradient(135deg, #0d1a12 0%, #111827 100%)" }}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #D4AF37 0%, #b8922b 100%)" }}
          >
            <TrendingUp size={18} className="text-black" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight">Poslovni Strategist</p>
            <p className="text-[10px] text-slate-500">
              Neusmiljenost. Rezultati. Prihodek.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-500 font-semibold">AI aktiven</span>
        </div>
      </div>

      {/* ── Farm stats bar ── */}
      <FarmStatsBar farm={farm} rezervacije={rezervacije} />

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
        {!started && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-6"
          >
            <div
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-5"
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)", border: "1px solid rgba(212,175,55,0.2)" }}
            >
              <TrendingUp size={28} className="text-[#D4AF37]" />
            </div>
            <p className="text-base font-black text-white mb-1.5">Pripravljeni na resno rast?</p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              Izberite vprašanje spodaj ali napišite svoje. Dobite direktne, od podatkov podprte odgovore — brez filtra.
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg mr-2.5 mt-0.5 self-start"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #b8922b)" }}>
                  <TrendingUp size={13} className="text-black" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "text-sm text-white rounded-br-sm"
                    : "rounded-bl-sm"
                }`}
                style={
                  msg.role === "user"
                    ? { background: "linear-gradient(135deg, #064E3B, #043d2e)" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                {msg.role === "user" ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <div>
                    {renderContent(msg.content)}
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-3.5 bg-[#D4AF37] ml-0.5 animate-pulse rounded-sm" />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-800/30 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Starter prompts ── */}
      {!started && (
        <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STARTER_PROMPTS.map((sp) => {
            const Icon = sp.icon;
            return (
              <button
                key={sp.label}
                onClick={() => sendMessage(sp.prompt)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all duration-200 group"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; e.currentTarget.style.background = "rgba(212,175,55,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >
                <Icon size={13} className="flex-shrink-0 text-[#D4AF37]" />
                <span className="text-[11px] font-semibold text-slate-300 leading-snug">{sp.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Input bar ── */}
      <div
        className="flex items-end gap-3 px-4 py-3 border-t border-white/[0.07]"
        style={{ background: "rgba(0,0,0,0.3)" }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={streaming}
          placeholder="Vprašajte strategista… (Enter = pošlji)"
          rows={1}
          className="flex-1 bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37]/40 focus:ring-1 focus:ring-[#D4AF37]/20 resize-none transition-all"
          style={{ scrollbarWidth: "none", maxHeight: "120px" }}
        />
        <motion.button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-30 transition-all"
          style={{
            background: input.trim() && !streaming
              ? "linear-gradient(135deg, #D4AF37, #b8922b)"
              : "rgba(255,255,255,0.08)",
          }}
        >
          {streaming
            ? <Loader2 size={16} className="animate-spin text-white" />
            : <Send size={15} className={input.trim() ? "text-black" : "text-slate-400"} />
          }
        </motion.button>
      </div>
    </div>
  );
}
