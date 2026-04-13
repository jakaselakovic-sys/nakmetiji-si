// =============================================================================
// NaKmetiji.si — Regija Landing Page
// /regije/[slug] — SEO target: "turistična kmetija [regija]"
//
// Each Slovenian region gets a dedicated landing page that:
//   1. Ranks for "[regija] turistična kmetija" keyword
//   2. Lists active farms for that region
//   3. Has BreadcrumbList + ItemList JSON-LD for Google rich results
//   4. Serves as a hub page for internal linking
// =============================================================================

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { REGIJA_LABELS, REGIJE, type Regija } from "@/types/database";
import { BLUR_DATA_URL } from "@/lib/blur";

export const revalidate = 3600; // Re-generate at most once per hour

const BASE_URL = "https://nakmetiji.si";

// Pre-generate all 12 region slugs at build time
export function generateStaticParams() {
  return REGIJE.map((slug) => ({ slug }));
}

// ── Regional descriptions for SEO content ───────────────────────────────────

const REGIJA_OPIS: Record<Regija, string> = {
  gorenjska: "Dežela Triglava, Blejskega jezera in alpskih travnikov. Turistične kmetije v Gorenjski ponujajo svež gorski zrak, pohodništvo in pristno alpsko kulinariko.",
  primorska: "Mediteransko podnebje, oljčni nasadi in kraška pokrajina. Kmetije v Primorski združujejo morje, vino in domačo kuhinjo z mediteranskim pridihom.",
  stajerska: "Vinogradniška dežela s toplimi pobočji Haloz in Slovenskih goric. Turistične kmetije v Štajerski so znane po odličnih vinih in bogati kulinarični tradiciji.",
  dolenjska: "Mirna podeželska idila ob reki Krki. Kmetije v Dolenjski nudijo sadovnjake, vinogradništvo in toplico ob termalni vodi.",
  koroska: "Gorska dežela ob avstrijski meji z bogatim planinskim izročilom in čisto naravo Pohorja.",
  savinjska: "Hmeljarsko srce Slovenije z zelenimi dolinami in Logarsko dolino. Turistične kmetije v Savinjski regiji so raj za ljubitelje narave.",
  pomurska: "Ravninska pokrajina ob Muri z vinogradi Jeruzalema in Ljutomera. Kmetije v Pomurski ponujajo bogato folklorno in kulinarično dediščino.",
  notranjska: "Dežela Postojnske jame in Cerkniškega jezera. Turistične kmetije v Notranjski so odlično izhodišče za odkrivanje jamskega sveta.",
  zasavska: "Zelena dolina Zagorja s sadovnjaki in mirnim podeželjem ob Savi.",
  posavska: "Vinogradniška pokrajina ob Savi z bizeljskimi kraškimi kletmi in vinski poti.",
  jugovzhodna_slovenija: "Dežela divje narave, medvedov in Kočevskega pragozda. Ekoturizem in kmečka gostoljubnost v srcu zelene Evrope.",
  osrednjeslovenska: "Podeželje v okolici Ljubljane — idealna kombinacija bližine mesta in pristne kmečke izkušnje.",
};

const REGIJA_EMOJI: Record<Regija, string> = {
  gorenjska: "🏔️", primorska: "🌊", stajerska: "🌾", dolenjska: "🍷",
  koroska: "⛰️", savinjska: "🌿", pomurska: "🌻", notranjska: "🌲",
  zasavska: "🏞️", posavska: "🍇", jugovzhodna_slovenija: "🦌", osrednjeslovenska: "🏙️",
};

type Props = { params: Promise<{ slug: string }> };

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!REGIJE.includes(slug as Regija)) return { title: "Regija ni najdena" };

  const regija = slug as Regija;
  const label  = REGIJA_LABELS[regija];

  const title       = `Turistične kmetije ${label} | NaKmetiji.si`;
  const description = `Odkrijte najboljše turistične kmetije v regiji ${label}. ${REGIJA_OPIS[regija].slice(0, 90)} Prenočišča, kulinarika in doživetja — rezervirajte na NaKmetiji.si.`;

  return {
    title,
    description,
    keywords: [
      `turistična kmetija ${label}`,
      `kmetija ${label}`,
      `prenočišče ${label}`,
      "kmečki turizem Slovenija",
      "podeželski turizem",
      label,
    ],
    openGraph: {
      title,
      description,
      type: "website",
      locale: "sl_SI",
      siteName: "NaKmetiji",
      url: `${BASE_URL}/regije/${regija}`,
    },
    alternates: { canonical: `${BASE_URL}/regije/${regija}` },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function RegijaPage({ params }: Props) {
  const { slug } = await params;
  if (!REGIJE.includes(slug as Regija)) notFound();

  const regija = slug as Regija;
  const label  = REGIJA_LABELS[regija];

  // Anon client — no auth needed for public farm list
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: farms } = await supabase
    .from("kmetije")
    .select("id, slug, ime, kratki_opis, naslovna_slika, ocena, stevilo_ocen, cena_noc, premium")
    .eq("aktivna", true)
    .eq("regija", regija)
    .order("premium", { ascending: false })
    .order("ocena",   { ascending: false, nullsFirst: false })
    .limit(24);

  const farmList = farms ?? [];

  // ── JSON-LD ──────────────────────────────────────────────────────────────
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov",  item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Regije", item: `${BASE_URL}/regije` },
      { "@type": "ListItem", position: 3, name: label,    item: `${BASE_URL}/regije/${regija}` },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Turistične kmetije ${label}`,
    description: REGIJA_OPIS[regija],
    url: `${BASE_URL}/regije/${regija}`,
    numberOfItems: farmList.length,
    itemListElement: farmList.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: f.ime,
      url: `${BASE_URL}/kmetije/${f.slug}`,
      image: f.naslovna_slika ?? undefined,
    })),
  };

  return (
    <>
      {[breadcrumbLd, itemListLd].map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      <div className="min-h-screen bg-earth-50">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="bg-forest-900 text-white">
          <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
            <nav className="flex items-center gap-2 text-forest-300 text-sm mb-6">
              <Link href="/" className="hover:text-white transition-colors">Domov</Link>
              <span>/</span>
              <Link href="/regije" className="hover:text-white transition-colors">Regije</Link>
              <span>/</span>
              <span className="text-white font-semibold">{label}</span>
            </nav>
            <div className="flex items-start gap-4">
              <span className="text-5xl" aria-hidden="true">{REGIJA_EMOJI[regija]}</span>
              <div>
                <h1 className="text-4xl sm:text-5xl font-black mb-3 leading-tight">
                  Turistične kmetije<br />
                  <span className="text-emerald-400">{label}</span>
                </h1>
                <p className="text-forest-200 text-lg max-w-2xl leading-relaxed">
                  {REGIJA_OPIS[regija]}
                </p>
                <p className="mt-4 text-emerald-300 text-sm font-semibold">
                  {farmList.length} {farmList.length === 1 ? "kmetija" : farmList.length < 5 ? "kmetije" : "kmetij"} v regiji
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Farm grid ────────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          {farmList.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-earth-300 bg-white p-16 text-center">
              <p className="text-earth-500 text-lg font-medium mb-3">
                V regiji {label} še ni registriranih kmetij.
              </p>
              <Link
                href="/kmetije"
                className="inline-flex items-center gap-2 text-forest-600 font-semibold hover:text-forest-800"
              >
                <ArrowRight size={16} /> Oglej si vse kmetije
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {farmList.map((farm) => (
                <Link
                  key={farm.id}
                  href={`/kmetije/${farm.slug}`}
                  className="group bg-white rounded-2xl border border-earth-200/60 shadow-sm hover:shadow-lg hover:border-forest-200 transition-all overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {farm.naslovna_slika ? (
                      <Image
                        src={farm.naslovna_slika}
                        alt={`${farm.ime} — turistična kmetija ${label}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    ) : (
                      <div className="w-full h-full bg-forest-100 flex items-center justify-center">
                        <MapPin size={32} className="text-forest-300" />
                      </div>
                    )}
                    {farm.premium && (
                      <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Premium
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h2 className="font-bold text-forest-900 text-base mb-1 group-hover:text-forest-700 transition-colors">
                      {farm.ime}
                    </h2>
                    {farm.kratki_opis && (
                      <p className="text-sm text-earth-600 line-clamp-2 mb-3">{farm.kratki_opis}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {farm.ocena ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <Star size={12} fill="currentColor" />
                          {farm.ocena.toFixed(1)}
                          <span className="text-earth-400 font-normal">({farm.stevilo_ocen})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-earth-400">Nova kmetija</span>
                      )}
                      {farm.cena_noc ? (
                        <span className="text-xs font-bold text-forest-700">
                          od {farm.cena_noc} €<span className="text-earth-400 font-normal">/noč</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Cross-link to other regions */}
          <div className="mt-16 pt-12 border-t border-earth-200">
            <h2 className="text-xl font-bold text-forest-900 mb-6">Druge regije</h2>
            <div className="flex flex-wrap gap-2">
              {REGIJE.filter((r) => r !== regija).map((r) => (
                <Link
                  key={r}
                  href={`/regije/${r}`}
                  className="flex items-center gap-1.5 rounded-xl bg-white border border-earth-200 hover:border-forest-300 px-4 py-2 text-sm font-medium text-earth-700 hover:text-forest-800 transition-all"
                >
                  <span>{REGIJA_EMOJI[r]}</span>
                  {REGIJA_LABELS[r]}
                  <ArrowRight size={12} className="text-earth-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
