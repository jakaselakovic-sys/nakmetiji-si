// =============================================================================
// NaKmetiji.si — /kronika  (public index of all issues)
// AEO-friendly: canonical + CollectionPage JSON-LD so AI crawlers pick up
// the whole series.
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { KronikaSubscribeWidget } from "@/components/KronikaSubscribeWidget";

interface IssueRow {
  issue_number: number;
  slug: string;
  title: string;
  intro: string;
  published_at: string;
}

export const metadata: Metadata = {
  title: "Jožetova Kronika — tedensko pismo s slovenskega podeželja",
  description:
    "Vsako nedeljo Jože pošlje kratko pismo — ena kmetija, en pregovor, ena zgodba iz slovenskega podeželja. Tu je arhiv.",
  alternates: { canonical: "https://nakmetiji.si/kronika" },
  openGraph: {
    title: "Jožetova Kronika",
    description: "Arhiv tedenskih pisem s slovenskega podeželja.",
    url: "https://nakmetiji.si/kronika",
    type: "website",
  },
};

function buildCollectionLd(issues: IssueRow[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://nakmetiji.si/kronika#collection",
    name: "Jožetova Kronika",
    description:
      "Tedenska pisma s slovenskega podeželja — arhiv izdaj Jožetove Kronike.",
    url: "https://nakmetiji.si/kronika",
    inLanguage: "sl",
    publisher: {
      "@type": "Organization",
      name: "NaKmetiji",
      url: "https://nakmetiji.si",
    },
    hasPart: issues.map((i) => ({
      "@type": "Article",
      headline: i.title,
      url: `https://nakmetiji.si/kronika/${i.slug}`,
      datePublished: i.published_at,
      description: i.intro,
    })),
  };
}

export default async function KronikaIndexPage() {
  const sb = await createSupabaseServer();
  const { data } = await sb
    .from("kronika_entries")
    .select("issue_number, slug, title, intro, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(60);

  const issues = (data as IssueRow[] | null) ?? [];

  return (
    <div className="min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildCollectionLd(issues)) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600/70 hover:text-forest-700"
        >
          ← NaKmetiji.si
        </Link>

        <div className="mt-6 mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600/70 mb-3">
            Arhiv
          </p>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-forest-900 tracking-tight mb-4">
            Jožetova Kronika
          </h1>
          <p className="text-earth-600 leading-relaxed max-w-xl">
            Vsako nedeljo eno pismo — ena kmetija, en pregovor, ena zgodba. Brez marketinga,
            brez klikbejta. Naroči se spodaj ali preberi pretekle izdaje.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-earth-200 p-5 mb-12">
          <KronikaSubscribeWidget variant="light" />
        </div>

        <h2 className="font-display font-bold text-xl text-forest-900 mb-4">
          Pretekle izdaje
        </h2>

        {issues.length === 0 ? (
          <p className="text-sm text-earth-500 italic">Kronika bo izšla prvič kmalu.</p>
        ) : (
          <ul className="space-y-3">
            {issues.map((i) => (
              <li key={i.slug}>
                <Link
                  href={`/kronika/${i.slug}`}
                  className="group block rounded-2xl border border-earth-200 bg-white hover:border-forest-300 hover:shadow-md transition-all p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-earth-500 mb-1">
                        Izdaja #{i.issue_number} ·{" "}
                        {new Date(i.published_at).toLocaleDateString("sl-SI", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <h3 className="font-display font-bold text-forest-900 text-base sm:text-lg group-hover:text-amber-700 transition-colors">
                        {i.title}
                      </h3>
                      <p className="text-sm text-earth-600 mt-1 leading-relaxed line-clamp-2">
                        {i.intro}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
