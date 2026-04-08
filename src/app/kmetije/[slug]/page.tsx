import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MOCK_KMETIJE, pridobiMockKmetijo } from "@/data/mock-data";
import { REGIJA_LABELS } from "@/types/database";
import { FarmProfileClient } from "./FarmProfileClient";

// ─── Static params for build ────────────────────────────────────────────────

export async function generateStaticParams() {
  return MOCK_KMETIJE.map((k) => ({ slug: k.slug }));
}

// ─── Dynamic metadata ───────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = pridobiMockKmetijo(slug);
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
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function FarmProfilePage({ params }: Props) {
  const { slug } = await params;
  const data = pridobiMockKmetijo(slug);
  if (!data) notFound();

  const regionLabel = REGIJA_LABELS[data.regija] ?? data.regija;

  // ── JSON-LD Schema.org LodgingBusiness ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: data.ime,
    description: data.kratki_opis ?? data.opis.slice(0, 300),
    url: `https://nakmetiji.si/kmetije/${data.slug}`,
    image: data.naslovna_slika,
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
        kmetija={data}
        regionLabel={regionLabel}
      />
    </>
  );
}
