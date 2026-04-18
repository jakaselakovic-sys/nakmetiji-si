// =============================================================================
// NaKmetiji.si — Blog Post Page
// Renderira MDX vsebino z brand stilizacijo
// =============================================================================

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";
import { getPostBySlug, getAllPostSlugs } from "@/lib/blog";

// ─── Static params ────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Članek ni najden — NaKmetiji" };

  return {
    title: `${post.title} — Blog | NaKmetiji`,
    description: post.description,
    keywords: post.tags,
    alternates: {
      canonical: `https://nakmetiji.si/blog/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: post.coverImage, width: 1200, height: 630 }],
      url: `https://nakmetiji.si/blog/${slug}`,
    },
  };
}

// ─── Simple Markdown → HTML renderer ──────────────────────────────────────

function renderMarkdown(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-forest-900 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-forest-900 mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-extrabold text-forest-900 mt-10 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-forest-900">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-forest-600 underline underline-offset-2 hover:text-forest-800 transition-colors">$1</a>'
    )
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-10 border-earth-200" />')
    // Unordered lists
    .replace(
      /^- (.+)$/gm,
      '<li class="flex items-start gap-2 text-earth-700 leading-relaxed"><span class="text-forest-500 mt-1.5 flex-shrink-0">•</span><span>$1</span></li>'
    );

  // Wrap consecutive <li> in <ul>
  html = html.replace(
    /(<li[\s\S]*?<\/li>\n?)+/g,
    (match) => `<ul class="space-y-2 my-4">${match}</ul>`
  );

  // Paragraphs: wrap remaining lines that aren't already HTML tags
  html = html
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<")) return trimmed;
      return `<p class="text-earth-700 leading-relaxed mb-4">${trimmed}</p>`;
    })
    .join("\n");

  return html;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const contentHtml = renderMarkdown(post.content);

  // JSON-LD Article schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.coverImage,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "NaKmetiji",
      url: "https://nakmetiji.si",
    },
    mainEntityOfPage: `https://nakmetiji.si/blog/${post.slug}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: "https://nakmetiji.si" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://nakmetiji.si/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://nakmetiji.si/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <article className="min-h-screen bg-cream">
        {/* ── Hero ── */}
        <div className="relative">
          <div className="relative aspect-[21/9] max-h-[420px] overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-900/80 via-forest-900/30 to-transparent" />
          </div>

          {/* Overlay content */}
          <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-8 pb-10">
            <div className="max-w-3xl mx-auto">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm border border-white/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <User size={14} />
                  {post.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {new Date(post.date).toLocaleDateString("sl-SI", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {post.readingTime} min branja
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-forest-600 hover:text-forest-800 transition-colors mb-10"
          >
            <ArrowLeft size={16} />
            Nazaj na blog
          </Link>

          {/* Article body */}
          <div
            className="prose-nakmetiji"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* CTA */}
          <div className="mt-16 rounded-2xl bg-forest-900 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-5 left-5 w-40 h-40 rounded-full bg-forest-400 blur-3xl" />
              <div className="absolute bottom-5 right-5 w-60 h-60 rounded-full bg-forest-300 blur-3xl" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-2">
                Navdihnjeni?
              </h3>
              <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">
                Odkrijte turistične kmetije po vsej Sloveniji in rezervirajte
                svoj naslednji podeželski oddih.
              </p>
              <Link
                href="/kmetije"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-forest-800 font-semibold px-6 py-3 text-sm shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all"
              >
                Razišči kmetije
                <ArrowLeft size={16} className="rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
