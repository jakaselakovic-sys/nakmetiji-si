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
  const topExp = data.dozivetja?.[0]?.ime ?? null;

  // Keyword-first title: "turistična kmetija [regija]" is the target phrase
  const title = `${data.ime} | Turistična kmetija ${regionLabel} | NaKmetiji.si`;

  // Rich 155-char description — region + top experience + price + CTA
  const base = (data.kratki_opis ?? data.opis.slice(0, 100).replace(/\n/g, " ")).trim();
  const expSnippet = topExp ? ` Ponudba: ${topExp}.` : "";
  const priceSnippet = data.cena_noc ? ` Od ${data.cena_noc} €/noč.` : "";
  const description = `${base}${expSnippet}${priceSnippet} Rezervirajte na NaKmetiji.si.`.slice(0, 155);

  return {
    title,
    description,
    keywords: [
      "turistična kmetija",
      regionLabel,
      data.ime,
      "kmečki turizem",
      "prenočišče na kmetiji",
      "podeželski turizem Slovenija",
      ...(topExp ? [topExp.toLowerCase()] : []),
    ],
    openGraph: {
      title: `${data.ime} — Turistična kmetija ${regionLabel}`,
      description,
      type: "website",
      locale: "sl_SI",
      siteName: "NaKmetiji",
      images: [{
        url: `https://nakmetiji.si/api/og/kmetije/${slug}`,
        width: 1200,
        height: 630,
        alt: `${data.ime} — Turistična kmetija ${regionLabel}, Slovenija`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  // ── JSON-LD: BreadcrumbList + LodgingBusiness (with Reviews + Offer) ──────
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov",     item: "https://nakmetiji.si" },
      { "@type": "ListItem", position: 2, name: "Kmetije",   item: "https://nakmetiji.si/kmetije" },
      { "@type": "ListItem", position: 3, name: regionLabel, item: `https://nakmetiji.si/regije/${data.regija}` },
      { "@type": "ListItem", position: 4, name: data.ime,    item: `https://nakmetiji.si/kmetije/${data.slug}` },
    ],
  };

  const businessLd = {
    "@context": "https://schema.org",
    "@type": ["LodgingBusiness", "TouristAttraction"],
    "@id": `https://nakmetiji.si/kmetije/${data.slug}#place`,
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
      ratingValue: data.ocena.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      reviewCount: data.stevilo_ocen,
    } : undefined,
    ...(data.cena_noc ? {
      priceRange: `od ${data.cena_noc} € / noč`,
      offers: {
        "@type": "Offer",
        price: data.cena_noc,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        name: `Nočitev — ${data.ime}`,
      },
    } : { priceRange: "€€" }),
    amenityFeature: data.dozivetja.map((d) => ({
      "@type": "LocationFeatureSpecification",
      name: d.ime,
      value: true,
    })),
    // Up to 5 approved reviews — enables star snippets in Google SERP
    ...(odobrena_mnenja.length > 0 ? {
      review: odobrena_mnenja.slice(0, 5).map((m) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: m.ocena,
          bestRating: "5",
        },
        author: { "@type": "Person", name: m.uporabnik_ime },
        reviewBody: m.komentar ?? undefined,
        datePublished: m.datum.split("T")[0],
      })),
    } : {}),
    inLanguage: "sl",
    touristType: "AgroTourism",
  };

  // Backwards-compat: keep single variable for JSX injection
  const jsonLd = [breadcrumbLd, businessLd];

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <FarmProfileClient
        kmetija={kmetijaZaMnenja}
        regionLabel={regionLabel}
        isLoggedIn={isLoggedIn}
        isAlreadyStamped={isAlreadyStamped}
      />
    </>
  );
}
