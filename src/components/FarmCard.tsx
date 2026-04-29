"use client";

// =============================================================================
// NaKmetiji.si — FarmCard v2
// Hand-pinned polaroid on cream paper. Single gold thumbtack at top, photo,
// region overline, large serif farm name, italic price line.
// =============================================================================

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useInView } from "framer-motion";
import type { ExperienceTag } from "@/types";
import { BLUR_DATA_URL } from "@/lib/blur";

interface FarmCardData {
  slug: string;
  name: string;
  tagline?: string;
  region: string;          // e.g. "gorenjska"
  obcina?: string | null;  // e.g. "Bohinj"
  coverImageUrl: string;
  experiencesOffered: ExperienceTag[];
  rating: number | null;
  reviewCount: number;
  isPremium: boolean;
  cenaNoc?: number | null;
}

const REGION_LABELS: Record<string, string> = {
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

const TILTS = ["-1.4deg", "0.9deg", "-0.6deg", "1.2deg"];

const SPRING = { type: "spring" as const, stiffness: 110, damping: 18, mass: 0.85 };

// Tiny gold-and-shadow thumbtack pinned at the top center of the polaroid.
function Thumbtack({ color = "#d4a853" }: { color?: string }) {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
    >
      <svg width="22" height="22" viewBox="0 0 22 22">
        <defs>
          <radialGradient id="tt-grad" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#fff8e1" stopOpacity="0.85" />
            <stop offset="40%" stopColor={color} />
            <stop offset="100%" stopColor="#5c3d0a" />
          </radialGradient>
        </defs>
        <ellipse cx="11" cy="13" rx="9" ry="2.5" fill="rgba(0,0,0,0.18)" />
        <circle cx="11" cy="11" r="7.5" fill="url(#tt-grad)" />
        <circle cx="8.5" cy="8.5" r="2.5" fill="#fff8e1" opacity="0.55" />
      </svg>
    </span>
  );
}

export function FarmCard({ farm, priority, index = 0 }: { farm: FarmCardData; priority?: boolean; index?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-60px" });

  // Magnetic pull
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 350, damping: 35 });
  const springY = useSpring(mouseY, { stiffness: 350, damping: 35 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - (rect.left + rect.width / 2)) * 0.04);
    mouseY.set((e.clientY - (rect.top + rect.height / 2)) * 0.04);
  }
  function onMouseLeave() { mouseX.set(0); mouseY.set(0); }

  const tilt = TILTS[index % TILTS.length];
  const regionLabel = REGION_LABELS[farm.region] ?? farm.region;
  const obcinaLabel = farm.obcina ? farm.obcina : null;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 36, rotate: tilt }}
      animate={isInView
        ? { opacity: 1, y: 0, rotate: tilt }
        : { opacity: 0, y: 36, rotate: tilt }}
      whileHover={{ rotate: "0deg", y: -6 }}
      transition={SPRING}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileTap={{ scale: 0.985 }}
      style={{ x: springX, y: springY }}
      className="group relative"
    >
      <Thumbtack color={farm.isPremium ? "#d4a853" : "#c9a76a"} />

      <Link
        href={`/kmetije/${farm.slug}`}
        id={`farm-card-${farm.slug}`}
        className="block"
        tabIndex={0}
      >
        {/* Polaroid frame */}
        <div
          className="relative pt-3 px-3 pb-5 rounded-[6px] cursor-pointer transition-shadow duration-500"
          style={{
            background: "#fdf9f0",
            backgroundImage: `
              radial-gradient(ellipse at top left, rgba(255,255,255,0.55), transparent 60%),
              repeating-linear-gradient(0deg, rgba(60,40,20,0.018) 0px, rgba(60,40,20,0.018) 1px, transparent 1px, transparent 2px)
            `,
            border: "1px solid rgba(60,40,20,0.10)",
            boxShadow: "0 6px 24px rgba(45,35,20,0.14), 0 1px 3px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.4)",
          }}
        >
          {/* Image */}
          <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-[3px]">
            <Image
              src={farm.coverImageUrl || "/images/bg-vineyards.webp"}
              alt={farm.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 30vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              priority={priority}
            />

            {/* Subtle vignette for the photo */}
            <div className="absolute inset-0 pointer-events-none" style={{
              boxShadow: "inset 0 0 24px rgba(0,0,0,0.15), inset 0 -40px 60px rgba(0,0,0,0.12)",
            }} />

            {/* Premium dot */}
            {farm.isPremium && (
              <span
                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white shadow-md"
                style={{ background: "rgba(212,168,83,0.95)" }}
              >
                ★ Izpostavljeno
              </span>
            )}
          </div>

          {/* Caption — overline + name + price */}
          <div className="px-1 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-700/80 mb-1.5">
              {regionLabel}
              {obcinaLabel && (
                <span className="text-earth-500"> · {obcinaLabel}</span>
              )}
            </p>

            <h3
              className="font-display font-black leading-tight text-[1.35rem] sm:text-[1.45rem]"
              style={{ color: "#3d2c1e" }}
            >
              {farm.name}
            </h3>

            {(farm.cenaNoc !== undefined && farm.cenaNoc !== null) ? (
              <p
                className="mt-2 text-sm italic"
                style={{ fontFamily: "var(--font-script, 'Caveat', cursive)", color: "#7b5b43", fontSize: "1.05rem" }}
              >
                — od €{farm.cenaNoc} / noč
              </p>
            ) : farm.tagline ? (
              <p
                className="mt-2 text-sm italic line-clamp-2"
                style={{ fontFamily: "var(--font-script, 'Caveat', cursive)", color: "#7b5b43", fontSize: "1.05rem" }}
              >
                — {farm.tagline}
              </p>
            ) : null}

            {farm.rating !== null && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-earth-600">
                <span style={{ color: "#d4a853" }}>★</span>
                <span className="font-bold text-earth-800">{farm.rating.toFixed(1)}</span>
                <span className="text-earth-500">· {farm.reviewCount} ocen</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
