// =============================================================================
// NaKmetiji.si — Dynamic OG Image for Farm Profiles
// Generira 1200x630 OG sliko z brand design-om za vsako kmetijo
// =============================================================================

import { ImageResponse } from "next/og";
import { REGIJA_LABELS, type Regija } from "@/types/database";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // Edge runtime — direktni REST klic (brez cookie auth)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(
    `${url}/rest/v1/kmetije?select=*,kmetija_dozivetje(dozivetja(*))&slug=eq.${slug}&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const rows = await res.json() as Record<string, unknown>[];
  const raw = rows[0];

  if (!raw) {
    return new Response("Not found", { status: 404 });
  }

  const kdRaw = raw.kmetija_dozivetje as { dozivetja: { ime: string } }[] | undefined;
  const kmetija = {
    ...(raw as { ime: string; kratki_opis: string | null; obcina: string | null; regija: string; ocena: number | null; stevilo_ocen: number; premium: boolean; naslovna_slika: string }),
    dozivetja: (kdRaw ?? []).filter(kd => kd.dozivetja).map(kd => kd.dozivetja),
  };

  const regionLabel = REGIJA_LABELS[kmetija.regija as Regija] ?? kmetija.regija;
  const rating = kmetija.ocena ? kmetija.ocena.toFixed(1) : null;
  const tags = kmetija.dozivetja?.slice(0, 3).map((d) => d.ime) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #1a3a2a 0%, #2D5A27 60%, #1a3a2a 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -60,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(104,211,145,0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -40,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(104,211,145,0.05)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Top: Logo + badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#c6f6d5",
                }}
              >
                NK
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", letterSpacing: -0.5 }}>
                  NaKmetiji
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#68d391", letterSpacing: 2, textTransform: "uppercase" as const }}>
                  TURISTIČNE KMETIJE
                </span>
              </div>
            </div>

            {/* Premium badge */}
            {kmetija.premium && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 20,
                  background: "linear-gradient(135deg, rgba(212,168,83,0.3), rgba(212,168,83,0.15))",
                  border: "1px solid rgba(212,168,83,0.4)",
                }}
              >
                <span style={{ fontSize: 14, color: "#d4a853" }}>★</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#d4a853" }}>Premium</span>
              </div>
            )}
          </div>

          {/* Center: Farm name + description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
            {/* Region */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 15,
                fontWeight: 600,
                color: "#9ae6b4",
              }}
            >
              <span>📍</span>
              <span>{regionLabel}</span>
              {kmetija.obcina && (
                <>
                  <span style={{ color: "rgba(154,230,180,0.4)" }}>·</span>
                  <span>{kmetija.obcina}</span>
                </>
              )}
            </div>

            <span
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.1,
                letterSpacing: -1,
              }}
            >
              {kmetija.ime}
            </span>

            {kmetija.kratki_opis && (
              <span
                style={{
                  fontSize: 20,
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.4,
                  maxWidth: 700,
                }}
              >
                {kmetija.kratki_opis}
              </span>
            )}
          </div>

          {/* Bottom: Tags + rating */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Tags */}
            <div style={{ display: "flex", gap: 8 }}>
              {tags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.8)",
                    display: "flex",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>

            {/* Rating */}
            {rating && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#d4a853" }}>{rating}</span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 16, color: "#d4a853" }}>★★★★★</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    {kmetija.stevilo_ocen} ocen
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
