"use client";

// =============================================================================
// NaKmetiji.si — The Oracle: Semantic AI Travel Concierge
// Floating glassmorphism chat UI with:
//   • SSE streaming response
//   • AnimatePresence for smooth transitions
//   • Light Cycle accent color (time-of-day aware)
//   • Farm result cards rendered from metadata events
//   • Pantry upsell cards injected inline
// =============================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  ChevronRight,
  Star,
  Loader2,
  TreePine,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { BLUR_DATA_URL } from "@/lib/blur";
import { useOracleStore } from "@/lib/oracleStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Locale = "sl" | "en" | "de" | "it";

interface OracleMessage {
  role: "user" | "assistant";
  content: string;
  farmCards?: FarmCard[];
  isStreaming?: boolean;
}

interface FarmCard {
  slug: string;
  ime: string;
  kratki_opis: string | null;
  regija: string;
  naslovna_slika: string;
  ocena: number | null;
  cena_noc: number | null;
  premium: boolean;
}

// ---------------------------------------------------------------------------
// Light Cycle — accent color shifts based on time of day
// ---------------------------------------------------------------------------

function getLightCycle() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10)
    return { name: "jutro", accent: "#d97706", glow: "amber" };
  if (hour >= 10 && hour < 17)
    return { name: "dan", accent: "#2D5A27", glow: "forest" };
  if (hour >= 17 && hour < 21)
    return { name: "vecер", accent: "#9333ea", glow: "purple" };
  return { name: "noc", accent: "#1e40af", glow: "blue" };
}

function useLightCycle() {
  const [cycle, setCycle] = useState(getLightCycle);
  useEffect(() => {
    const id = setInterval(() => setCycle(getLightCycle()), 60_000);
    return () => clearInterval(id);
  }, []);
  return cycle;
}

// ---------------------------------------------------------------------------
// Markdown-lite renderer (bold, links only — no external dep)
// ---------------------------------------------------------------------------

// Allowlist: only internal farm paths and safe absolute HTTPS URLs.
// Prevents XSS if a prompt-injected model response emits javascript: or data: URLs.
function isSafeUrl(url: string): boolean {
  if (url.startsWith("/kmetije/")) return true;
  if (url.startsWith("/")) return true; // any internal path
  try {
    const { protocol, hostname } = new URL(url);
    return (
      (protocol === "https:" || protocol === "http:") &&
      // Restrict external links to known-safe domains only
      (hostname === "nakmetiji.si" || hostname.endsWith(".nakmetiji.si"))
    );
  } catch {
    return false;
  }
}

function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    // Bold: **text**
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch)
      return (
        <strong key={i} className="font-semibold text-forest-900">
          {boldMatch[1]}
        </strong>
      );
    // Link: [text](url) — URL is validated before rendering
    const linkMatch = part.match(/^\[(.+)\]\((.+)\)$/);
    if (linkMatch && isSafeUrl(linkMatch[2]))
      return (
        <Link
          key={i}
          href={linkMatch[2]}
          className="inline-flex items-center gap-1 font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-500 transition-colors"
        >
          {linkMatch[1]}
          <ChevronRight size={12} />
        </Link>
      );
    // Unsafe or unrecognised URL — render as plain text, never as a link
    if (linkMatch) return <span key={i}>{linkMatch[1]}</span>;
    return <span key={i}>{part}</span>;
  });
}

// Renders a single paragraph/line — detects ## headings with embedded links
function renderLine(line: string, i: number): React.ReactNode {
  // Booking widget logic (Closer feature)
  const bookingMatch = line.match(/\[BOOK_WIDGET:([^\]]+)\]/);
  if (bookingMatch) {
    const slug = bookingMatch[1];
    return (
      <Link
        key={i}
        href={`/kmetije/${slug}#booking`}
        className="mt-3 mb-2 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-forest-600 to-forest-500 hover:from-forest-500 hover:to-forest-400 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        onClick={() => {
          // smooth anchor behaviour handled by browser default
        }}
      >
        <Sparkles size={16} className="text-amber-200" />
        Preveri razpoložljivost in rezerviraj
      </Link>
    );
  }

  // ## [Farm Name](/kmetije/slug)
  const headingLinkMatch = line.match(/^##\s+\[(.+?)\]\((.+?)\)$/);
  if (headingLinkMatch && isSafeUrl(headingLinkMatch[2]))
    return (
      <Link
        key={i}
        href={headingLinkMatch[2]}
        className="group flex items-center gap-1.5 mt-3 mb-1 font-bold text-forest-900 hover:text-forest-600 transition-colors text-base leading-snug"
      >
        {headingLinkMatch[1]}
        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    );
  // Unsafe heading link — render as plain heading
  if (headingLinkMatch)
    return (
      <p key={i} className="mt-3 mb-1 font-bold text-forest-900 text-base leading-snug">
        {headingLinkMatch[1]}
      </p>
    );
  // ## Plain heading (fallback)
  const headingMatch = line.match(/^##\s+(.+)$/);
  if (headingMatch)
    return (
      <p key={i} className="mt-3 mb-1 font-bold text-forest-900 text-base leading-snug">
        {headingMatch[1]}
      </p>
    );
  // Normal paragraph (remove any trailing book widgets if they were merged into a line by mistake)
  const cleanLine = line.replace(/\[BOOK_WIDGET:[^\]]+\]/g, "");
  return cleanLine ? <p key={i}>{renderMarkdown(cleanLine)}</p> : null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-forest-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function FarmResultCard({ farm }: { farm: FarmCard }) {
  const REGIJA_LABELS: Record<string, string> = {
    gorenjska: "Gorenjska", primorska: "Primorska", stajerska: "Štajerska",
    dolenjska: "Dolenjska", koroska: "Koroška", savinjska: "Savinjska",
    pomurska: "Pomurska", notranjska: "Notranjska", zasavska: "Zasavska",
    posavska: "Posavska", jugovzhodna_slovenija: "JV Slovenija",
    osrednjeslovenska: "Osrednjeslovenska",
  };

  return (
    <Link
      href={`/kmetije/${farm.slug}`}
      className="group flex items-center gap-3 rounded-xl bg-white/60 hover:bg-white/90 border border-white/50 hover:border-forest-200 p-3 transition-all duration-300 hover:shadow-md"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src={farm.naslovna_slika || "/images/placeholder-farm.jpg"}
          alt={farm.ime}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="56px"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
        {farm.premium && (
          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center">
            <Star size={8} fill="white" className="text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-forest-900 truncate">{farm.ime}</p>
        <p className="text-xs text-earth-500 truncate">
          📍 {REGIJA_LABELS[farm.regija] ?? farm.regija}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {farm.ocena && (
            <span className="text-xs text-gold-600 font-medium">
              ★ {farm.ocena.toFixed(1)}
            </span>
          )}
          {farm.cena_noc && (
            <span className="text-xs text-earth-500">
              od {farm.cena_noc} €/noč
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="text-earth-400 group-hover:text-forest-600 transition-colors flex-shrink-0" />
    </Link>
  );
}

function MessageBubble({ msg, accentColor }: { msg: OracleMessage; accentColor: string }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
    >
      {/* Text bubble */}
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm text-white"
            : "glass-card rounded-bl-sm text-forest-900"
        }`}
        style={isUser ? { background: accentColor } : undefined}
      >
        {isUser ? (
          <p>{msg.content}</p>
        ) : msg.isStreaming && !msg.content ? (
          <TypingDots />
        ) : (
          <div className="space-y-1.5">
            {msg.content.split("\n").map((line, i) => renderLine(line, i))}
          </div>
        )}
      </div>

      {/* Farm result cards */}
      <AnimatePresence>
        {!isUser && msg.farmCards && msg.farmCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[92%] space-y-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-earth-400 ml-1">
              Priporočene kmetije
            </p>
            {msg.farmCards.map((farm) => (
              <FarmResultCard key={farm.slug} farm={farm} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Suggested prompts by locale
// ---------------------------------------------------------------------------

const SUGGESTIONS: Record<Locale, string[]> = {
  sl: [
    "Tihi konec tedna, stran od vsega 🌿",
    "Romantična kmetija z vinom za dva 🍷",
    "Doživetje za celo družino z otroki 👨‍👩‍👧",
    "Eko kmetija z organsko hrano 🥦",
  ],
  en: [
    "A quiet escape in the Slovenian Alps 🏔️",
    "Wine tasting and local gastronomy 🍷",
    "Sustainable farm, dog-friendly 🐕",
    "Luxury rural retreat for two 🌿",
  ],
  de: [
    "Ruhiges Wochenende in der Natur 🌲",
    "Weinverkostung und Bauernhofküche 🍷",
    "Familienurlaub auf dem Bauernhof 👨‍👩‍👧",
    "Luxuriöser Rückzugsort, hundefreundlich 🐕",
  ],
  it: [
    "Un weekend tranquillo nella natura 🌿",
    "Degustazione vini e cucina locale 🍷",
    "Agriturismo per famiglie con bambini 👧",
    "Fuga romantica in campagna per due 💚",
  ],
};

const STATUS_LABELS: Record<string, Record<Locale, string>> = {
  intent:  { sl: "Jože posluša...",              en: "Jože is listening...",             de: "Jože hört zu...",             it: "Jože ascolta..."               },
  search:  { sl: "Jože brska po zakladih...",    en: "Jože searches his treasures...",   de: "Jože sucht seine Schätze...", it: "Jože cerca i suoi tesori..."   },
  geo:     { sl: "Jože pregleduje okolico...",   en: "Jože scans the surroundings...",   de: "Jože erkundet die Umgebung...", it: "Jože esplora i dintorni..."  },
  pitch:   { sl: "Jože pripoveduje...",          en: "Jože tells a story...",            de: "Jože erzählt...",             it: "Jože racconta..."              },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OracleConcierge({ locale = "sl" }: { locale?: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<OracleMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusPhase, setStatusPhase] = useState<string | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [failCount, setFailCount] = useState(0);

  // B11: Persist chat across navigations via Zustand sessionStorage store
  const oracleStore = useOracleStore();
  const isCircuitBroken = failCount >= 3;
  const [retryInfo, setRetryInfo] = useState<{
    retryable: boolean;
    retryAfterMs: number | null;
    lastMessage: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lightCycle = useLightCycle();
  // AbortController ref — cancelled on component unmount or when a new message
  // is sent while a previous stream is still running.
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Auto-grow textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Greeting message — restore from sessionStorage if available
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);

      // B11: Restore previous session messages if they exist
      const stored = oracleStore.messages;
      if (stored.length > 0) {
        setMessages(stored.map((m) => ({ role: m.role, content: m.content })));
        return;
      }

      const greetings: Record<Locale, string> = {
        sl: `Bog žegnaj! Sem Jože, vaš kmečki vodnik.\n\nPovejte mi — kam vas srce vleče? Tihi gozd, vonj po sveže pečenem kruhu, jutranja megla nad travnikom? Opišite v svojih besedah, pa vam bom povedal, kje to najdete.\n\n*Ker kdor prej pride, prej melje.* 😊`,
        en: `Welcome! I'm Jože — your countryside guide to hidden Slovenia.\n\nTell me, where does your heart pull you? A quiet forest, the smell of fresh bread from a stone oven, morning mist lifting over a meadow...\n\nDescribe it in your own words.`,
        de: `Willkommen! Ich bin Jože — Ihr Reiseführer ins verborgene Slowenien.\n\nErzählen Sie mir, wohin Ihr Herz Sie zieht: ein stiller Wald, der Duft von frischem Brot, Morgennebel über Wiesen...`,
        it: `Benvenuti! Sono Jože — la vostra guida nella Slovenia nascosta.\n\nDitemi, dove vi porta il cuore? Un bosco silenzioso, il profumo del pane fresco, la nebbia del mattino sui prati...`,
      };
      const greeting: OracleMessage = { role: "assistant", content: greetings[locale] };
      setMessages([greeting]);
      oracleStore.addMessage({ role: greeting.role, content: greeting.content });
    }
  }, [isOpen, hasGreeted, locale, oracleStore]);

  // Cancel stream on unmount (e.g. user navigates away mid-stream)
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Cancel any in-flight stream before starting a new one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // 45-second hard timeout — Groq maxDuration is 60s on server, give
      // ourselves 15s of margin to detect hangs before the server kills it.
      const timeoutId = setTimeout(() => controller.abort(), 45_000);

      const userMessage: OracleMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      oracleStore.addMessage({ role: "user", content: text });
      setInput("");
      setIsLoading(true);
      setStatusPhase("intent");
      setRetryInfo(null);
      // Reset fail count if it's a new successful attempt? No, let circuit break be hard until refresh.
      if (isCircuitBroken) return;

      // Add streaming assistant placeholder
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", isStreaming: true },
      ]);

      let accumulated = "";
      let farmCards: FarmCard[] = [];

      try {
        const history = messages
          .filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch("/api/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, locale, history }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) throw new Error("Stream unavailable");

        const reader = response.body.getReader();
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

              if (currentEvent === "status") {
                try {
                  const d = JSON.parse(raw) as { phase: string };
                  setStatusPhase(d.phase);
                } catch { /* skip */ }
              } else if (currentEvent === "farms") {
                try {
                  const d = JSON.parse(raw) as { farms: FarmCard[] };
                  farmCards = d.farms;
                } catch { /* skip */ }
              } else if (currentEvent === "error") {
                try {
                  const d = JSON.parse(raw) as { retryable?: boolean; retryAfterMs?: number | null };
                  if (d.retryable) {
                    setRetryInfo({ retryable: true, retryAfterMs: d.retryAfterMs ?? null, lastMessage: text });
                  }
                } catch { /* skip */ }
              } else if (currentEvent === null) {
                try {
                  const parsed = JSON.parse(raw) as { text?: string };
                  if (parsed.text) {
                    accumulated += parsed.text;
                    setMessages((prev) => {
                      const next = [...prev];
                      const last = next[next.length - 1];
                      if (last?.role === "assistant") {
                        next[next.length - 1] = {
                          ...last,
                          content: accumulated,
                          isStreaming: true,
                        };
                      }
                      return next;
                    });
                  }
                } catch { /* non-JSON data line */ }
              }
            } else if (line === "") {
              currentEvent = null;
            }
          }
        }
      } catch (err) {
        // Ignore intentional aborts (user navigated away or sent a new message)
        if (err instanceof Error && err.name === "AbortError") return;
        setFailCount(c => c + 1);
        console.error("[Oracle UI] Stream error:", err);
        accumulated =
          locale === "sl"
            ? "Oj, počakajte hip — šel sem v klet po eno dobro. Poskusite znova čez trenutek. *Ker lepa beseda lepo mesto najde.*"
            : "Ah, hold on — I just went to the wine cellar for a good one. Try again in a moment.";
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setStatusPhase(null);
        // Finalize the last assistant message
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = {
              ...last,
              content: accumulated,
              farmCards: farmCards.length > 0 ? farmCards : undefined,
              isStreaming: false,
            };
          }
          return next;
        });
        // B11: Persist final assistant response to session store
        if (accumulated) {
          oracleStore.addMessage({ role: "assistant", content: accumulated });
        }
      }
    },
    [isLoading, isCircuitBroken, messages, locale, oracleStore]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Panel dimensions
  const panelWidth  = isExpanded ? "min(680px, 96vw)" : "min(420px, 96vw)";
  const panelHeight = isExpanded ? "min(700px, 85vh)" : "min(540px, 80vh)";

  const statusLabel = statusPhase
    ? (STATUS_LABELS[statusPhase]?.[locale] ?? "...")
    : null;

  return (
    <>
      {/* ── Floating trigger button ──────────────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="oracle-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => {
              if (isCircuitBroken) return;
              setIsOpen(true);
            }}
            className="fixed bottom-6 right-6 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-white font-semibold text-sm shadow-2xl select-none"
            style={{
              zIndex: "var(--z-oracle)",
              background: isCircuitBroken 
                ? "rgba(100, 110, 100, 0.9)"
                : `linear-gradient(135deg, ${lightCycle.accent}, ${lightCycle.accent}cc)`,
              boxShadow: isCircuitBroken ? "none" : `0 8px 32px ${lightCycle.accent}55, 0 2px 8px rgba(0,0,0,0.15)`,
              cursor: isCircuitBroken ? "not-allowed" : "pointer",
            }}
            aria-label="Vprašaj Jožeta"
          >
            {isCircuitBroken ? (
              <>
                <TreePine size={18} className="opacity-70" />
                <span className="hidden sm:inline">Jože počiva</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span className="hidden sm:inline">Vprašaj Jožeta</span>
                <span className="sm:hidden">Jože</span>

                {/* Pulse ring */}
                <motion.span
                  className="absolute inset-0 rounded-2xl border-2"
                  style={{ borderColor: lightCycle.accent }}
                  animate={{ scale: [1, 1.15], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="oracle-panel"
            initial={{ opacity: 0, scale: 0.92, y: 24, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed bottom-6 right-6 flex flex-col overflow-hidden rounded-3xl shadow-2xl"
            style={{
              zIndex: "var(--z-oracle)",
              width: panelWidth,
              height: panelHeight,
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.45)",
              boxShadow: `0 32px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(255,255,255,0.25), 0 0 64px ${lightCycle.accent}22`,
            }}
          >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
              className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${lightCycle.accent}18, ${lightCycle.accent}08)`,
                borderBottom: "1px solid rgba(255,255,255,0.35)",
              }}
            >
              {/* Oracle avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner"
                style={{ background: `linear-gradient(135deg, ${lightCycle.accent}, ${lightCycle.accent}aa)` }}
              >
                <TreePine size={18} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-forest-900">Jože</p>
                  {/* Light cycle indicator */}
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: lightCycle.accent }}
                  >
                    {lightCycle.name}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  {statusLabel ? (
                    <motion.p
                      key={statusLabel}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-earth-500 flex items-center gap-1.5"
                    >
                      <Loader2 size={10} className="animate-spin" />
                      {statusLabel}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-earth-500"
                    >
                      {locale === "sl" ? "Vaš kmečki vodnik" : "Your countryside guide"}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded((e) => !e)}
                  className="p-1.5 rounded-lg text-earth-400 hover:text-forest-700 hover:bg-white/60 transition-all"
                  aria-label={isExpanded ? "Zmanjšaj" : "Razširi"}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-earth-400 hover:text-forest-700 hover:bg-white/60 transition-all"
                  aria-label="Zapri"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Messages ────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={i}
                    msg={msg}
                    accentColor={lightCycle.accent}
                  />
                ))}
              </AnimatePresence>

              {/* "Try again" — shown when server emits a retryable error event */}
              <AnimatePresence>
                {retryInfo?.retryable && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex justify-center pb-1"
                  >
                    <button
                      onClick={() => sendMessage(retryInfo.lastMessage)}
                      className="flex items-center gap-2 rounded-full bg-white/80 hover:bg-white border border-earth-200 hover:border-forest-300 px-4 py-2 text-xs font-semibold text-earth-700 hover:text-forest-800 shadow-sm transition-all"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {locale === "sl" ? "Poskusi znova" : locale === "de" ? "Erneut versuchen" : locale === "it" ? "Riprova" : "Try again"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* ── Suggestion chips (only shown when no messages from user) ─ */}
            <AnimatePresence>
              {messages.filter((m) => m.role === "user").length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pb-2 flex flex-wrap gap-2"
                >
                  {SUGGESTIONS[locale].map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      disabled={isLoading}
                      className="rounded-full bg-white/70 hover:bg-white border border-earth-200 hover:border-forest-300 px-3 py-1.5 text-xs text-earth-700 hover:text-forest-800 transition-all duration-200 disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input area ──────────────────────────────────────────────── */}
            <div
              className="flex-shrink-0 px-4 pb-4 pt-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}
            >
              <div
                className="flex items-end gap-2 rounded-2xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  border: `1.5px solid ${isLoading ? lightCycle.accent + "66" : "rgba(255,255,255,0.5)"}`,
                  transition: "border-color 0.3s",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || isCircuitBroken}
                  rows={1}
                  placeholder={
                    isCircuitBroken 
                      ? "Jože počiva..." 
                      : locale === "sl"
                      ? "Povejte mi, kam vas srce vleče..."
                      : locale === "de"
                      ? "Wohin zieht Sie Ihr Herz..."
                      : locale === "it"
                      ? "Dove vi porta il cuore..."
                      : "Tell me, where does your heart pull you..."
                  }
                  className="flex-1 resize-none bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none leading-relaxed max-h-28 overflow-y-auto"
                  style={{ scrollbarWidth: "none" }}
                />

                <motion.button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim() || isCircuitBroken}
                  whileTap={{ scale: 0.9 }}
                  className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all"
                  style={{
                    background: input.trim() && !isLoading && !isCircuitBroken
                      ? lightCycle.accent
                      : "#b0b8b0",
                  }}
                  aria-label="Pošlji"
                >
                  {isLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </motion.button>
              </div>

              <p className="text-center text-[10px] text-earth-400 mt-2">
                AI · NaKmetiji.si · {new Date().getFullYear()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
