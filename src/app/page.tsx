// =============================================================================
// NaKmetiji.si — Home Page
//
// ARCHITECTURE: Three independent sections, each independently swappable.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  SECTION 1 — Scrollytelling Hero (Day-to-Night, 800vh, sticky)          │
// │    ScrollytellingWrapper: Framer Motion useScroll + useSpring            │
// │    4-layer image cross-fade: Mountains → Vineyards → River → Night       │
// │    Apple-style progress bar, dynamic subtitle, spring-smoothed scroll    │
// ├─────────────────────────────────────────────────────────────────────────┤
// │  SECTION 2 — Discovery Engine                                            │
// │    HeroSearch + QuickFilters + CategoryScroll (real Supabase data)       │
// │    FeaturedFarms (ISR-cached, revalidate: 60s)                           │
// │    FarmOfMonth (curated pick)                                            │
// ├─────────────────────────────────────────────────────────────────────────┤
// │  SECTION 3 — Mock Booking Demo CTA                                       │
// │    When MOCK_BOOKING=true  → MockBookingForm (no DB writes)              │
// │    When MOCK_BOOKING=false → Real RezervacijaForm (commercial mode)      │
// └─────────────────────────────────────────────────────────────────────────┘
//
// OracleConcierge (AI chat FAB) is mounted globally in layout.tsx.
// DemoBanner + DemoFooterStrip are also in layout.tsx.
//
// TO GO LIVE (commercial mode):
//   Set in .env.local or Vercel:
//     NEXT_PUBLIC_DEMO_MODE=false
//     NEXT_PUBLIC_MOCK_BOOKING=false
//     NEXT_PUBLIC_PAYMENTS_ENABLED=true
//   No code changes needed here.
// =============================================================================

import { Suspense } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";

// UI components — HeroSearch lives inside ScrollytellingWrapper now.
import { FeaturedFarms } from "@/components/FeaturedFarms";
import { SkeletonCard } from "@/components/ui/Skeleton";

// Scrollytelling hero
import { ScrollytellingWrapper } from "@/components/ScrollytellingWrapper";

import { GreenPassportShowcase } from "@/components/GreenPassportShowcase";
import { BackgroundOrnaments } from "@/components/BackgroundOrnaments";
import { QuickStartGuide } from "@/components/QuickStartGuide";
import { VendorCTAStrip } from "@/components/VendorCTAStrip";
import { PolaroidGallery } from "@/components/PolaroidGallery";


function JsonLd() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NaKmetiji",
    url: "https://nakmetiji.si",
    description:
      "NaKmetiji je vodilna platforma za odkrivanje turističnih kmetij po vsej Sloveniji.",
    inLanguage: "sl",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://nakmetiji.si/kmetije?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NaKmetiji",
    url: "https://nakmetiji.si",
    logo: "https://nakmetiji.si/icons/icon-192.svg",
    description:
      "Platforma za odkrivanje turističnih kmetij, kulinarike, vinskega turizma in doživetij na slovenskem podeželju.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ljubljana",
      addressCountry: "SI",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@nakmetiji.si",
      contactType: "customer service",
      availableLanguage: ["Slovenian", "English"],
    },
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}

export default async function HomePage() {
  const supabase = await createSupabaseServer();
  const { data: dozivetja } = await supabase
    .from("dozivetja")
    .select("id, ime, slug")
    .order("vrstni_red");

  return (
    <>
      <JsonLd />

      {/* SEO: every page needs exactly one <h1>. Visually hidden because the
          scrollytelling hero handles the visual headline. */}
      <h1 className="sr-only">
        NaKmetiji — Turistične kmetije po Sloveniji
      </h1>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — LIQUID SCROLLYTELLING HERO
          800vh sticky container. 4 background layers cross-fade as user
          scrolls through. Spring-smoothed with stiffness:50, damping:20.
          Images: bg-mountains → bg-vineyards → bg-river → bg-sheep-night
          ════════════════════════════════════════════════════════════════════ */}
      <ScrollytellingWrapper dozivetja={dozivetja ?? []} />

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — DISCOVERY ENGINE
          Search, filters, categories, featured farms (ISR-cached 60s).
          ════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full overflow-hidden bg-paper texture-paper">
        {/* Soft top shadow transition from hero */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-forest-950/10 to-transparent z-10 pointer-events-none" />

        {/* Botanical ornaments — watercolor + wheat silhouettes */}
        <BackgroundOrnaments variant="paper" />

        <div className="relative z-20">
          {/* Search lives in the Hero overlay; categories were removed — both
              were redundant entry points to the same destination (/kmetije). */}

          {/* ── First-visit Quick Start guide ─────────────────────────── */}
          <QuickStartGuide />

          {/* ── Featured farms ────────────────────────────────────────── */}
          <Suspense
            fallback={
              <section className="py-20 px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                </div>
              </section>
            }
          >
            <FeaturedFarms />
          </Suspense>

          {/* ── Polaroid gallery ──────────────────────────────────────── */}
          <section className="py-16 px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <PolaroidGallery
                items={[
                  {
                    src: "/images/farms/gallery-zivali.png",
                    alt: "Ovce na kmetiji",
                    caption: "pri ovcah",
                    date: "jun 24",
                    pinColor: "red",
                  },
                  {
                    src: "/images/farms/gallery-kulinarika.png",
                    alt: "Domača štruklja",
                    caption: "domača štruklja",
                    date: "avg 24",
                    pinColor: "gold",
                  },
                  {
                    src: "/images/farms/kmetija-janezu.png",
                    alt: "Jutro v Bohinju",
                    caption: "jutro v Bohinju",
                    date: "sep 24",
                    pinColor: "blue",
                  },
                ]}
              />
            </div>
          </section>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4 — GREEN PASSPORT STAMP BOOK SHOWCASE
          ════════════════════════════════════════════════════════════════════ */}
      <GreenPassportShowcase />

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 5 — VENDOR CTA STRIP
          Discreet entry point for farm owners.
          ════════════════════════════════════════════════════════════════════ */}
      <VendorCTAStrip />
    </>
  );
}
