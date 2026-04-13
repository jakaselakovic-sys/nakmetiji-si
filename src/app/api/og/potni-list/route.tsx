// =============================================================================
// NaKmetiji.si — Green Passport Shareable OG Image
// GET /api/og/potni-list?stamps=12&regions=4&level=Ambasador+Kmetij&icon=🏆&name=Janez&format=story
//
// Two formats:
//   format=card  (default) → 1200×630  standard OG for Twitter/LinkedIn/WhatsApp
//   format=story           → 1080×1920 Instagram Stories 9:16
//
// Data is passed as URL params (not fetched from DB) so the edge function stays
// stateless and fast. The calling component computes values server-side and
// encodes them into the share URL.
//
// Cache: 10 minutes (generated images are user-specific but change infrequently)
// =============================================================================

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Palette — must match design system (can't import Tailwind vars in edge)
const C = {
  forest900: "#1a3a2a",
  forest700: "#2D5A27",
  forest500: "#38a169",
  forest400: "#68d391",
  forest200: "#c6f6d5",
  emerald:   "#10b981",
  gold:      "#d4a853",
  cream:     "#F4F1EA",
  earth200:  "#ede5da",
  earth500:  "#b49a7c",
  white:     "#ffffff",
  white60:   "rgba(255,255,255,0.6)",
  white20:   "rgba(255,255,255,0.2)",
  black60:   "rgba(0,0,0,0.6)",
};

// Level to gradient map
const LEVEL_GRADIENTS: Record<string, [string, string]> = {
  "🌱": ["#064e3b", "#065f46"],
  "🗺️": ["#0f766e", "#0d9488"],
  "🌾": ["#92400e", "#b45309"],
  "🏆": ["#1e3a5f", "#1d4ed8"],
  "👑": ["#44116b", "#7c3aed"],
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const stamps  = Math.max(0, parseInt(searchParams.get("stamps")  ?? "0", 10));
  const regions = Math.max(0, parseInt(searchParams.get("regions") ?? "0", 10));
  const level   = searchParams.get("level")  ?? "Zeleni Začetnik";
  const icon    = searchParams.get("icon")   ?? "🌱";
  const name    = (searchParams.get("name")  ?? "Popotnik").slice(0, 32);
  const format  = searchParams.get("format") === "story" ? "story" : "card";

  const isStory = format === "story";
  const W = isStory ? 1080 : 1200;
  const H = isStory ? 1920 : 630;

  const [gradStart, gradEnd] = LEVEL_GRADIENTS[icon] ?? [C.forest900, C.forest700];

  // Stamp grid — show up to 16 as dots (4×4)
  const maxDots   = 16;
  const filledDots = Math.min(stamps, maxDots);
  const dots = Array.from({ length: maxDots }, (_, i) => i < filledDots);

  // Progress to next level (simplified for display)
  const THRESHOLDS = [0, 3, 8, 16];
  const currentThreshold = THRESHOLDS.filter((t) => stamps >= t).at(-1) ?? 0;
  const nextThreshold = THRESHOLDS.find((t) => t > stamps);
  const progressPct = nextThreshold
    ? Math.min(100, Math.round(((stamps - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100;

  const image = isStory
    ? renderStory({ W, H, name, icon, level, stamps, regions, dots, progressPct, gradStart, gradEnd, nextThreshold })
    : renderCard({ W, H, name, icon, level, stamps, regions, progressPct, gradStart, gradEnd });

  const response = new ImageResponse(image, { width: W, height: H });
  response.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
  return response;
}

// ── Card layout (1200×630) ────────────────────────────────────────────────────

function renderCard({
  W, H, name, icon, level, stamps, regions, progressPct, gradStart, gradEnd,
}: {
  W: number; H: number; name: string; icon: string; level: string;
  stamps: number; regions: number; progressPct: number;
  gradStart: string; gradEnd: string;
}) {
  return (
    <div
      style={{
        width: W, height: H,
        display: "flex",
        background: `linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 60%, ${C.forest500} 100%)`,
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background texture circles */}
      <div style={{ position: "absolute", top: -120, right: -80, width: 500, height: 500, borderRadius: "50%", background: C.white20, display: "flex" }} />
      <div style={{ position: "absolute", bottom: -80, left: 200, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex" }} />

      {/* Left panel — passport details */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 56px" }}>
        {/* Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 36, backgroundColor: C.forest400, borderRadius: 3, display: "flex" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: C.forest400, fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              NaKmetiji.si
            </span>
            <span style={{ color: C.white60, fontSize: 11, letterSpacing: "0.06em" }}>
              Zeleni Potni List
            </span>
          </div>
        </div>

        {/* Name + Level */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 52 }}>{icon}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: C.white60, fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Nivo
              </span>
              <span style={{ color: C.white, fontSize: 26, fontWeight: 800, letterSpacing: "-0.01em" }}>
                {level}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: C.white60, fontSize: 13 }}>Potni list pripada</span>
            <span style={{ color: C.white, fontSize: 38, fontWeight: 900, letterSpacing: "-0.02em" }}>
              {name}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { value: stamps,  label: "Žigi", color: C.forest400 },
            { value: regions, label: "Regije", color: C.gold },
          ].map(({ value, label, color }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: C.white20, borderRadius: 16, padding: "16px 28px" }}>
              <span style={{ color, fontSize: 42, fontWeight: 900 }}>{value}</span>
              <span style={{ color: C.white60, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {label}
              </span>
            </div>
          ))}

          {/* Progress bar */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            <span style={{ color: C.white60, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Napredek
            </span>
            <div style={{ width: "100%", height: 10, backgroundColor: C.white20, borderRadius: 5, display: "flex" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", backgroundColor: C.forest400, borderRadius: 5, display: "flex" }} />
            </div>
            <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Right panel — stamp visual */}
      <div style={{ width: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.white20, padding: 40, gap: 16 }}>
        <span style={{ fontSize: 80 }}>{icon}</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ color: C.white, fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", textAlign: "center" }}>
            {stamps} {stamps === 1 ? "žig" : stamps < 5 ? "žige" : "žigov"}
          </span>
          <span style={{ color: C.white60, fontSize: 12, textAlign: "center" }}>
            v {regions} {regions === 1 ? "regiji" : regions < 5 ? "regijah" : "regijah"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Story layout (1080×1920) ──────────────────────────────────────────────────

function renderStory({
  W, H, name, icon, level, stamps, regions, dots, progressPct,
  gradStart, gradEnd, nextThreshold,
}: {
  W: number; H: number; name: string; icon: string; level: string;
  stamps: number; regions: number; dots: boolean[]; progressPct: number;
  gradStart: string; gradEnd: string; nextThreshold: number | undefined;
}) {
  return (
    <div
      style={{
        width: W, height: H,
        display: "flex", flexDirection: "column",
        background: `linear-gradient(170deg, ${gradStart} 0%, ${gradEnd} 45%, ${C.forest500} 80%, #065f46 100%)`,
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
        alignItems: "center",
      }}
    >
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -200, right: -200, width: 700, height: 700, borderRadius: "50%", background: C.white20, display: "flex" }} />
      <div style={{ position: "absolute", bottom: 200, left: -150, width: 450, height: 450, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex" }} />

      {/* Top: branding */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 80, position: "relative" }}>
        <div style={{ width: 8, height: 48, backgroundColor: C.forest400, borderRadius: 4, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: C.forest400, fontSize: 20, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            NaKmetiji.si
          </span>
          <span style={{ color: C.white60, fontSize: 15, letterSpacing: "0.04em" }}>
            🌿 Zeleni Potni List
          </span>
        </div>
      </div>

      {/* Stamp icon — hero */}
      <div style={{ position: "relative", marginTop: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "3px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 110 }}>{icon}</span>
        </div>
      </div>

      {/* Name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 48, gap: 8, position: "relative" }}>
        <span style={{ color: C.white60, fontSize: 18, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Zeleni Popotnik
        </span>
        <span style={{ color: C.white, fontSize: 64, fontWeight: 900, letterSpacing: "-0.03em" }}>
          {name}
        </span>
        <span style={{ color: C.forest400, fontSize: 28, fontWeight: 700, marginTop: 4 }}>
          {icon} {level}
        </span>
      </div>

      {/* Stats grid */}
      <div style={{ display: "flex", gap: 24, marginTop: 60, position: "relative" }}>
        {[
          { value: stamps,  label: stamps === 1 ? "Žig" : "Žigov",    color: C.forest400 },
          { value: regions, label: regions === 1 ? "Regija" : "Regij", color: C.gold },
        ].map(({ value, label, color }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.14)", borderRadius: 28, padding: "28px 48px", border: "1px solid rgba(255,255,255,0.2)" }}>
            <span style={{ color, fontSize: 72, fontWeight: 900, lineHeight: 1 }}>{value}</span>
            <span style={{ color: C.white60, fontSize: 18, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Stamp dot grid */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 56, position: "relative" }}>
        <span style={{ color: C.white60, fontSize: 16, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Zbrani žigi
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, maxWidth: 320, justifyContent: "center" }}>
          {dots.map((filled, i) => (
            <div
              key={i}
              style={{
                width: 52, height: 52, borderRadius: "50%",
                background: filled
                  ? `linear-gradient(135deg, ${C.forest400}, ${C.emerald})`
                  : "rgba(255,255,255,0.12)",
                border: filled ? "none" : "2px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {filled && <span style={{ color: C.white, fontSize: 22, fontWeight: 900 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Progress to next level */}
      {nextThreshold !== undefined && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 48, width: 640, position: "relative" }}>
          <span style={{ color: C.white60, fontSize: 16 }}>
            Še {nextThreshold - stamps} {nextThreshold - stamps === 1 ? "žig" : "žige"} do naslednjega nivoja
          </span>
          <div style={{ width: "100%", height: 12, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 6, display: "flex" }}>
            <div style={{ width: `${progressPct}%`, height: "100%", backgroundColor: C.forest400, borderRadius: 6, display: "flex" }} />
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div style={{ position: "absolute", bottom: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.white60, fontSize: 16 }}>Zberi tudi ti svoje žige na</span>
        <span style={{ color: C.white, fontSize: 22, fontWeight: 800, letterSpacing: "0.04em" }}>
          nakmetiji.si/green-passport
        </span>
      </div>
    </div>
  );
}
