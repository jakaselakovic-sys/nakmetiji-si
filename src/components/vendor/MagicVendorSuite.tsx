"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ImageIcon, Languages, TrendingUp, TrendingDown, Minus,
  Wand2, CheckCircle, AlertCircle, Copy, Check, Loader2, Star,
} from "lucide-react";
import { REGIJA_LABELS, REGIJE } from "@/types/database";

// ─── API response types ─────────────────────────────────────────────────────

interface AppleifyResult {
  score: number;
  composition: string;
  lighting: string;
  mood: string;
  improvements: string[];
  upscale_benefit: boolean;
  heroworthy: boolean;
}

interface StorytellerResult {
  sl: string;
  en: string;
  de: string;
  it: string;
  seo_keywords?: { sl?: string[]; en?: string[] };
}

interface HeatmapMonth {
  month: number;
  label: string;
  demand: number;
  isCurrent: boolean;
  isTarget: boolean;
}

interface PriceAdvisorResult {
  direction: "up" | "down" | "hold";
  pct: number;
  suggestedPrice: number;
  currentPrice: number;
  events: { mesec: number; ime: string; opis: string; boost: number }[];
  weather: { icon: string; label: string; factor: number };
  reasoning: string;
  benchmark: number;
  targetMonth: number;
  targetMonthLabel: string;
  projectedOccupancy: number;
  revenueImpact: number;
  currentRevenue: number;
  projectedRevenue: number;
  heatmap: HeatmapMonth[];
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? "Kopirano" : "Kopiraj"}
    </button>
  );
}

const selectCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 appearance-none cursor-pointer";

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400";

const labelCls = "block text-xs font-semibold uppercase tracking-widest mb-2";

// ─── Apple-ify Tab ───────────────────────────────────────────────────────────

function AppleifyTab() {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AppleifyResult | null>(null);

  async function handleAnalyze() {
    if (!imageUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/vendor/apple-ify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Analiza ni uspela.");
      } else {
        setResult(data.analysis);
      }
    } catch {
      setError("Napaka pri povezavi. Poskusite znova.");
    } finally {
      setLoading(false);
    }
  }

  const MOOD_COLORS: Record<string, string> = {
    rustic: "text-amber-400", authentic: "text-orange-400", professional: "text-blue-400",
    amateur: "text-red-400", warm: "text-yellow-400", cold: "text-cyan-400",
    vibrant: "text-green-400", flat: "text-slate-400",
  };

  return (
    <div className="space-y-5">
      {/* URL Input */}
      <div>
        <label className={`${labelCls} text-pink-300`}>URL vaše slike</label>
        <div className="flex gap-3">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... (javno dostopna slika z vaše kmetije)"
            className={inputCls}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !imageUrl.trim()}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 disabled:opacity-40 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-[0_0_20px_rgba(236,72,153,0.25)]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {loading ? "Analiziram..." : "Analiziraj"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Prilepite URL javno dostopne fotografije vaše kmetije (Supabase storage, spletna stran…)
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score + badges */}
            <div className="flex flex-wrap items-center gap-4 bg-black/30 rounded-2xl p-5 border border-white/10">
              {/* Score gauge */}
              <div className="flex flex-col items-center min-w-[80px]">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={result.score >= 8 ? "#4ade80" : result.score >= 6 ? "#facc15" : "#f87171"}
                      strokeWidth="3"
                      strokeDasharray={`${(result.score / 10) * 100} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-white">{result.score}</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-1">/ 10</span>
              </div>

              {/* Mood + flags */}
              <div className="flex-1 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 border border-white/10 uppercase tracking-wider ${MOOD_COLORS[result.mood] ?? "text-white"}`}>
                  <Star size={11} /> {result.mood}
                </span>
                {result.heroworthy && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500/20 border border-yellow-400/30 text-yellow-300">
                    ★ Hero worthy
                  </span>
                )}
                {result.upscale_benefit && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                    ↑ Upscale priporočen
                  </span>
                )}
              </div>
            </div>

            {/* Technical analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Kompozicija</p>
                <p className="text-sm text-slate-200">{result.composition}</p>
              </div>
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Svetloba</p>
                <p className="text-sm text-slate-200">{result.lighting}</p>
              </div>
            </div>

            {/* Improvements */}
            <div className="bg-pink-950/20 border border-pink-500/20 rounded-xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-pink-400 mb-3 font-bold">
                3 konkretne izboljšave
              </p>
              <ol className="space-y-2.5">
                {result.improvements.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[11px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Storyteller Tab ─────────────────────────────────────────────────────────

const LANG_TABS = [
  { key: "sl", label: "🇸🇮 SL", color: "emerald" },
  { key: "en", label: "🇬🇧 EN", color: "blue" },
  { key: "de", label: "🇩🇪 DE", color: "yellow" },
  { key: "it", label: "🇮🇹 IT", color: "red" },
] as const;
type LangKey = "sl" | "en" | "de" | "it";

function StorytellerTab() {
  const [kmetijaIme, setKmetijaIme] = useState("");
  const [regija, setRegija] = useState<string>("gorenjska");
  const [bulletsText, setBulletsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StorytellerResult | null>(null);
  const [activeTab, setActiveTab] = useState<LangKey>("sl");

  async function handleGenerate() {
    const bullets = bulletsText
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);

    if (bullets.length < 2) {
      setError("Vnesite vsaj 2 ključni točki.");
      return;
    }
    if (!kmetijaIme.trim()) {
      setError("Ime kmetije je obvezno.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/vendor/storyteller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullets, kmetijaIme: kmetijaIme.trim(), regija }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Generiranje ni uspelo.");
      } else {
        setResult({ sl: data.sl, en: data.en, de: data.de, it: data.it, seo_keywords: data.seo_keywords });
      }
    } catch {
      setError("Napaka pri povezavi. Poskusite znova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={`${labelCls} text-emerald-300`}>Ime kmetije</label>
          <input
            type="text"
            value={kmetijaIme}
            onChange={(e) => setKmetijaIme(e.target.value)}
            placeholder="npr. Kmetija Planšar"
            className={inputCls}
          />
        </div>
        <div>
          <label className={`${labelCls} text-emerald-300`}>Regija</label>
          <select
            value={regija}
            onChange={(e) => setRegija(e.target.value)}
            className={selectCls}
          >
            {REGIJE.map((r) => (
              <option key={r} value={r} className="bg-slate-900">
                {REGIJA_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={`${labelCls} text-emerald-300`}>
          Ključne točke (vsaka v svoji vrstici)
        </label>
        <textarea
          value={bulletsText}
          onChange={(e) => setBulletsText(e.target.value)}
          placeholder={`- tišina in gozd\n- ekološki zajtrk iz lastne pridelave\n- savna na drva\n- pogled na Julijske Alpe\n- konji in jahanje za otroke`}
          className={`${inputCls} min-h-[140px] resize-none`}
        />
        <p className="mt-1.5 text-[11px] text-slate-500">Vsaj 2 točki. Vsaka v svoji vrstici (- ali brez).</p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !kmetijaIme.trim() || !bulletsText.trim()}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Sestavljam zgodbo v 4 jezikih...</>
        ) : (
          <><Languages size={16} /> Ustvari 4-jezični opis</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Language tabs */}
            <div className="flex gap-2">
              {LANG_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${
                    activeTab === t.key
                      ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Description */}
            <div className="relative bg-black/30 border border-white/10 rounded-2xl p-5">
              <div className="absolute top-4 right-4">
                <CopyButton text={result[activeTab]} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Pripravljeno za objavo
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed pr-16">
                {result[activeTab]}
              </p>
            </div>

            {/* SEO keywords */}
            {result.seo_keywords && (
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2.5 font-bold">SEO ključne besede</p>
                <div className="flex flex-wrap gap-2">
                  {[...(result.seo_keywords.sl ?? []), ...(result.seo_keywords.en ?? [])].map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Price Advisor Tab ───────────────────────────────────────────────────────

function PriceAdvisorTab() {
  const [priceStr, setPriceStr] = useState("");
  const [regija, setRegija] = useState<string>("gorenjska");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PriceAdvisorResult | null>(null);

  async function handleAdvisory() {
    const currentPrice = parseFloat(priceStr);
    if (!priceStr || isNaN(currentPrice) || currentPrice < 10) {
      setError("Vnesite veljavno ceno (min. 10 €).");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/vendor/price-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPrice, regija }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Napaka pri svetovalcu.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Napaka pri povezavi. Poskusite znova.");
    } finally {
      setLoading(false);
    }
  }

  const DIRECTION_CONFIG = {
    up:   { icon: TrendingUp,   color: "text-green-400",  bg: "bg-green-500/20",  border: "border-green-500/30",  label: "Dvig cene" },
    down: { icon: TrendingDown, color: "text-red-400",    bg: "bg-red-500/20",    border: "border-red-500/30",    label: "Znižanje cene" },
    hold: { icon: Minus,        color: "text-amber-400",  bg: "bg-amber-500/20",  border: "border-amber-500/30",  label: "Ohrani ceno" },
  };

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={`${labelCls} text-amber-300`}>Trenutna cena (€/noč)</label>
          <input
            type="number"
            min={10}
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            placeholder="npr. 85"
            className={inputCls}
          />
        </div>
        <div>
          <label className={`${labelCls} text-amber-300`}>Regija</label>
          <select
            value={regija}
            onChange={(e) => setRegija(e.target.value)}
            className={selectCls}
          >
            {REGIJE.map((r) => (
              <option key={r} value={r} className="bg-slate-900">
                {REGIJA_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleAdvisory}
        disabled={loading || !priceStr}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-amber-950 font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Analiziram trg...</>
        ) : (
          <><TrendingUp size={16} /> Pridobi priporočilo za ceno</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (() => {
          const cfg = DIRECTION_CONFIG[result.direction];
          const DirectionIcon = cfg.icon;

          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Direction hero */}
              <div className={`flex items-center justify-between ${cfg.bg} border ${cfg.border} rounded-2xl p-5`}>
                <div>
                  <div className={`flex items-center gap-2 ${cfg.color} font-bold text-base mb-1`}>
                    <DirectionIcon size={20} />
                    {cfg.label}
                    {result.pct > 0 && <span>{result.direction === "up" ? "+" : "-"}{result.pct}%</span>}
                  </div>
                  <p className="text-sm text-slate-300">{result.reasoning}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Ciljni mesec: <span className="font-semibold text-white">{result.targetMonthLabel}</span>
                    &nbsp;· Regionalna osnova: <span className="font-semibold text-white">{result.benchmark} €</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0 pl-4">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400">Predlagano</p>
                  <p className={`text-3xl font-black ${cfg.color}`}>{result.suggestedPrice} €</p>
                  <p className="text-xs text-slate-400">bil. {result.currentPrice} €</p>
                </div>
              </div>

              {/* Revenue impact */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Trenuten prih.</p>
                  <p className="text-lg font-bold text-white">{result.currentRevenue} €</p>
                  <p className="text-[10px] text-slate-500">/ mesec</p>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Napoved</p>
                  <p className="text-lg font-bold text-white">{result.projectedRevenue} €</p>
                  <p className="text-[10px] text-slate-500">{result.projectedOccupancy}% zased.</p>
                </div>
                <div className={`border rounded-xl p-4 text-center ${result.revenueImpact >= 0 ? "bg-green-900/20 border-green-500/20" : "bg-red-900/20 border-red-500/20"}`}>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Razlika</p>
                  <p className={`text-lg font-bold ${result.revenueImpact >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {result.revenueImpact >= 0 ? "+" : ""}{result.revenueImpact} €
                  </p>
                  <p className="text-[10px] text-slate-500">/ mesec</p>
                </div>
              </div>

              {/* Events */}
              {result.events.length > 0 && (
                <div className="bg-black/20 border border-white/10 rounded-xl p-4 space-y-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Regionalni dogodki</p>
                  {result.events.map((e, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{e.ime}</p>
                        <p className="text-xs text-slate-400">{e.opis}</p>
                      </div>
                      <span className="flex-shrink-0 text-sm font-bold text-amber-400">+{Math.round(e.boost * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Weather */}
              <div className="flex items-center gap-3 bg-black/20 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-2xl">{result.weather.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{result.weather.label}</p>
                  <p className="text-xs text-slate-400">
                    Vremenski faktor: {result.weather.factor >= 0 ? "+" : ""}{Math.round(result.weather.factor * 100)}%
                  </p>
                </div>
              </div>

              {/* 12-month heatmap */}
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Sezonska krivulja povpraševanja</p>
                <div className="flex items-end gap-1 h-16">
                  {result.heatmap.map((m) => {
                    const pct = Math.max(10, Math.min(100, m.demand - 50));
                    const bg = m.isTarget
                      ? "bg-amber-400"
                      : m.isCurrent
                      ? "bg-indigo-400"
                      : m.demand >= 115
                      ? "bg-green-500/70"
                      : m.demand >= 95
                      ? "bg-green-700/50"
                      : "bg-slate-600/50";
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          title={`${m.label}: ${m.demand}%`}
                          style={{ height: `${pct}%` }}
                          className={`w-full rounded-sm ${bg} transition-all group-hover:brightness-125`}
                        />
                        <span className="text-[8px] text-slate-500 leading-none">
                          {m.label.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" /> Cilj</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-indigo-400 inline-block" /> Danes</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-green-500/70 inline-block" /> Visoka sezona</span>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type ToolKey = "none" | "appleify" | "storyteller" | "price";

const TOOL_CARDS = [
  {
    key: "appleify" as ToolKey,
    icon: ImageIcon,
    iconColor: "text-pink-400",
    activeBg: "bg-pink-500/20",
    activeBorder: "border-pink-400/50",
    activeRing: "ring-pink-400/50",
    title: "Apple-ify Slike",
    desc: "AI Vision analiza fotografije — ocena, kompozicija in 3 konkretne izboljšave.",
  },
  {
    key: "storyteller" as ToolKey,
    icon: Languages,
    iconColor: "text-emerald-400",
    activeBg: "bg-emerald-500/20",
    activeBorder: "border-emerald-400/50",
    activeRing: "ring-emerald-400/50",
    title: "AI Pisatelj",
    desc: "Pretvori alineje v poetičen 4-jezični opis (SL, EN, DE, IT) z SEO ključnimi besedami.",
  },
  {
    key: "price" as ToolKey,
    icon: TrendingUp,
    iconColor: "text-amber-400",
    activeBg: "bg-amber-500/20",
    activeBorder: "border-amber-400/50",
    activeRing: "ring-amber-400/50",
    title: "Pametne Cene",
    desc: "Priporočilo za optimizacijo cene glede na sezono, regijske dogodke in vreme.",
  },
] as const;

export function MagicVendorSuite() {
  const [activeTool, setActiveTool] = useState<ToolKey>("none");

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-900/60 via-purple-900/60 to-indigo-950/60 p-[1px] shadow-2xl overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative bg-[#0f172a]/90 backdrop-blur-xl rounded-2xl p-6 lg:p-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl">
            <Sparkles className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Magic Vendor Suite</h2>
            <p className="text-sm text-indigo-200/60">AI-orodja za maksimizacijo vaše kmetije.</p>
          </div>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {TOOL_CARDS.map((card) => {
            const Icon = card.icon;
            const isActive = activeTool === card.key;
            return (
              <button
                key={card.key}
                onClick={() => setActiveTool(isActive ? "none" : card.key)}
                className={`text-left p-5 rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? `${card.activeBg} ${card.activeBorder} ring-1 ${card.activeRing}`
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <Icon className={`${card.iconColor} mb-3`} size={24} />
                <h3 className="font-semibold text-white mb-1 text-sm">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Active tool panel */}
        <AnimatePresence mode="wait">
          {activeTool !== "none" && (
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-black/20 border border-white/10 rounded-2xl p-6"
            >
              {activeTool === "appleify" && <AppleifyTab />}
              {activeTool === "storyteller" && <StorytellerTab />}
              {activeTool === "price" && <PriceAdvisorTab />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
