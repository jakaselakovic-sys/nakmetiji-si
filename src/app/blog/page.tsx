// =============================================================================
// NaKmetiji.si — Blog Landing Page (with pagination)
// =============================================================================

import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, Tag, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Nasveti za podeželski turizem | NaKmetiji",
  description:
    "Nasveti, zgodbe in inspiracija za podeželski turizem v Sloveniji. Odkrijte najboljše turistične kmetije, kulinarične dogodivščine in trajnostne počitnice.",
  keywords: [
    "blog podeželski turizem",
    "turistične kmetije Slovenija nasveti",
    "kulinarični turizem",
    "trajnostni turizem",
    "kmečki turizem zgodbe",
  ],
  openGraph: {
    title: "Blog — Zgodbe s podeželja | NaKmetiji",
    description:
      "Nasveti, zgodbe in inspiracija za vaš naslednji podeželski oddih v Sloveniji.",
    type: "website",
    locale: "sl_SI",
    siteName: "NaKmetiji",
    url: "https://nakmetiji.si/blog",
  },
  alternates: {
    canonical: "https://nakmetiji.si/blog",
  },
};

const POSTS_PER_PAGE = 9;

function BlogJsonLd({ posts }: { posts: { slug: string; title: string; coverImage: string; date: string; description: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog — NaKmetiji",
    description:
      "Nasveti, zgodbe in inspiracija za podeželski turizem v Sloveniji.",
    url: "https://nakmetiji.si/blog",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://nakmetiji.si/blog/${post.slug}`,
        name: post.title,
        image: post.coverImage,
        datePublished: post.date,
        description: post.description,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<BlogSkeleton />}>
      <BlogContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BlogContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const allPosts = getAllPosts();
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const posts = allPosts.slice(
    (safePage - 1) * POSTS_PER_PAGE,
    safePage * POSTS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-cream">
      <BlogJsonLd posts={posts} />
      {/* ── Hero ── */}
      <div className="bg-forest-900 pt-32 pb-20 px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-forest-400 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full bg-forest-300 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs font-medium text-white mb-6">
            <Tag size={14} />
            Zgodbe s podeželja
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Blog
          </h1>
          <p className="text-lg text-white/70">
            Nasveti, zgodbe in inspiracija za vaš naslednji podeželski oddih.
          </p>
        </div>
      </div>

      {/* ── Posts grid ── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-earth-600 text-lg">Prihajajo kmalu novi članki...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* Cover image */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                    priority={i === 0 && safePage === 1}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col">
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-forest-50 text-forest-700 border border-forest-200/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="text-lg font-bold text-forest-900 mb-2 group-hover:text-forest-700 transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-sm text-earth-600 line-clamp-3 mb-4 flex-1">
                    {post.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-earth-500 pt-4 border-t border-earth-100">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(post.date).toLocaleDateString("sl-SI", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readingTime} min
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-forest-600 font-semibold group-hover:gap-2 transition-all">
                      Preberi
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Strani bloga">
            {/* Prev */}
            {safePage > 1 ? (
              <Link
                href={`/blog?page=${safePage - 1}`}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm font-semibold text-forest-700 hover:bg-forest-50 hover:border-forest-300 transition-colors"
              >
                <ChevronLeft size={16} />
                Prejšnja
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-earth-100 bg-earth-50 text-sm font-semibold text-earth-300 cursor-not-allowed">
                <ChevronLeft size={16} />
                Prejšnja
              </span>
            )}

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/blog?page=${page}`}
                  className={`min-w-[40px] h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                    page === safePage
                      ? "bg-forest-700 text-white shadow-md"
                      : "bg-white border border-earth-200 text-earth-700 hover:bg-forest-50 hover:border-forest-300"
                  }`}
                >
                  {page}
                </Link>
              ))}
            </div>

            {/* Next */}
            {safePage < totalPages ? (
              <Link
                href={`/blog?page=${safePage + 1}`}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm font-semibold text-forest-700 hover:bg-forest-50 hover:border-forest-300 transition-colors"
              >
                Naslednja
                <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-earth-100 bg-earth-50 text-sm font-semibold text-earth-300 cursor-not-allowed">
                Naslednja
                <ChevronRight size={16} />
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

function BlogSkeleton() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-forest-900 pt-32 pb-20 px-6 text-center">
        <div className="h-8 w-32 bg-white/20 animate-pulse mx-auto rounded-full mb-6" />
        <div className="h-12 w-48 bg-white/20 animate-pulse mx-auto rounded-xl mb-4" />
        <div className="h-6 w-64 bg-white/10 animate-pulse mx-auto rounded-lg" />
      </div>
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[420px] rounded-2xl bg-white border border-earth-200/60 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
