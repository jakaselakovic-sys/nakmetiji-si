// =============================================================================
// NaKmetiji.si — Dynamic OG Image for Farm Profile Pages
// GET /api/og/kmetije/[slug]
//
// Returns a 1200×630 PNG card with the farm's cover photo, name, region, price.
// Referenced from generateMetadata() in /kmetije/[slug]/page.tsx.
// Cached at the CDN for 1 hour (s-maxage=3600, stale-while-revalidate=86400).
// =============================================================================

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { REGIJA_LABELS } from "@/types/database";


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Anon client — edge-compatible, no cookies needed for public farm data
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("kmetije")
    .select("ime, kratki_opis, regija, cena_noc, naslovna_slika")
    .eq("slug", slug)
    .single();

  const name     = data?.ime        ?? "NaKmetiji";
  const desc     = (data?.kratki_opis ?? "Turistična kmetija v Sloveniji").slice(0, 100);
  const region   = (REGIJA_LABELS as Record<string, string>)[data?.regija ?? ""] ?? (data?.regija ?? "Slovenija");
  const price    = data?.cena_noc != null ? `${data.cena_noc} € / noč` : null;
  const coverUrl = data?.naslovna_slika ?? null;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#1a3a2a",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Cover photo */}
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.45,
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(26,58,42,0.95) 0%, rgba(26,58,42,0.55) 50%, rgba(26,58,42,0.80) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 72px",
            height: "100%",
          }}
        >
          {/* Top: branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 10,
                height: 40,
                backgroundColor: "#4ade80",
                borderRadius: 4,
              }}
            />
            <span
              style={{
                color: "#86efac",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              NaKmetiji.si
            </span>
          </div>

          {/* Center: region chip + farm name + description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#86efac",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  backgroundColor: "rgba(74,222,128,0.15)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: 100,
                  padding: "4px 16px",
                }}
              >
                {region}
              </span>
            </div>

            <h1
              style={{
                color: "#ffffff",
                fontSize: name.length > 25 ? 66 : 80,
                fontWeight: 900,
                lineHeight: 1.05,
                margin: 0,
                letterSpacing: "-0.02em",
                textShadow: "0 4px 24px rgba(0,0,0,0.5)",
              }}
            >
              {name}
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 26,
                margin: 0,
                lineHeight: 1.4,
                maxWidth: 680,
              }}
            >
              {desc}
            </p>
          </div>

          {/* Bottom: price badge + domain */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {price ? (
              <div
                style={{
                  backgroundColor: "#4ade80",
                  color: "#14532d",
                  borderRadius: 16,
                  padding: "14px 32px",
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                od {price}
              </div>
            ) : (
              <div />
            )}

            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              nakmetiji.si
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );

  // Cache the OG image at CDN for 1 h, serve stale for 24 h while revalidating
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );

  return response;
}
