"use client";

// =============================================================================
// NaKmetiji.si — The Oracle (Jože)
// Semantic AI travel concierge, overhauled to feel like a hand-written letter
// from a Slovenian country host. Preserves: SSE streaming, AbortController,
// circuit breaker, retry prompt, zustand session persistence, locale switching.
// Visual layer: paper texture, watercolor wash header, wax-seal avatar,
// ink-drawn divider, polaroid-tape suggestion chips, ink-stamp send button,
// handwritten signature.
// =============================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Send,
  ChevronRight,
  Star,
  Leaf,
  Maximize2,
  Minimize2,
  Feather,
  MapPin,
} from "lucide-react";
import { BLUR_DATA_URL } from "@/lib/blur";
import { useOracleStore } from "@/lib/oracleStore";
import * as Sentry from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Locale = "sl" | "en" | "de" | "it";

interface OracleMessage {
  role: "user" | "assistant";
  content: string;
  farmCards?: FarmCard[];
  roadTripHint?: RoadTripHint;
  shadowVerdict?: { ok: boolean; issues: string[] };
  isStreaming?: boolean;
}

interface MapContextData {
  farms: { slug: string; ime: string; lat: number; lng: number }[];
  landmarks: { ime: string; kategorija: string; lat: number; lng: number; proximity_type: string }[];
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

interface RoadTripHint {
  regions: string[];
  days: number | null;
  url: string;
}

// ---------------------------------------------------------------------------
// Light Cycle — accent color shifts based on time of day
// ---------------------------------------------------------------------------

function getLightCycle() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10)
    return { name: "jutro", accent: "#d97706", wash: "#fde9c2", glow: "amber" };
  if (hour >= 10 && hour < 17)
    return { name: "dan", accent: "#2D5A27", wash: "#d8e7cf", glow: "forest" };
  if (hour >= 17 && hour < 21)
    return { name: "večer", accent: "#8b5a3c", wash: "#f2d8c6", glow: "copper" };
  return { name: "noč", accent: "#1e3a5f", wash: "#c9d6e4", glow: "blue" };
}

function useLightCycle() {
  const [cycle, setCycle] = useState({ name: "dan", accent: "#2D5A27", wash: "#d8e7cf", glow: "forest" });
  useEffect(() => {
    setCycle(getLightCycle());
    const id = setInterval(() => setCycle(getLightCycle()), 60_000);
    return () => clearInterval(id);
  }, []);
  return cycle;
}

// ---------------------------------------------------------------------------
// Markdown-lite renderer (bold, links only — no external dep)
// ---------------------------------------------------------------------------

// Allowlist: only internal farm paths and safe absolute HTTPS URLs.
function isSafeUrl(url: string): boolean {
  if (url.startsWith("/kmetije/")) return true;
  if (url.startsWith("/")) return true;
  try {
    const { protocol, hostname } = new URL(url);
    return (
      (protocol === "https:" || protocol === "http:") &&
      (hostname === "nakmetiji.si" || hostname.endsWith(".nakmetiji.si"))
    );
  } catch {
    return false;
  }
}

function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch)
      return (
        <strong key={i} className="font-bold text-forest-900">
          {boldMatch[1]}
        </strong>
      );
    const italicMatch = part.match(/^\*(.+)\*$/);
    if (italicMatch)
      return (
        <em key={i} className="italic text-forest-700/90">
          {italicMatch[1]}
        </em>
      );
    const linkMatch = part.match(/^\[(.+)\]\((.+)\)$/);
    if (linkMatch && isSafeUrl(linkMatch[2]))
      return (
        <Link
          key={i}
          href={linkMatch[2]}
          className="inline-flex items-center gap-1 font-semibold text-forest-700 underline decoration-dotted underline-offset-[3px] hover:text-amber-700 transition-colors"
        >
          {linkMatch[1]}
          <ChevronRight size={12} />
        </Link>
      );
    if (linkMatch) return <span key={i}>{linkMatch[1]}</span>;
    return <span key={i}>{part}</span>;
  });
}

function renderLine(line: string, i: number): React.ReactNode {
  // Booking widget
  const bookingMatch = line.match(/\[BOOK_WIDGET:([^\]]+)\]/);
  if (bookingMatch) {
    const slug = bookingMatch[1];
    return (
      <Link
        key={i}
        href={`/kmetije/${slug}#booking`}
        className="mt-3 mb-2 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] ring-1 ring-forest-900/20"
      >
        <Feather size={15} className="text-amber-200" />
        Preveri razpoložljivost
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
        className="group flex items-center gap-1.5 mt-3 mb-1 font-display font-bold text-forest-900 hover:text-amber-700 transition-colors text-base leading-snug"
      >
        {headingLinkMatch[1]}
        <ChevronRight
          size={14}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </Link>
    );
  if (headingLinkMatch)
    return (
      <p key={i} className="mt-3 mb-1 font-display font-bold text-forest-900 text-base leading-snug">
        {headingLinkMatch[1]}
      </p>
    );
  const headingMatch = line.match(/^##\s+(.+)$/);
  if (headingMatch)
    return (
      <p key={i} className="mt-3 mb-1 font-display font-bold text-forest-900 text-base leading-snug">
        {headingMatch[1]}
      </p>
    );
  const cleanLine = line.replace(/\[BOOK_WIDGET:[^\]]+\]/g, "");
  return cleanLine ? <p key={i}>{renderMarkdown(cleanLine)}</p> : null;
}

// ---------------------------------------------------------------------------
// Sub-components — illustrations
// ---------------------------------------------------------------------------

/** Pure SVG portrait of Jože — no background, sized by parent.
 *  Used both on its own (inside the FAB) and wrapped by JozeAvatar below. */
function JozePortrait({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className="block"
    >
      {/* Face */}
      <ellipse cx="32" cy="36" rx="14" ry="15" fill="#f3d5b5" />
      {/* Beard */}
      <path
        d="M18 37 Q20 50 32 52 Q44 50 46 37 Q44 45 38 47 Q32 49 26 47 Q20 45 18 37 Z"
        fill="#e6e2dc"
      />
      {/* Moustache */}
      <path d="M24 38 Q28 41 32 39 Q36 41 40 38 Q36 36 32 37 Q28 36 24 38 Z" fill="#e6e2dc" />
      {/* Eyes — smiling crescents */}
      <path d="M25 33 Q27 31 29 33" stroke="#2d2a24" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M35 33 Q37 31 39 33" stroke="#2d2a24" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Rosy cheeks */}
      <circle cx="24" cy="38" r="1.2" fill="#e7a090" opacity="0.6" />
      <circle cx="40" cy="38" r="1.2" fill="#e7a090" opacity="0.6" />
      {/* Wide-brim country hat */}
      <ellipse cx="32" cy="24" rx="22" ry="4.5" fill="#3f2b1a" />
      <path d="M22 24 Q22 14 32 13 Q42 14 42 24 Z" fill="#4b3420" />
      <rect x="22" y="22" width="20" height="2" fill="#8b5a3c" opacity="0.85" />
      {/* Neck / collar */}
      <rect x="28" y="50" width="8" height="6" fill="#3f5a33" />
    </svg>
  );
}

/** Circular wrapper around JozePortrait — used in the chat header. */
function JozeAvatar({ accent, size = 40 }: { accent: string; size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${accent}ee, ${accent}aa 55%, ${accent}cc 100%)`,
        boxShadow: `
          inset 0 2px 3px rgba(255,255,255,0.28),
          inset 0 -3px 6px rgba(0,0,0,0.22),
          0 4px 10px rgba(0,0,0,0.18)`,
      }}
    >
      <JozePortrait size={size} />
    </div>
  );
}

/** Hand-drawn ink ripple divider — used under the header. */
function InkDivider({ color = "#2D5A27" }: { color?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 12"
      preserveAspectRatio="none"
      className="w-full h-3 block opacity-60"
      style={{ color }}
    >
      <path
        d="M0 6 Q 20 1 40 6 T 80 6 T 120 6 T 160 6 T 200 6 T 240 6 T 280 6 T 320 6 T 360 6 T 400 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ThinkingInk() {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <span className="handwritten text-forest-700 text-lg italic">Jože razmišlja</span>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-forest-700"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}

function FarmResultCard({ farm }: { farm: FarmCard }) {
  const REGIJA_LABELS: Record<string, string> = {
    gorenjska: "Gorenjska",
    primorska: "Primorska",
    stajerska: "Štajerska",
    dolenjska: "Dolenjska",
    koroska: "Koroška",
    savinjska: "Savinjska",
    pomurska: "Pomurska",
    notranjska: "Notranjska",
    zasavska: "Zasavska",
    posavska: "Posavska",
    jugovzhodna_slovenija: "JV Slovenija",
    osrednjeslovenska: "Osrednjeslovenska",
  };

  return (
    <Link
      href={`/kmetije/${farm.slug}`}
      className="group relative flex items-center gap-3 rounded-xl bg-[#fdf8ee] hover:bg-white border border-earth-200/80 hover:border-forest-300 p-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <span className="tape-strip tape-strip-tl" aria-hidden="true" />
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-black/5">
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
          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center shadow">
            <Star size={8} fill="white" className="text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-forest-900 truncate font-display">
          {farm.ime}
        </p>
        <p className="text-xs text-earth-500 truncate">
          📍 {REGIJA_LABELS[farm.regija] ?? farm.regija}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {farm.ocena && (
            <span className="text-xs text-gold-600 font-semibold">
              ★ {farm.ocena.toFixed(1)}
            </span>
          )}
          {farm.cena_noc && (
            <span className="text-xs text-earth-500">od {farm.cena_noc} €/noč</span>
          )}
        </div>
      </div>
      <ChevronRight
        size={14}
        className="text-earth-400 group-hover:text-forest-600 transition-colors flex-shrink-0"
      />
    </Link>
  );
}

const REGIJA_LABEL_SHORT: Record<string, string> = {
  gorenjska: "Gorenjska",
  primorska: "Primorska",
  stajerska: "Štajerska",
  dolenjska: "Dolenjska",
  koroska: "Koroška",
  savinjska: "Savinjska",
  pomurska: "Pomurska",
  notranjska: "Notranjska",
  zasavska: "Zasavska",
  posavska: "Posavska",
  jugovzhodna_slovenija: "JV Slovenija",
  osrednjeslovenska: "Osrednjeslovenska",
};

function RoadTripHintCard({ hint }: { hint: RoadTripHint }) {
  const labels = hint.regions.map((r) => REGIJA_LABEL_SHORT[r] ?? r);
  const daysStr = hint.days ? `${hint.days} ${hint.days === 1 ? "dan" : hint.days < 5 ? "dni" : "dni"}` : "večdnevno";
  return (
    <Link
      href={hint.url}
      className="group relative block rounded-2xl border border-amber-300/70 bg-gradient-to-br from-amber-50 to-amber-100/60 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <span className="tape-strip tape-strip-tr" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <div className="wood-badge w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5 text-white" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3-7 4 14 3-7h4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 mb-0.5">
            Ideja za pot
          </p>
          <p className="text-sm font-bold text-forest-900 font-display leading-tight">
            Road trip: {labels.join(" → ")}
          </p>
          <p className="text-xs text-earth-600 mt-0.5">
            {daysStr} · sestavim ti pot z eno kmetijo na regijo
          </p>
        </div>
        <ChevronRight size={16} className="text-amber-700 mt-2 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

function MessageBubble({
  msg,
  accentColor,
}: {
  msg: OracleMessage;
  accentColor: string;
}) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
    >
      {/* Text bubble */}
      <div
        className={`relative max-w-[88%] px-4 py-3 text-[13.5px] leading-relaxed ${
          isUser
            ? "rounded-[18px] rounded-br-[4px] text-white"
            : "rounded-[18px] rounded-bl-[4px] text-forest-900"
        }`}
        style={
          isUser
            ? {
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                boxShadow: `0 6px 18px ${accentColor}33`,
              }
            : {
                background: "rgba(253, 248, 238, 0.92)",
                boxShadow:
                  "0 4px 14px rgba(45,90,39,0.08), inset 0 0 0 1px rgba(45,90,39,0.09)",
              }
        }
      >
        {isUser ? (
          <p>{msg.content}</p>
        ) : msg.isStreaming && !msg.content ? (
          <ThinkingInk />
        ) : (
          <div className="space-y-1.5">
            {msg.content.split("\n").map((line, i) => renderLine(line, i))}
            {msg.isStreaming && (
              <motion.span
                aria-hidden="true"
                className="inline-block w-[2px] h-[14px] bg-forest-700 align-middle ml-0.5"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            )}
          </div>
        )}
      </div>

      {/* Shadow verdict badge */}
      <AnimatePresence>
        {!isUser && msg.shadowVerdict && !msg.isStreaming && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`self-start flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              msg.shadowVerdict.ok
                ? "bg-forest-50 text-forest-600 border border-forest-200/60"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span>{msg.shadowVerdict.ok ? "✓" : "⚠"}</span>
            <span>{msg.shadowVerdict.ok ? "Preverjeno" : "Preverite podatke"}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Road-trip hint — shown when the query spans multiple regions */}
      <AnimatePresence>
        {!isUser && msg.roadTripHint && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[92%]"
          >
            <RoadTripHintCard hint={msg.roadTripHint} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Farm result cards */}
      <AnimatePresence>
        {!isUser && msg.farmCards && msg.farmCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[92%] space-y-2"
          >
            <p className="handwritten text-forest-700 text-lg ml-1 leading-none">
              Pa vam tole priporočam —
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
// Copy — suggestions, status labels, greetings
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
  intent: { sl: "Jože posluša...", en: "Jože is listening...", de: "Jože hört zu...", it: "Jože ascolta..." },
  search: { sl: "Jože brska po zakladih...", en: "Jože searches his treasures...", de: "Jože sucht seine Schätze...", it: "Jože cerca i suoi tesori..." },
  geo:    { sl: "Jože pregleduje okolico...", en: "Jože scans the surroundings...", de: "Jože erkundet die Umgebung...", it: "Jože esplora i dintorni..." },
  pitch:  { sl: "Jože pripoveduje...", en: "Jože tells a story...", de: "Jože erzählt...", it: "Jože racconta..." },
};

const GREETINGS: Record<Locale, string> = {
  sl: `Bog žegnaj! Sem **Jože**, vaš kmečki vodnik.\n\nPovejte mi — kam vas srce vleče? Tihi gozd, vonj po sveže pečenem kruhu, jutranja megla nad travnikom? Opišite v svojih besedah, pa vam bom povedal, kje to najdete.\n\n*Ker kdor prej pride, prej melje.* 🌾`,
  en: `Welcome! I'm **Jože** — your countryside guide to hidden Slovenia.\n\nTell me, where does your heart pull you? A quiet forest, the smell of fresh bread from a stone oven, morning mist lifting over a meadow...\n\nDescribe it in your own words.`,
  de: `Willkommen! Ich bin **Jože** — Ihr Reiseführer ins verborgene Slowenien.\n\nErzählen Sie mir, wohin Ihr Herz Sie zieht: ein stiller Wald, der Duft von frischem Brot, Morgennebel über Wiesen...`,
  it: `Benvenuti! Sono **Jože** — la vostra guida nella Slovenia nascosta.\n\nDitemi, dove vi porta il cuore? Un bosco silenzioso, il profumo del pane fresco, la nebbia del mattino sui prati...`,
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
  const [mapContext, setMapContext] = useState<MapContextData | null>(null);
  const pendingMsgRef = useRef<string | null>(null);

  const oracleStore = useOracleStore();
  const pendingOpen = useOracleStore((s) => s.pendingOpen);
  const consumePending = useOracleStore((s) => s.consumePending);
  const isCircuitBroken = failCount >= 3;
  const [retryInfo, setRetryInfo] = useState<{
    retryable: boolean;
    retryAfterMs: number | null;
    lastMessage: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lightCycle = useLightCycle();

  const pathname = usePathname();
  const isMapPage = pathname?.startsWith("/zemljevid") ?? false;
  const fabPosition = "bottom-6 right-6";
  const panelPosition = "bottom-6 right-6";
  const panelOrigin = "bottom right";
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);

      const stored = oracleStore.messages;
      if (stored.length > 0) {
        setMessages(stored.map((m) => ({ role: m.role, content: m.content })));
        return;
      }

      const greeting: OracleMessage = { role: "assistant", content: GREETINGS[locale] };
      setMessages([greeting]);
      oracleStore.addMessage({ role: greeting.role, content: greeting.content });
    }
  }, [isOpen, hasGreeted, locale, oracleStore]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Magic Fold: openOracle() from anywhere → consume pending, open panel, auto-send seed
  useEffect(() => {
    if (!pendingOpen) return;
    const { message: seed } = consumePending();
    pendingMsgRef.current = seed;
    setIsOpen(true);
  }, [pendingOpen, consumePending]);

  // When panel opens with a pending seed message, auto-send after greeting renders
  useEffect(() => {
    if (!isOpen || !pendingMsgRef.current) return;
    const seed = pendingMsgRef.current;
    pendingMsgRef.current = null;
    const id = setTimeout(() => sendMessage(seed), 700);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 45_000);

      const userMessage: OracleMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      oracleStore.addMessage({ role: "user", content: text });
      setInput("");
      setIsLoading(true);
      setStatusPhase("intent");
      setRetryInfo(null);
      if (isCircuitBroken) return;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", isStreaming: true },
      ]);

      let accumulated = "";
      let farmCards: FarmCard[] = [];
      let roadTripHint: RoadTripHint | null = null;

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
                } catch {
                  /* skip */
                }
              } else if (currentEvent === "farms") {
                try {
                  const d = JSON.parse(raw) as { farms: FarmCard[] };
                  farmCards = d.farms;
                } catch {
                  /* skip */
                }
              } else if (currentEvent === "roadtrip_hint") {
                try {
                  roadTripHint = JSON.parse(raw) as RoadTripHint;
                } catch {
                  /* skip */
                }
              } else if (currentEvent === "map_context") {
                try {
                  const ctx = JSON.parse(raw) as MapContextData;
                  setMapContext(ctx);
                  // Broadcast to Mapbox on the /zemljevid page if it's open in the same tab
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("oracle:map_context", { detail: ctx }));
                  }
                } catch { /* skip */ }
              } else if (currentEvent === "shadow_verdict") {
                try {
                  const verdict = JSON.parse(raw) as { ok: boolean; issues: string[] };
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === "assistant") {
                      next[next.length - 1] = { ...last, shadowVerdict: verdict };
                    }
                    return next;
                  });
                } catch { /* skip */ }
              } else if (currentEvent === "error") {
                try {
                  const d = JSON.parse(raw) as {
                    retryable?: boolean;
                    retryAfterMs?: number | null;
                  };
                  if (d.retryable) {
                    setRetryInfo({
                      retryable: true,
                      retryAfterMs: d.retryAfterMs ?? null,
                      lastMessage: text,
                    });
                  }
                } catch {
                  /* skip */
                }
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
                } catch {
                  /* non-JSON data line */
                }
              }
            } else if (line === "") {
              currentEvent = null;
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setFailCount((c) => c + 1);
        Sentry.captureException(err, { tags: { feature: "oracle", action: "stream" } });
        accumulated =
          locale === "sl"
            ? "Oj, počakajte hip — šel sem v klet po eno dobro. Poskusite znova čez trenutek. *Ker lepa beseda lepo mesto najde.*"
            : "Ah, hold on — I just went to the wine cellar for a good one. Try again in a moment.";
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setStatusPhase(null);
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = {
              ...last,
              content: accumulated,
              farmCards: farmCards.length > 0 ? farmCards : undefined,
              roadTripHint: roadTripHint ?? undefined,
              isStreaming: false,
            };
          }
          return next;
        });
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

  const panelWidth = isExpanded ? "min(680px, 96vw)" : "min(420px, 96vw)";
  const panelHeight = isExpanded ? "min(720px, 85vh)" : "min(580px, 82vh)";

  const statusLabel = statusPhase
    ? STATUS_LABELS[statusPhase]?.[locale] ?? "..."
    : null;

  const userHasSpoken = messages.filter((m) => m.role === "user").length > 0;

  return (
    <>
      {/* ── Floating trigger — wooden stamp FAB ────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="oracle-fab-wrap"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={`fixed ${fabPosition} flex items-end gap-3 select-none`}
            style={{ zIndex: "var(--z-oracle)" }}
          >
            {/* Handwritten callout — hidden on map & mobile to save space */}
            {!isMapPage && !isCircuitBroken && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="hidden md:block mb-2 mr-1 card-polaroid journal-tilt-l px-4 py-2 bg-white"
                style={{ transformOrigin: "bottom right" }}
              >
                <span className="tape-strip tape-strip-tr" aria-hidden="true" />
                <p className="handwritten text-forest-800 text-lg leading-none whitespace-nowrap">
                  Vprašaj Jožeta
                </p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-earth-500 mt-1 text-center">
                  {lightCycle.name}
                </p>
              </motion.div>
            )}

            <motion.button
              onClick={() => {
                if (isCircuitBroken) return;
                setIsOpen(true);
              }}
              whileHover={{ scale: 1.05, rotate: -3 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-14 w-14 rounded-full flex items-center justify-center firefly-glow"
              style={{
                background: isCircuitBroken
                  ? "radial-gradient(circle at 30% 30%, #8a8a80, #5a5a50)"
                  : `radial-gradient(circle at 30% 30%, ${lightCycle.accent}ee, ${lightCycle.accent}aa 60%, ${lightCycle.accent}cc 100%)`,
                boxShadow: isCircuitBroken
                  ? "0 6px 16px rgba(0,0,0,0.2)"
                  : `0 10px 28px ${lightCycle.accent}55, inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.22)`,
                cursor: isCircuitBroken ? "not-allowed" : "pointer",
              }}
              aria-label="Vprašaj Jožeta"
            >
              {isCircuitBroken ? (
                <Leaf size={22} className="text-white/70" />
              ) : (
                <>
                  {/* Portrait fills the FAB — the button's radial gradient
                      already provides the backdrop. */}
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <JozePortrait size={56} />
                  </div>
                  {/* Pulse ring */}
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 pointer-events-none"
                    style={{ borderColor: lightCycle.accent }}
                    animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat panel ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="oracle-panel"
            initial={{ opacity: 0, scale: 0.92, y: 24, transformOrigin: panelOrigin }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className={`fixed ${panelPosition} flex flex-col overflow-hidden rounded-[28px]`}
            style={{
              zIndex: "var(--z-oracle)",
              width: panelWidth,
              height: panelHeight,
              background: "#fdf8ee",
              border: "1px solid rgba(45,90,39,0.18)",
              boxShadow: `
                0 40px 100px rgba(0,0,0,0.18),
                0 12px 32px rgba(45,90,39,0.14),
                0 0 0 1px rgba(255,255,255,0.4) inset,
                0 0 80px ${lightCycle.accent}20`,
            }}
          >
            {/* Paper grain texture overlay */}
            <div
              aria-hidden="true"
              className="texture-paper absolute inset-0 rounded-[28px] pointer-events-none"
            />

            {/* ── Header — watercolor wash + wax seal ─────────────────────── */}
            <div
              className="relative flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${lightCycle.wash}dd 0%, ${lightCycle.wash}66 70%, transparent 100%)`,
              }}
            >
              <JozeAvatar accent={lightCycle.accent} size={44} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-black text-forest-900 leading-none">
                    Jože
                  </p>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm"
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
                      className="handwritten text-forest-700 text-base leading-tight mt-0.5"
                    >
                      {statusLabel}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="handwritten text-forest-700/90 text-base leading-tight mt-0.5"
                    >
                      {locale === "sl"
                        ? "vaš kmečki vodnik"
                        : locale === "de"
                        ? "Ihr Reiseführer"
                        : locale === "it"
                        ? "la vostra guida"
                        : "your countryside guide"}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-1 relative z-10">
                <button
                  onClick={() => setIsExpanded((e) => !e)}
                  className="p-1.5 rounded-lg text-earth-500 hover:text-forest-700 hover:bg-white/70 transition-all"
                  aria-label={isExpanded ? "Zmanjšaj" : "Razširi"}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-earth-500 hover:text-forest-700 hover:bg-white/70 transition-all"
                  aria-label="Zapri"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Ink ripple divider */}
            <div className="relative flex-shrink-0 px-5 -mt-1">
              <InkDivider color={lightCycle.accent} />
            </div>

            {/* Map context pill — shown when Oracle has found farms with coords */}
            <AnimatePresence>
              {mapContext && mapContext.farms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex-shrink-0 px-4 pt-1 pb-0"
                >
                  <Link
                    href={`/zemljevid?farms=${mapContext.farms.map((f) => f.slug).join(",")}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 border border-forest-200/70 px-3 py-1 text-[10px] font-semibold text-forest-700 hover:bg-forest-100 transition-colors"
                  >
                    <MapPin size={10} />
                    Prikaži {mapContext.farms.length} {mapContext.farms.length === 1 ? "kmetijo" : "kmetije"} na zemljevidu
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Messages ────────────────────────────────────────────────── */}
            <div className="relative flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} accentColor={lightCycle.accent} />
                ))}
              </AnimatePresence>

              {/* Retry prompt */}
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
                      className="flex items-center gap-2 rounded-full bg-white hover:bg-forest-50 border border-earth-200 hover:border-forest-300 px-4 py-2 text-xs font-semibold text-earth-700 hover:text-forest-800 shadow-sm transition-all"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {locale === "sl"
                        ? "Poskusi znova"
                        : locale === "de"
                        ? "Erneut versuchen"
                        : locale === "it"
                        ? "Riprova"
                        : "Try again"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* ── Suggestion chips (only before user's first message) ─ */}
            <AnimatePresence>
              {!userHasSpoken && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative px-4 pb-2 flex flex-wrap gap-2"
                >
                  {SUGGESTIONS[locale].map((s, i) => (
                    <motion.button
                      key={s}
                      onClick={() => sendMessage(s)}
                      disabled={isLoading}
                      whileHover={{ y: -2, rotate: 0 }}
                      whileTap={{ scale: 0.96 }}
                      className={`rounded-full bg-white hover:bg-amber-50 border border-earth-200 hover:border-amber-300 px-3 py-1.5 text-xs text-earth-700 hover:text-forest-800 font-medium shadow-sm transition-colors disabled:opacity-50 ${
                        i % 2 === 0 ? "rotate-[-1deg]" : "rotate-[0.8deg]"
                      }`}
                    >
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input area ──────────────────────────────────────────────── */}
            <div
              className="relative flex-shrink-0 px-4 pb-4 pt-3"
              style={{ borderTop: "1px dashed rgba(45,90,39,0.18)" }}
            >
              <div
                className="flex items-end gap-2 rounded-2xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.96)",
                  border: `1.5px solid ${
                    isLoading ? lightCycle.accent + "99" : "rgba(45,90,39,0.2)"
                  }`,
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
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
                  className="flex-1 resize-none bg-transparent text-sm text-forest-900 placeholder:text-earth-500 focus:outline-none leading-relaxed max-h-28 overflow-y-auto"
                  style={{ scrollbarWidth: "none" }}
                />

                <motion.button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim() || isCircuitBroken}
                  whileTap={{ scale: 0.88, rotate: -6 }}
                  whileHover={input.trim() && !isLoading ? { scale: 1.05 } : undefined}
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-all relative"
                  style={{
                    background:
                      input.trim() && !isLoading && !isCircuitBroken
                        ? `radial-gradient(circle at 30% 30%, ${lightCycle.accent}ee, ${lightCycle.accent}aa 60%, ${lightCycle.accent}cc 100%)`
                        : "radial-gradient(circle at 30% 30%, #b7beb7, #8a938a)",
                    boxShadow:
                      input.trim() && !isLoading && !isCircuitBroken
                        ? `0 4px 10px ${lightCycle.accent}55, inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -2px 3px rgba(0,0,0,0.2)`
                        : "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  aria-label="Pošlji"
                >
                  {isLoading ? (
                    <motion.span
                      className="block w-4 h-4 border-2 border-white/50 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <Send size={15} />
                  )}
                </motion.button>
              </div>

              {/* Handwritten signature footer */}
              <p className="handwritten text-center text-earth-500 text-base mt-2 leading-none">
                — z ljubeznijo, Jože
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
