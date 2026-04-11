"use client";

// =============================================================================
// NaKmetiji.si — DemoDisclaimer
//
// Renders a non-intrusive top banner + sticky footer strip when DEMO_MODE=true.
// Automatically hidden in production (NEXT_PUBLIC_DEMO_MODE=false).
//
// Usage: drop once into layout.tsx, done.
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { DEMO_MODE } from "@/lib/config/demo";

// ── Top banner (dismissible, remembered in sessionStorage) ──────────────────

export function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!DEMO_MODE) return;
    const dismissed = sessionStorage.getItem("demo-banner-dismissed");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Demo opozorilo"
      className="relative z-[200] w-full bg-amber-400 text-amber-950 text-xs font-semibold px-4 py-2 flex items-center justify-center gap-3 text-center"
    >
      <span className="inline-block animate-pulse text-amber-800">⚗️</span>
      <span>
        <strong>Tehnološki demo</strong> — rezervacije niso prave, nobene storitve se ne zaračunavajo.{" "}
        <Link
          href="/pogoji-demo"
          className="underline underline-offset-2 hover:text-amber-900 transition-colors"
        >
          Pogoji uporabe
        </Link>
      </span>
      <button
        onClick={() => {
          sessionStorage.setItem("demo-banner-dismissed", "1");
          setVisible(false);
        }}
        aria-label="Zapri opozorilo"
        className="ml-auto flex-shrink-0 text-amber-800 hover:text-amber-950 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

// ── Footer strip (always visible in demo mode) ───────────────────────────────

export function DemoFooterStrip() {
  if (!DEMO_MODE) return null;

  return (
    <div className="w-full bg-earth-100 border-t border-earth-200 py-4 px-6 text-center">
      <p className="text-xs text-earth-500 leading-relaxed max-w-3xl mx-auto">
        <strong className="text-earth-700">NaKmetiji.si</strong> je tehnološki demonstracijski projekt.
        Rezervacije niso prave in nobene storitve se ne zaračunavajo.
        Platforma je ustvarjena z namenom prikaza UI/UX in AI zmogljivosti.{" "}
        <Link href="/pogoji-demo" className="text-forest-600 hover:text-forest-800 underline underline-offset-2 transition-colors">
          Pogoji demo projekta
        </Link>{" "}
        ·{" "}
        <a href="mailto:info@nakmetiji.si" className="text-forest-600 hover:text-forest-800 underline underline-offset-2 transition-colors">
          Kontakt
        </a>
      </p>
    </div>
  );
}

// ── Inline badge for booking buttons / modals ────────────────────────────────

export function DemoBadge({ className = "" }: { className?: string }) {
  if (!DEMO_MODE) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 uppercase tracking-wider ${className}`}
    >
      ⚗️ Demo
    </span>
  );
}

// ── Full disclaimer card for booking confirmation ────────────────────────────

export function DemoBookingNotice() {
  if (!DEMO_MODE) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-1">
      <p className="font-bold">⚗️ Demo rezervacija</p>
      <p>
        To je simulirana rezervacija. Nič ni zapisano v bazo in noben email ni poslan.
        Platforma je za demonstracijske namene — ni komercialne storitve.
      </p>
    </div>
  );
}
