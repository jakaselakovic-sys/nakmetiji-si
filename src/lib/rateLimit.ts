// =============================================================================
// NaKmetiji.si — Simple in-process rate limiter
//
// Usage: call checkRateLimit(userId, "oracle", 20, 60) to allow 20 req/min.
// Returns { ok: true } or { ok: false, retryAfter: seconds }.
//
// IMPORTANT — serverless caveat:
//   On Vercel each lambda instance has its own Map. This does NOT provide
//   globally consistent rate limits across instances — it prevents burst
//   abuse on warm instances and protects during scale-to-zero cold starts.
//   For strict global rate limiting, migrate to Upstash Redis.
// =============================================================================

interface Bucket {
  count: number;
  resetAt: number;
}

// Keyed by `${userId}:${endpoint}`
const _buckets = new Map<string, Bucket>();

// Periodic cleanup — prevent unbounded growth (runs every 5 min, server-side)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of _buckets) {
      if (bucket.resetAt < now) _buckets.delete(key);
    }
  }, 5 * 60_000);
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter?: number; // seconds until reset, only when ok=false
}

/**
 * @param userId    Supabase user ID (or IP for unauthenticated routes)
 * @param endpoint  Short label, e.g. "oracle" or "apple-ify"
 * @param limit     Max requests per window
 * @param windowSec Window size in seconds (default: 60)
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number,
  windowSec = 60
): RateLimitResult {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();

  let bucket = _buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowSec * 1_000 };
    _buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1_000),
    };
  }

  return { ok: true, remaining: limit - bucket.count };
}
