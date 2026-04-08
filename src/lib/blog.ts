// =============================================================================
// NaKmetiji.si — Blog Content Loader
// Bere MDX/MD datoteke iz src/content/blog/ s frontmatter metapodatki
// =============================================================================

import fs from "fs";
import path from "path";

// ─── Tipi ──────────────────────────────────────────────────────────────────

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  coverImage: string;
  tags: string[];
  readingTime: number;
  content: string;
}

export interface BlogPostMeta
  extends Omit<BlogPost, "content"> {}

// ─── Frontmatter parser ───────────────────────────────────────────────────

function parseFrontmatter(raw: string): {
  data: Record<string, string | string[]>;
  content: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data: Record<string, string | string[]> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Handle arrays: tags: [a, b, c]
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""));
    } else {
      // Strip quotes
      value = value.replace(/^["']|["']$/g, "");
      data[key] = value;
    }
  }

  return { data, content: match[2] };
}

// ─── Reading time estimator ───────────────────────────────────────────────

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ─── Content directory ────────────────────────────────────────────────────

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Prebere vse blog objave, sortirane po datumu (najnovejše najprej).
 */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = parseFrontmatter(raw);
    const slug = file.replace(/\.mdx?$/, "");

    return {
      slug,
      title: (data.title as string) || slug,
      description: (data.description as string) || "",
      date: (data.date as string) || new Date().toISOString().slice(0, 10),
      author: (data.author as string) || "NaKmetiji ekipa",
      coverImage: (data.coverImage as string) || "/images/hero-illustration.png",
      tags: Array.isArray(data.tags) ? data.tags : [],
      readingTime: estimateReadingTime(content),
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Prebere posamezno blog objavo po slug-u.
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const extensions = [".mdx", ".md"];

  for (const ext of extensions) {
    const filePath = path.join(BLOG_DIR, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = parseFrontmatter(raw);

      return {
        slug,
        title: (data.title as string) || slug,
        description: (data.description as string) || "",
        date: (data.date as string) || new Date().toISOString().slice(0, 10),
        author: (data.author as string) || "NaKmetiji ekipa",
        coverImage: (data.coverImage as string) || "/images/hero-illustration.png",
        tags: Array.isArray(data.tags) ? data.tags : [],
        readingTime: estimateReadingTime(content),
        content,
      };
    }
  }

  return null;
}

/**
 * Vrne vse slug-e za generateStaticParams.
 */
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}
