// =============================================================================
// NaKmetiji.si — Kronika public share view
// /kronika/[slug] — renders a past Kronika issue as a readable web page with
// full OpenGraph/BreadcrumbList JSON-LD for AEO.
// =============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

interface Issue {
  issue_number: number;
  slug: string;
  title: string;
  intro: string;
  body_md: string;
  proverb: string;
  published_at: string;
  week_start: string;
  week_end: string;
}

async function fetchIssue(slug: string): Promise<Issue | null> {
  const sb = await createSupabaseServer();
  const { data } = await sb
    .from("kronika_entries")
    .select("issue_number, slug, title, intro, body_md, proverb, published_at, week_start, week_end")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Issue | null) ?? null;
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const issue = await fetchIssue(slug);
  if (!issue) return { title: "Kronika ni najdena" };

  const url = `https://nakmetiji.si/kronika/${issue.slug}`;
  return {
    title: `${issue.title} — Jožetova Kronika`,
    description: issue.intro,
    alternates: { canonical: url },
    openGraph: {
      title: issue.title,
      description: issue.intro,
      url,
      type: "article",
      publishedTime: issue.published_at,
    },
  };
}

function renderMarkdownBlocks(md: string): React.ReactElement[] {
  // Minimal renderer for the generator's known subset. Generated content is
  // trusted — we produce it ourselves — so we can splinter on blank lines.
  const blocks = md.trim().split(/\n\n+/);
  return blocks.map((b, i) => {
    const trimmed = b.trim();

    if (trimmed.startsWith("# ")) {
      return <h1 key={i} className="font-display text-4xl font-black text-forest-900 mb-4">{trimmed.slice(2)}</h1>;
    }
    if (trimmed.startsWith("## ")) {
      return <h2 key={i} className="font-display text-2xl font-bold text-forest-900 mt-8 mb-3">{trimmed.slice(3)}</h2>;
    }
    const headingLink = trimmed.match(/^### \[(.+?)\]\((.+?)\)$/);
    if (headingLink) {
      return (
        <h3 key={i} className="font-display text-lg font-bold mt-6 mb-2">
          <Link href={headingLink[2]} className="text-forest-800 hover:text-amber-700 underline decoration-dotted underline-offset-4">
            {headingLink[1]}
          </Link>
        </h3>
      );
    }
    if (trimmed.startsWith("### ")) {
      return <h3 key={i} className="font-display text-lg font-bold mt-6 mb-2">{trimmed.slice(4)}</h3>;
    }
    if (trimmed.startsWith("> ")) {
      // Quote block (our proverb)
      const inner = trimmed.slice(2).replace(/^\*(.+)\*$/, "$1");
      return (
        <blockquote key={i} className="border-l-4 border-amber-400 bg-amber-50/60 px-5 py-3 my-6 italic font-display text-lg text-forest-900">
          {inner}
        </blockquote>
      );
    }
    if (trimmed === "---") {
      return <hr key={i} className="border-earth-200 my-8" />;
    }
    // Plain paragraph with bold + italic + links rewritten
    const html = trimmed
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-forest-700 underline decoration-dotted underline-offset-2 hover:text-amber-700">$1</a>');
    return (
      <p
        key={i}
        className="text-earth-700 leading-relaxed my-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
}

export default async function KronikaIssuePage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const issue = await fetchIssue(slug);
  if (!issue) notFound();

  return (
    <article className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600/70 hover:text-forest-700">
          ← NaKmetiji.si
        </Link>
        <p className="text-xs text-earth-500 mt-4">
          Izdaja #{issue.issue_number} · {new Date(issue.published_at).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="mt-6 prose prose-sm max-w-none">
          {renderMarkdownBlocks(issue.body_md)}
        </div>
      </div>
    </article>
  );
}
