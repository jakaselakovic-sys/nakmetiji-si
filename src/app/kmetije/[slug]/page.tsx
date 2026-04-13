// =============================================================================
// NaKmetiji.si — Profil kmetije
// Server component: Supabase → FarmProfileClient
// =============================================================================

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { pridobiKmetijo } from "@/lib/actions/kmetije";
import { REGIJA_LABELS } from "@/types/database";
import { FarmProfileClient } from "./FarmProfileClient";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── Dynamic metadata ───────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await pridobiKmetijo(slug);
  if (!data) return { title: "Kmetija ni najdena — NaKmetiji" };

  const regionLabel = REGIJA_LABELS[data.regija] ?? data.regija;

  return {
    title: `${data.ime} — ${regionLabel} | NaKmetiji`,
    description: data.kratki_opis ?? data.opis.slice(0, 160).replace(/\n/g, " "),
    openGraph: {
      title: `${data.ime} — ${regionLabel}`,
      description: data.kratki_opis ?? data.opis.slice(0, 160).replace(/\n/g, " "),
      type: "website",
      locale: "sl_SI",
      siteName: "NaKmetiji",
      images: [{
        url: `https://nakmetiji.si/api/og/kmetije/${slug}`,
        width: 1200,
        height: 630,
        alt: `${data.ime} — ${regionLabel}`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      images: [`https://nakmetiji.si/api/og/kmetije/${slug}`],
    },
    alternates: {
      canonical: `https://nakmetiji.si/kmetije/${slug}`,
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function FarmProfilePage({ params }: Props) {
  const { slug } = await params;
  const data = await pridobiKmetijo(slug);
  if (!data) notFound();

  const regionLabel = REGIJA_LABELS[data.regija] ?? data.regija;

  // Samo odobrena mnenja prikažemo obiskovalcem
  const odobrena_mnenja = (data.mnenja ?? []).filter((m) => m.status === "odobreno");

  const kmetijaZaMnenja = {
    ...data,
    mnenja: odobrena_mnenja,
    izdelki: data.izdelki ?? [],
  };

  // Green Passport: check if user is logged in and has already stamped this farm
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  let isAlreadyStamped = false;
  if (user) {
    const { data: stamp } = await supabase
      .from("green_stamps")
      .select("id")
      .eq("gost_id", user.id)
      .eq("kmetija_id", data.id)
      .maybeSingle();
    isAlreadyStamped = !!stamp;
  }

  // ── JSON-LD Schema.org LodgingBusiness ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: data.ime,
    description: data.kratki_opis ?? data.opis.slice(0, 300),
    url: `https://nakmetiji.si/kmetije/${data.slug}`,
    image: data.naslovna_slika || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.naslov ?? undefined,
      addressLocality: data.obcina ?? undefined,
      postalCode: data.postna_stevilka ?? undefined,
      addressRegion: regionLabel,
      addressCountry: "SI",
    },
    geo: data.lat && data.lng ? {
      "@type": "GeoCoordinates",
      latitude: data.lat,
      longitude: data.lng,
    } : undefined,
    telephone: data.kontaktni_podatki?.telefon ?? undefined,
    email: data.kontaktni_podatki?.email ?? undefined,
    aggregateRating: data.ocena ? {
      "@type": "AggregateRating",
      ratingValue: data.ocena,
      bestRating: 5,
      worstRating: 1,
      reviewCount: data.stevilo_ocen,
    } : undefined,
    priceRange: "€€",
    amenityFeature: data.dozivetja.map((d) => ({
      "@type": "LocationFeatureSpecification",
      name: d.ime,
      value: true,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FarmProfileClient
        kmetija={kmetijaZaMnenja}
        regionLabel={regionLabel}
        isLoggedIn={isLoggedIn}
        isAlreadyStamped={isAlreadyStamped}
      />
    </>
  );
}
