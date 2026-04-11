// =============================================================================
// NaKmetiji.si — Blur placeholder utility for next/image
//
// BLUR_DATA_URL   – static cream SVG shimmer, safe to import on client
// getBlurDataUrl  – server-only: fetches a real 8-pixel thumbnail via the
//                   Supabase Storage transform API and returns a base64 LQIP.
//                   Falls back to BLUR_DATA_URL if the image is not a
//                   Supabase storage URL or if the transform request fails.
//
// Usage:
//   import { getBlurDataUrl } from "@/lib/blur";
//   const blur = await getBlurDataUrl(kmetija.naslovna_slika);
// =============================================================================

// Cream-colored 4×3 SVG shimmer — always safe, zero latency
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjMiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjMiIGZpbGw9IiNGNEYxRUEiLz48L3N2Zz4=";

// ─── Module-level memory cache (lives for the lifetime of the process) ────────
// On Vercel, each edge invocation is isolated, so the cache mainly helps
// during the build phase and long-lived Node.js workers.
const _cache = new Map<string, string>();

// ─── Supabase Storage transform URL ──────────────────────────────────────────
//
// Original:  .../storage/v1/object/public/[bucket]/[path]
// Rendered:  .../storage/v1/render/image/public/[bucket]/[path]?width=8&quality=10
//
// Requires the "Image Transformations" feature (Supabase Pro or self-hosted).
// Free-tier projects: the fetch will either fail or return the full image,
// in which case we gracefully fall back to BLUR_DATA_URL.

function toTransformUrl(imageUrl: string): string | null {
  try {
    const u = new URL(imageUrl);
    if (
      !u.hostname.endsWith(".supabase.co") ||
      !u.pathname.includes("/storage/v1/object/public/")
    ) {
      return null;
    }
    u.pathname = u.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    u.searchParams.set("width", "8");
    u.searchParams.set("quality", "10");
    u.searchParams.set("format", "webp");
    return u.toString();
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getBlurDataUrl(imageUrl: string | null | undefined): Promise<string> {
  if (!imageUrl) return BLUR_DATA_URL;
  if (_cache.has(imageUrl)) return _cache.get(imageUrl)!;

  const transformUrl = toTransformUrl(imageUrl);
  if (!transformUrl) return BLUR_DATA_URL;

  try {
    const res = await fetch(transformUrl, {
      // Cache the tiny thumbnail at the HTTP layer for 24 h
      next: { revalidate: 86_400 },
    });

    if (!res.ok) return BLUR_DATA_URL;

    // Guard: if the server returned the full image (no transform), skip
    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength > 4_096) return BLUR_DATA_URL; // >4 KB → not a thumbnail

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime   = res.headers.get("content-type") ?? "image/webp";
    const dataUrl = `data:${mime};base64,${base64}`;

    _cache.set(imageUrl, dataUrl);
    return dataUrl;
  } catch {
    return BLUR_DATA_URL;
  }
}
