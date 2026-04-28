// =============================================================================
// NaKmetiji.si — Profil kmetije
// Server component: Supabase → FarmProfileClient
// =============================================================================

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { pridobiKmetijo } from "@/lib/actions/kmetije";
import { REGIJA_LABELS } from "@/types/database";
import { FarmProfileClient } from "./FarmProfileClient";
import { Suspense } from "react";
import { GreenPassportStampServer } from "./GreenPassportStampServer";

 // ISR: re-generate at most once per hour

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
  const base = (data.kratki_opis ?? (data.opis || "").slice(0, 100).replace(/\n/g, " ")).trim();
  const expSnippet = topExp ? ` Ponudba: ${topExp}.` : "";
  const priceSnippet = data.cena_noc ? ` Od ${data.cena_noc} €/noč.` : "";
  const description = `${base}${expSnippet}${priceSnippet} Rezervirajte na NaKmetiji.si.`.slice(0, 155);

  // Build experience list for meta
  const expList = (data.dozivetja ?? []).map((d) => d.ime).join(", ");

  return {
    // title.absolute bypasses the layout template to avoid double-suffixing
    title: { absolute: title },
    description,
    keywords: [
      "turistična kmetija",
      `turistična kmetija ${regionLabel}`,
      regionLabel,
      data.ime,
      "kmečki turizem",
      "prenočišče na kmetiji",
      "podeželski turizem Slovenija",
      "kmetija Slovenija",
      ...(topExp ? [topExp.toLowerCase()] : []),
      ...(data.obcina ? [data.obcina] : []),
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: `${data.ime} — Turistična kmetija ${regionLabel}`,
      description,
      type: "website",
      locale: "sl_SI",
      siteName: "NaKmetiji",
      url: `https://nakmetiji.si/kmetije/${slug}`,
      // File-based OG image route — Next.js auto-resolves this to the
      // opengraph-image/route.tsx handler with correct content-type headers
      images: [`/kmetije/${slug}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/kmetije/${slug}/opengraph-image`],
    },
    alternates: {
      canonical: `https://nakmetiji.si/kmetije/${slug}`,
    },
    // AI search context signals
    other: {
      "ai-content-context": `Authentic Slovenian agritourism farm-stay in ${regionLabel}. ${expList ? `Offering: ${expList}.` : ""}`,
      "article:section": regionLabel,
      "article:tag": expList,
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

  // Green Passport logic is now deferred via Suspense for PPR
  const stampWidget = (
    <Suspense fallback={
      <div className="rounded-2xl bg-white border border-emerald-200/70 shadow-sm p-5 animate-pulse h-[120px]" />
    }>
      <GreenPassportStampServer kmetijaId={data.id} />
    </Suspense>
  );

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

  // ── JSON-LD: Product schema for farm products (Digitalna Tržnica) ──────────
  const izdelki = data.izdelki ?? [];
  const productLd = izdelki.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Domači izdelki — ${data.ime}`,
    url: `https://nakmetiji.si/kmetije/${data.slug}`,
    numberOfItems: izdelki.length,
    itemListElement: izdelki.slice(0, 10).map((izdelek, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: izdelek.ime,
        description: izdelek.opis ?? `Domači izdelek kmetije ${data.ime}`,
        image: izdelek.slika_url ?? data.naslovna_slika ?? undefined,
        brand: { "@type": "Brand", name: data.ime },
        offers: {
          "@type": "Offer",
          price: izdelek.cena,
          priceCurrency: "EUR",
          availability: izdelek.na_voljo
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: data.ime },
        },
      },
    })),
  } : null;

  // ── JSON-LD: FAQPage — auto-generated FAQs for AI search / PAA ────────────
  const faqItems: { q: string; a: string }[] = [
    {
      q: `Kje se nahaja ${data.ime}?`,
      a: `${data.ime} se nahaja v regiji ${regionLabel}${data.obcina ? `, občina ${data.obcina}` : ""}${data.naslov ? `, na naslovu ${data.naslov}` : ""}. Slovenija.`,
    },
    {
      q: `Kaj ponuja ${data.ime}?`,
      a: `${data.ime} ponuja: ${data.dozivetja.map((d) => d.ime).join(", ") || "raznovrstna podeželska doživetja"}.${data.cena_noc ? ` Cena prenočitve je od ${data.cena_noc} € na noč.` : ""}`,
    },
    {
      q: `Kakšna je ocena kmetije ${data.ime}?`,
      a: data.ocena
        ? `${data.ime} ima oceno ${data.ocena.toFixed(1)}/5 na podlagi ${data.stevilo_ocen} ocen gostov.`
        : `${data.ime} je nova kmetija na platformi NaKmetiji.si in še nima ocen.`,
    },
  ];

  if (izdelki.length > 0) {
    faqItems.push({
      q: `Katere domače izdelke prodaja ${data.ime}?`,
      a: `${data.ime} ponuja ${izdelki.length} domačih izdelkov, med njimi: ${izdelki.slice(0, 5).map((i) => i.ime).join(", ")}.`,
    });
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  // Backwards-compat: keep single variable for JSX injection
  const jsonLd = [
    breadcrumbLd,
    businessLd,
    faqLd,
    ...(productLd ? [productLd] : []),
  ];

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
        stampWidget={stampWidget}
      />
    </>
  );
}
