"use client";

// =============================================================================
// NaKmetiji.si — Jožetov Road Trip Wizard Steps
// Sub-components for each step of the guided conversational wizard.
// Used by RoadTripPlannerClient.tsx
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Heart,
  Dog,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Mountain,
  Wine,
  TreePine,
  Users,
  Baby,
  Leaf,
  Star,
} from "lucide-react";
import { REGIJE, type Regija } from "@/types/database";
import { REGION_LABELS } from "@/types/farm";
import { pluralPair } from "@/lib/plural";

// ---------------------------------------------------------------------------
// Jože's conversational messages per step
// ---------------------------------------------------------------------------

const JOZE_STEP_MESSAGES = {
  region: "Pozdravljeni! Jst sm Jože. Kam pa vas vleče srce?",
  duration: "Lepo. Za kolko dni bi šli, da nau prehitro minilo?",
  vibe: "Kakšen pa je vaš vibe? Povejte mi, kaj si želite.",
  review: "Tako torej. Poglejmo, kaj sem sestavil.",
} as const;

const JOZE_PROACTIVE_FALLBACK =
  "Ne de, jst bom naredu nekaj romantičnega po Goriških Brdih, ok? Pa bomo vidli, da bo fino.";

// ---------------------------------------------------------------------------
// Region emoji map
// ---------------------------------------------------------------------------

const REGION_EMOJI: Record<Regija, string> = {
  gorenjska: "🏔️",
  primorska: "☀️",
  stajerska: "🍇",
  dolenjska: "🌿",
  koroska: "⛰️",
  savinjska: "🌾",
  pomurska: "🌻",
  notranjska: "🌲",
  zasavska: "🏗️",
  posavska: "🍷",
  jugovzhodna_slovenija: "🌳",
  osrednjeslovenska: "🏛️",
};

const REGION_TAGLINES: Record<Regija, string> = {
  gorenjska: "Planine in jezera",
  primorska: "Morje in oljke",
  stajerska: "Vino in gorice",
  dolenjska: "Cviček in Krka",
  koroska: "Gorski zrak",
  savinjska: "Hmelj in terme",
  pomurska: "Ravnina in mir",
  notranjska: "Pragozd in jame",
  zasavska: "Zelene doline",
  posavska: "Ob Savi",
  jugovzhodna_slovenija: "Bela krajina",
  osrednjeslovenska: "Mesto in podeželje",
};

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface WizardData {
  regions: Regija[];
  days: number;
  vibes: string[];
  withDog: boolean;
}

interface StepProps {
  data: WizardData;
  onUpdate: (patch: Partial<WizardData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Jože speech bubble
// ---------------------------------------------------------------------------

export function JozeBubble({
  message,
  regionGreeting,
}: {
  message: string;
  regionGreeting?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [showGreeting, setShowGreeting] = useState(false);
  const text = message;

  useEffect(() => {
    setDisplayed("");
    setShowGreeting(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        if (regionGreeting) {
          setTimeout(() => setShowGreeting(true), 300);
        }
      }
    }, 25);
    return () => clearInterval(interval);
  }, [text, regionGreeting]);

  return (
    <div className="flex items-start gap-3 mb-6">
      {/* Jože avatar */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-forest-600 to-forest-800 flex items-center justify-center shadow-lg ring-2 ring-forest-200">
        <span className="text-lg">🧔</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-forest-600/70 mb-1">
          Jože
        </p>
        <div className="rounded-2xl rounded-tl-sm bg-forest-50 border border-forest-200/60 px-4 py-3 shadow-sm">
          <p className="text-sm text-forest-900 leading-relaxed">
            {displayed}
            <span className="inline-block w-0.5 h-4 bg-forest-600 ml-0.5 animate-pulse align-text-bottom" />
          </p>
          <AnimatePresence>
            {showGreeting && regionGreeting && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-forest-700 font-medium mt-2 italic"
              >
                {regionGreeting}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Region selection
// ---------------------------------------------------------------------------

export function StepRegion({ data, onUpdate, onNext }: StepProps) {
  const [showFallback, setShowFallback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Proactive fallback: if user doesn't interact within 8s
  useEffect(() => {
    if (data.regions.length > 0) return;
    timerRef.current = setTimeout(() => setShowFallback(true), 8000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data.regions.length]);

  const toggleRegion = useCallback(
    (r: Regija) => {
      setShowFallback(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      const next = data.regions.includes(r)
        ? data.regions.filter((x) => x !== r)
        : data.regions.length >= 6
        ? data.regions
        : [...data.regions, r];
      onUpdate({ regions: next });
    },
    [data.regions, onUpdate],
  );

  const applyFallback = useCallback(() => {
    onUpdate({ regions: ["primorska"], vibes: ["romanticna"] });
    setShowFallback(false);
  }, [onUpdate]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <JozeBubble message={JOZE_STEP_MESSAGES.region} />

      {/* Proactive fallback */}
      <AnimatePresence>
        {showFallback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3"
          >
            <p className="text-sm text-amber-900 mb-2">
              <strong>Jože predlaga:</strong> {JOZE_PROACTIVE_FALLBACK}
            </p>
            <button
              onClick={applyFallback}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-600 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full px-3 py-1.5 transition-all"
            >
              <Sparkles size={12} /> Sprejmi predlog
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Region grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
        {REGIJE.map((r) => {
          const active = data.regions.includes(r);
          return (
            <button
              key={r}
              onClick={() => toggleRegion(r)}
              className={`group relative rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-200 ${
                active
                  ? "bg-forest-700 border-forest-700 text-white shadow-lg shadow-forest-700/20 scale-[1.02]"
                  : "bg-white border-earth-200 text-forest-800 hover:border-forest-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-lg leading-none">
                  {REGION_EMOJI[r]}
                </span>
                <span className="font-bold text-sm">{REGION_LABELS[r]}</span>
              </div>
              <p
                className={`text-[11px] ${
                  active ? "text-white/70" : "text-earth-500"
                }`}
              >
                {REGION_TAGLINES[r]}
              </p>
              {active && (
                <motion.div
                  layoutId="region-check"
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <span className="text-xs">✓</span>
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-earth-500">
          {data.regions.length}/6 regij izbrano
        </p>
        <button
          onClick={onNext}
          disabled={data.regions.length === 0}
          className="inline-flex items-center gap-2 rounded-2xl bg-forest-700 hover:bg-forest-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-3 text-sm shadow-lg shadow-forest-700/20 hover:shadow-xl transition-all"
        >
          Naprej <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Duration
// ---------------------------------------------------------------------------

const DURATION_COMMENTS: Record<number, string> = {
  1: "En dan? To bo hiter izlet, ampak bo vredno!",
  2: "Dva dneva — ravno prav za vikend pobeg.",
  3: "Tri dni — klasika. Pravi tempo za odkrivanje.",
  4: "Štiri dni — podaljšan vikend, da se res nadišeš.",
  5: "Pet dni — zdaj pa gremo zares! Počasi in daleč.",
  6: "Šest dni — skoraj cel teden. Bo neponovljivo.",
  7: "En teden — teden, poln miru in dobrih jedi.",
};

export function StepDuration({ data, onUpdate, onNext, onBack }: StepProps) {
  const comment = DURATION_COMMENTS[data.days] ?? `${data.days} dni — bo epska pot!`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <JozeBubble message={JOZE_STEP_MESSAGES.duration} />

      <div className="rounded-3xl bg-white border border-earth-200/80 p-6 sm:p-8 shadow-sm mb-6">
        {/* Visual slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-earth-500">
              Trajanje
            </span>
            <span className="font-display text-3xl font-black text-forest-900">
              {pluralPair(data.days, "dan")}
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={10}
            value={data.days}
            onChange={(e) => onUpdate({ days: parseInt(e.target.value, 10) })}
            className="w-full accent-forest-700 h-2"
          />

          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-earth-400">1 dan</span>
            <span className="text-[10px] text-earth-400">10 dni</span>
          </div>
        </div>

        {/* Jože's comment about duration */}
        <motion.div
          key={data.days}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl bg-forest-50 border border-forest-100 px-3 py-2.5"
        >
          <Clock size={14} className="text-forest-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-forest-800 italic">{comment}</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 font-medium transition-colors"
        >
          <ChevronLeft size={14} /> Nazaj
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-2xl bg-forest-700 hover:bg-forest-600 text-white font-bold px-6 py-3 text-sm shadow-lg shadow-forest-700/20 hover:shadow-xl transition-all"
        >
          Naprej <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Vibe selection
// ---------------------------------------------------------------------------

const VIBE_OPTIONS: { key: string; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "tiha", label: "Tiho & Mirno", icon: <TreePine size={18} />, color: "emerald" },
  { key: "romanticna", label: "Romantično", icon: <Heart size={18} />, color: "rose" },
  { key: "druzinska", label: "Družinsko", icon: <Users size={18} />, color: "sky" },
  { key: "eko", label: "Eko & Naravno", icon: <Leaf size={18} />, color: "green" },
  { key: "luksuzna", label: "Razvajanje", icon: <Star size={18} />, color: "amber" },
  { key: "vino", label: "Vino & Kulinarika", icon: <Wine size={18} />, color: "purple" },
  { key: "pustolovska", label: "Pustolovina", icon: <Mountain size={18} />, color: "orange" },
  { key: "hrana", label: "Kulinarični izlet", icon: <Baby size={18} />, color: "red" },
];

const VIBE_COLORS: Record<string, { active: string; inactive: string }> = {
  emerald: { active: "bg-emerald-100 border-emerald-400 text-emerald-900", inactive: "hover:border-emerald-300" },
  rose: { active: "bg-rose-100 border-rose-400 text-rose-900", inactive: "hover:border-rose-300" },
  sky: { active: "bg-sky-100 border-sky-400 text-sky-900", inactive: "hover:border-sky-300" },
  green: { active: "bg-green-100 border-green-400 text-green-900", inactive: "hover:border-green-300" },
  amber: { active: "bg-amber-100 border-amber-400 text-amber-900", inactive: "hover:border-amber-300" },
  purple: { active: "bg-purple-100 border-purple-400 text-purple-900", inactive: "hover:border-purple-300" },
  orange: { active: "bg-orange-100 border-orange-400 text-orange-900", inactive: "hover:border-orange-300" },
  red: { active: "bg-red-100 border-red-400 text-red-900", inactive: "hover:border-red-300" },
};

export function StepVibe({ data, onUpdate, onNext, onBack }: StepProps) {
  const toggleVibe = useCallback(
    (v: string) =>
      onUpdate({
        vibes: data.vibes.includes(v)
          ? data.vibes.filter((x) => x !== v)
          : [...data.vibes, v],
      }),
    [data.vibes, onUpdate],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <JozeBubble message={JOZE_STEP_MESSAGES.vibe} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {VIBE_OPTIONS.map((v) => {
          const active = data.vibes.includes(v.key);
          const colors = VIBE_COLORS[v.color];
          return (
            <button
              key={v.key}
              onClick={() => toggleVibe(v.key)}
              className={`rounded-2xl border-2 px-3 py-3.5 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                active
                  ? `${colors.active} shadow-md scale-[1.03]`
                  : `bg-white border-earth-200 text-earth-700 ${colors.inactive}`
              }`}
            >
              <span className={active ? "" : "text-earth-400"}>{v.icon}</span>
              <span className="text-xs font-semibold text-center leading-tight">
                {v.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dog toggle */}
      <button
        onClick={() => onUpdate({ withDog: !data.withDog })}
        className={`w-full rounded-2xl border-2 px-4 py-3 flex items-center gap-3 transition-all mb-6 ${
          data.withDog
            ? "bg-amber-50 border-amber-300 text-amber-900"
            : "bg-white border-earth-200 text-earth-600 hover:border-amber-300"
        }`}
      >
        <Dog size={20} className={data.withDog ? "text-amber-600" : "text-earth-400"} />
        <span className="text-sm font-semibold">S psom</span>
        {data.withDog && (
          <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            🐕 Prihaja!
          </span>
        )}
      </button>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 font-medium transition-colors"
        >
          <ChevronLeft size={14} /> Nazaj
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-2xl bg-forest-700 hover:bg-forest-600 text-white font-bold px-6 py-3 text-sm shadow-lg shadow-forest-700/20 hover:shadow-xl transition-all"
        >
          Naprej <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Review & Submit
// ---------------------------------------------------------------------------

const VIBE_LABEL_MAP: Record<string, string> = {
  tiha: "tiho & mirno",
  romanticna: "romantično",
  druzinska: "družinsko",
  eko: "eko",
  luksuzna: "razvajanje",
  vino: "vino & kulinarika",
  pustolovska: "pustolovina",
  hrana: "kulinarični izlet",
};

export function StepReview({
  data,
  onBack,
  onSubmit,
  loading,
}: StepProps & { onSubmit: () => void; loading: boolean }) {
  const regionNames = data.regions.map((r) => REGION_LABELS[r]).join(", ");
  const vibeNames = data.vibes.map((v) => VIBE_LABEL_MAP[v] ?? v).join(", ");

  const summary = [
    `${pluralPair(data.days, "dan")}`,
    vibeNames ? vibeNames : "brez posebnega viba",
    `po regijah: ${regionNames}`,
    data.withDog ? "s psom" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <JozeBubble message={`Torej: ${summary}. Dajmo pogledat, kaj imam za vas!`} />

      {/* Summary card */}
      <div className="rounded-3xl bg-white border border-earth-200/80 p-6 shadow-sm mb-6 space-y-4">
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-forest-600" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-earth-500">
              Regije
            </p>
            <p className="text-sm font-semibold text-forest-900">
              {regionNames}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock size={16} className="text-forest-600" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-earth-500">
              Trajanje
            </p>
            <p className="text-sm font-semibold text-forest-900">
              {pluralPair(data.days, "dan")}
            </p>
          </div>
        </div>

        {vibeNames && (
          <div className="flex items-center gap-3">
            <Heart size={16} className="text-forest-600" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-earth-500">
                Vibe
              </p>
              <p className="text-sm font-semibold text-forest-900 capitalize">
                {vibeNames}
              </p>
            </div>
          </div>
        )}

        {data.withDog && (
          <div className="flex items-center gap-3">
            <Dog size={16} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              S psom 🐕
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 font-medium transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={14} /> Popravek
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-forest-700 to-forest-600 hover:from-forest-600 hover:to-forest-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 text-sm shadow-lg shadow-forest-700/20 hover:shadow-xl transition-all"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Jože načrtuje pot…
            </>
          ) : (
            <>
              <Sparkles size={16} /> Sestavi mojo pot
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
