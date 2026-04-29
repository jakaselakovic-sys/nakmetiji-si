"use client";

// =============================================================================
// NaKmetiji.si — Polaroid Gallery
// 3+ vintage polaroids pinned to a dark wood plank with colored thumbtacks,
// burnt sepia edges and handwritten captions. Used for storytelling sections.
// =============================================================================

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { BLUR_DATA_URL } from "@/lib/blur";

export interface PolaroidItem {
  src: string;
  alt: string;
  caption: string;        // handwritten line under the photo
  date?: string;          // small subline, e.g. "jun 24"
  pinColor?: "red" | "gold" | "blue" | "green";  // thumbtack color
}

interface Props {
  items: PolaroidItem[];
  className?: string;
}

const PIN_GRADIENTS: Record<NonNullable<PolaroidItem["pinColor"]>, string[]> = {
  red:   ["#fff5f5", "#d83a3a", "#5c0e0e"],
  gold:  ["#fff8e1", "#d4a853", "#5c3d0a"],
  blue:  ["#eff6ff", "#3a7bd8", "#0e2c5c"],
  green: ["#f0faf4", "#2d8a56", "#0f2318"],
};

const TILTS = ["-3.2deg", "1.8deg", "-1.4deg", "2.6deg", "-2.4deg"];

function Thumbtack({ color = "gold" }: { color?: PolaroidItem["pinColor"] }) {
  const grad = PIN_GRADIENTS[color ?? "gold"];
  const id = `pin-${color ?? "gold"}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <span
      aria-hidden="true"
      className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
    >
      <svg width="26" height="26" viewBox="0 0 26 26">
        <defs>
          <radialGradient id={id} cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor={grad[0]} stopOpacity="0.95" />
            <stop offset="45%" stopColor={grad[1]} />
            <stop offset="100%" stopColor={grad[2]} />
          </radialGradient>
        </defs>
        <ellipse cx="13" cy="16" rx="11" ry="3" fill="rgba(0,0,0,0.28)" />
        <circle cx="13" cy="13" r="9" fill={`url(#${id})`} />
        <circle cx="10" cy="10" r="3" fill={grad[0]} opacity="0.55" />
      </svg>
    </span>
  );
}

function Polaroid({ item, index }: { item: PolaroidItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const tilt = TILTS[index % TILTS.length];
  const pin: PolaroidItem["pinColor"] =
    item.pinColor ?? (["red", "gold", "blue", "green"] as const)[index % 4];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, rotate: tilt }}
      animate={inView ? { opacity: 1, y: 0, rotate: tilt } : { opacity: 0, y: 30, rotate: tilt }}
      whileHover={{ rotate: "0deg", y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 110, damping: 18, mass: 0.85, delay: index * 0.08 }}
      className="relative max-w-[230px] w-full"
    >
      <Thumbtack color={pin} />

      <div
        className="relative pt-3 px-3 pb-8 rounded-[3px]"
        style={{
          background: "linear-gradient(180deg, #f4ecd6 0%, #ead8b1 100%)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.45), 0 4px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.25)",
        }}
      >
        {/* Burnt edge masks — subtle uneven darkening on corners */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[3px] pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 25% at 50% 0%, transparent, rgba(60,30,10,0.15) 100%),
              radial-gradient(ellipse 30% 80% at 0% 50%, rgba(60,30,10,0.12), transparent 70%),
              radial-gradient(ellipse 30% 80% at 100% 50%, rgba(60,30,10,0.12), transparent 70%),
              radial-gradient(ellipse 80% 25% at 50% 100%, rgba(60,30,10,0.18), transparent)
            `,
          }}
        />

        {/* Photo with sepia treatment */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2px]">
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="(max-width: 640px) 80vw, 230px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            style={{ filter: "sepia(0.35) saturate(0.8) contrast(0.95) brightness(0.92)" }}
          />
          {/* Inner vignette for vintage depth */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: "inset 0 0 36px rgba(40,20,5,0.45), inset 0 -32px 50px rgba(40,20,5,0.35)" }}
          />
        </div>

        {/* Handwritten caption */}
        <div className="px-2 pt-3 text-center relative z-10">
          <p
            className="text-[#3d2c1e] leading-tight"
            style={{ fontFamily: "var(--font-script, 'Caveat', cursive)", fontSize: "1.4rem", fontWeight: 600 }}
          >
            {item.caption}
          </p>
          {item.date && (
            <p
              className="text-[#7b5b43] mt-0.5"
              style={{ fontFamily: "var(--font-script, 'Caveat', cursive)", fontSize: "0.85rem" }}
            >
              {item.date}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function PolaroidGallery({ items, className = "" }: Props) {
  return (
    <div
      className={`relative rounded-[24px] overflow-hidden ${className}`}
      style={{
        background: `
          linear-gradient(180deg, rgba(20,12,5,0.4), rgba(20,12,5,0.55)),
          repeating-linear-gradient(90deg, #4a3220 0px, #5a3e29 8px, #3e2818 14px, #4a3220 22px)
        `,
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Subtle wood-grain noise overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 3px)",
        }}
      />

      <div className="relative flex flex-wrap items-start justify-center gap-6 sm:gap-10 p-8 sm:p-12">
        {items.map((it, i) => (
          <Polaroid key={i} item={it} index={i} />
        ))}
      </div>
    </div>
  );
}
