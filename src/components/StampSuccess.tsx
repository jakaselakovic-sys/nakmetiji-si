"use client";

// =============================================================================
// StampSuccess — animated success screen after QR stamp claim
// Physics: stamp drops with spring, confetti bursts from center,
// points count up with interval, level-up badge slides in if applicable.
// =============================================================================

import { useEffect, useState, useRef, startTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MapPin, Share2, ArrowRight, Star } from "lucide-react";
import type { GreenLevel } from "@/lib/greenPassport";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  farmName: string;
  farmRegion: string;
  farmSlug: string;
  pointsEarned: number;
  isNewRegion: boolean;
  leveledUp: boolean;
  currentLevel: GreenLevel;
  totalStamps: number;
  progressPct: number;
  nextLevelName: string | null;
  stepsToNext: number | null;
}

// ─── Confetti particle ────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  color: string;
  delay: number;
}

const COLORS = ["#2D5A27", "#d4a853", "#38a169", "#68d391", "#F4F1EA", "#9ae6b4"];

// ─── Component ────────────────────────────────────────────────────────────────

export function StampSuccess({
  farmName,
  farmRegion,
  pointsEarned,
  isNewRegion,
  leveledUp,
  currentLevel,
  totalStamps,
  progressPct,
  nextLevelName,
  stepsToNext,
  farmSlug,
}: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [showLevel, setShowLevel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate confetti only on client (avoids hydration mismatch)
  useEffect(() => {
    startTransition(() => setParticles(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 340,
        y: (Math.random() - 0.5) * 340,
        rotate: Math.random() * 720 - 360,
        scale: Math.random() * 0.6 + 0.4,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.4,
      }))
    ));
  }, []);

  // Count up points animation
  useEffect(() => {
    if (pointsEarned === 0) return;
    const step = Math.max(1, Math.ceil(pointsEarned / 25));
    timerRef.current = setInterval(() => {
      setDisplayPoints((prev) => {
        const next = Math.min(prev + step, pointsEarned);
        if (next >= pointsEarned && timerRef.current) {
          clearInterval(timerRef.current);
        }
        return next;
      });
    }, 40);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pointsEarned]);

  // Delay level badge appearance
  useEffect(() => {
    if (leveledUp) {
      const t = setTimeout(() => setShowLevel(true), 1400);
      return () => clearTimeout(t);
    }
  }, [leveledUp]);

  // Share handler
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: "Moj Zeleni Potni List — NaKmetiji",
        text: `Ravno sem zbral ${totalStamps} žig${totalStamps === 1 ? "" : "ov"} na slovenskem podeželju! Sem ${currentLevel.icon} ${currentLevel.name}.`,
        url: `${window.location.origin}/green-passport`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/green-passport`
      ).catch(() => {});
    }
  }

  return (
    <div className="min-h-screen bg-forest-900 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">

      {/* ── Background ambient ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-forest-600/20 blur-3xl" />
      </div>

      {/* ── Confetti burst ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotate }}
            transition={{ duration: 1.2, delay: p.delay + 0.5, ease: "easeOut" }}
            className="absolute w-3 h-3 rounded-sm"
            style={{ backgroundColor: p.color }}
          />
        ))}
      </div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Stamp drop */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ y: -120, rotate: -20, scale: 1.6, opacity: 0 }}
            animate={{ y: 0, rotate: -6, scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: 0.15,
            }}
            className="relative"
          >
            {/* Stamp body */}
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_40px_rgba(52,168,83,0.5)] border-4 border-white/20">
              <span className="text-5xl" role="img" aria-label={currentLevel.name}>
                {currentLevel.icon}
              </span>
            </div>
            {/* Ink ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-4 border-emerald-400"
            />
          </motion.div>
        </div>

        {/* Farm info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
            <CheckCircle2 size={14} /> Žig uspešno zbran
          </div>
          <h1 className="text-2xl font-black text-white mb-1">{farmName}</h1>
          <div className="flex items-center justify-center gap-1.5 text-forest-200 text-sm">
            <MapPin size={14} className="text-forest-400" />
            <span className="capitalize">{farmRegion}</span>
          </div>
        </motion.div>

        {/* Points + bonuses */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.85, duration: 0.35 }}
          className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 mb-4 text-center"
        >
          <p className="text-forest-300 text-xs font-bold uppercase tracking-widest mb-1">
            Točke zbrane
          </p>
          <p className="text-5xl font-black text-white mb-3">
            +{displayPoints}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Star size={11} fill="currentColor" /> +50 žig
            </span>
            {isNewRegion && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300"
              >
                🗺️ +25 nova regija!
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Level up banner */}
        <AnimatePresence>
          {leveledUp && showLevel && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="bg-gradient-to-r from-amber-500/30 to-emerald-500/30 border border-amber-400/40 rounded-2xl px-5 py-4 mb-4 text-center"
            >
              <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-1">
                ⬆️ Nivo dosežen!
              </p>
              <p className="text-white font-black text-lg">
                {currentLevel.icon} {currentLevel.name}
              </p>
              <p className="text-forest-200 text-xs mt-1">{currentLevel.rewardShort}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress to next level */}
        {nextLevelName && stepsToNext !== null && stepsToNext > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mb-6"
          >
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
                className="h-full bg-emerald-400 rounded-full"
              />
            </div>
            <p className="text-center text-forest-300 text-xs mt-1.5">
              Še <strong className="text-white">{stepsToNext}</strong> {stepsToNext === 1 ? "žig" : "žige"} do{" "}
              <strong className="text-emerald-400">{nextLevelName}</strong>
            </p>
          </motion.div>
        )}

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
          className="flex flex-col gap-3"
        >
          <Link
            href="/moj-potni-list"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Poglej potni list <ArrowRight size={18} />
          </Link>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold py-3.5 text-sm border border-white/15 transition-all"
          >
            <Share2 size={16} /> Deli napredek
          </button>

          <Link
            href={`/kmetije/${farmSlug}`}
            className="text-center text-forest-400 hover:text-forest-200 text-sm transition-colors py-1"
          >
            Nazaj na kmetijo
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
