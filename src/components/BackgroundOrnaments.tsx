"use client";

// =============================================================================
// NaKmetiji.si — BackgroundOrnaments
// Reusable decorative SVG layers that ground sections in nature:
//   • Watercolor blobs (soft color washes)
//   • Botanical silhouettes (wheat, leaves, pine branches)
//   • Topographic ripples
// All purely decorative, aria-hidden, pointer-events none.
// =============================================================================

import { motion, useReducedMotion } from "framer-motion";

type Variant = "paper" | "forest" | "passport" | "reservation";

export function BackgroundOrnaments({ variant = "paper" }: { variant?: Variant }) {
  const reduce = useReducedMotion();

  // Soft float animation — only runs when user hasn't set reduced motion.
  const floatProps = reduce
    ? {}
    : {
        animate: { y: [0, -8, 0], rotate: [0, 1.5, 0] },
        transition: { duration: 14, repeat: Infinity, ease: "easeInOut" as const },
      };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {variant === "paper" && (
        <>
          <div className="watercolor-wash watercolor-forest" style={{ top: "5%", left: "-10%", width: 520, height: 520 }} />
          <div className="watercolor-wash watercolor-earth" style={{ top: "40%", right: "-8%", width: 480, height: 480 }} />
          <WheatIllustration className="absolute bottom-12 right-8 w-32 opacity-[0.09] text-forest-700 hidden md:block" />
          <LeafDuo className="absolute top-20 left-12 w-28 opacity-[0.08] text-forest-600 hidden md:block" floatProps={floatProps} />
        </>
      )}

      {variant === "forest" && (
        <>
          <div className="watercolor-wash watercolor-forest" style={{ top: "20%", left: "10%", width: 600, height: 600, opacity: 0.25 }} />
          <div className="watercolor-wash watercolor-sky" style={{ bottom: "10%", right: "15%", width: 420, height: 420, opacity: 0.2 }} />
        </>
      )}

      {variant === "passport" && (
        <>
          <SloveniaWatermark className="absolute left-1/2 top-1/2 w-[min(820px,90%)] -translate-x-1/2 -translate-y-1/2 text-emerald-500/10" />
          <div className="watercolor-wash watercolor-forest" style={{ top: "10%", left: "-5%", width: 520, height: 520, opacity: 0.3 }} />
          <div className="watercolor-wash watercolor-gold" style={{ bottom: "5%", right: "-5%", width: 500, height: 500, opacity: 0.2 }} />
          <PineBranch className="absolute top-10 right-10 w-44 opacity-[0.14] text-emerald-300 rotate-12" />
          <PineBranch className="absolute bottom-12 left-10 w-40 opacity-[0.1] text-emerald-300 -rotate-45 scale-x-[-1]" />
        </>
      )}

      {variant === "reservation" && (
        <>
          <div className="watercolor-wash watercolor-earth" style={{ top: "10%", left: "-10%", width: 500, height: 500, opacity: 0.4 }} />
          <div className="watercolor-wash watercolor-gold" style={{ bottom: "5%", right: "-5%", width: 420, height: 420, opacity: 0.25 }} />
          <WheatIllustration className="absolute top-16 right-16 w-36 opacity-[0.08] text-earth-700 hidden lg:block rotate-12" />
        </>
      )}
    </div>
  );
}

// ── Ink-rough SVG filter (reusable via CSS filter: url('#ink-rough')) ───────
// Place once in the layout so .ink-stamp can reference it.
export function InkRoughFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <filter id="ink-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" />
        </filter>
      </defs>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Decorative illustrations — inline SVG, no external deps, stroke-based so
// they inherit currentColor and compose with opacity utilities.
// ═══════════════════════════════════════════════════════════════════════════

function WheatIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 160" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M60 160 L60 40" />
      {/* Wheat grains — paired leaves along the stem */}
      {[50, 70, 90, 110, 130].map((y, i) => (
        <g key={i}>
          <ellipse cx={48 - i * 1.5} cy={y} rx="6" ry="12" transform={`rotate(-30 ${48 - i * 1.5} ${y})`} />
          <ellipse cx={72 + i * 1.5} cy={y} rx="6" ry="12" transform={`rotate(30 ${72 + i * 1.5} ${y})`} />
        </g>
      ))}
      {/* Top grain cluster */}
      <ellipse cx="60" cy="28" rx="6" ry="14" />
      <ellipse cx="52" cy="20" rx="4" ry="10" transform="rotate(-20 52 20)" />
      <ellipse cx="68" cy="20" rx="4" ry="10" transform="rotate(20 68 20)" />
    </svg>
  );
}

function LeafDuo({ className, floatProps }: { className?: string; floatProps: object }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 100 120"
      fill="currentColor"
      {...floatProps}
    >
      <path d="M30 100 Q15 70 28 40 Q42 20 58 30 Q50 55 45 75 Q40 95 30 100 Z" opacity="0.9" />
      <path d="M68 105 Q85 75 72 45 Q58 25 42 35 Q50 60 55 80 Q60 100 68 105 Z" opacity="0.6" />
    </motion.svg>
  );
}

function PineBranch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 60 Q80 55 195 58" />
      {/* Needles — pairs branching off stem */}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = 15 + i * 13;
        return (
          <g key={i}>
            <path d={`M${x} 58 L${x - 8} ${40 - (i % 2) * 4}`} />
            <path d={`M${x} 60 L${x - 6} ${78 + (i % 2) * 4}`} />
            <path d={`M${x} 58 L${x - 4} ${44}`} />
            <path d={`M${x} 60 L${x - 2} ${74}`} />
          </g>
        );
      })}
    </svg>
  );
}

function SloveniaWatermark({ className }: { className?: string }) {
  // Simplified silhouette of Slovenia — enough for watermark recognition.
  return (
    <svg className={className} viewBox="0 0 820 420" fill="currentColor" aria-hidden="true">
      <path
        d="M112,180 C140,150 175,135 210,132 C250,128 280,115 310,100 C345,85 380,78 420,80 C455,82 490,92 525,100 C555,108 590,115 625,120 C665,126 700,140 722,168 C740,192 748,220 735,250 C720,282 692,300 660,312 C622,326 585,325 548,318 C515,312 482,302 448,300 C415,298 382,308 350,318 C315,330 280,336 245,332 C215,328 185,320 160,302 C135,284 118,258 112,230 C108,208 108,195 112,180 Z"
        opacity="0.85"
      />
    </svg>
  );
}
