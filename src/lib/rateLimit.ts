// =============================================================================
// NaKmetiji.si — Global Rate Limiter (Upstash Redis + in-memory fallback)
//
// Usage: const rl = await checkRateLimit(userId, "oracle", 20, 60);
//
// Production: Upstash Redis sliding-window (globally consistent across lambdas)
// Development: In-memory Map fallback (per-instance only)
// =============================================================================

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter?: number; // seconds until reset, only when ok=false
}

// ── Upstash Redis (production) ────────────────────────────────────────────

let _redis: Redis | null = null;
const _limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return _redis;
  }
  return null;
}

function getUpstashLimiter(endpoint: string, limit: number, windowSec: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${endpoint}:${limit}:${windowSec}`;
  let limiter = _limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      analytics: true,
      prefix: `rl:${endpoint}`,
    });
    _limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ── Production guard — warn if Redis is unavailable ──────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (IS_PRODUCTION && !process.env.UPSTASH_REDIS_REST_URL) {
  console.warn(
    "[rateLimit] ⚠️ UPSTASH_REDIS_REST_URL not set in production! " +
    "Rate limiting falls back to per-instance in-memory — NOT globally consistent. " +
    "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for proper protection."
  );
}

// ── In-memory fallback (development / missing env vars) ───────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

const _buckets = new Map<string, Bucket>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of _buckets) {
      if (bucket.resetAt < now) _buckets.delete(key);
    }
  }, 5 * 60_000);
}

function checkInMemory(
  userId: string,
  endpoint: string,
  limit: number,
  windowSec: number
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

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Globally consistent rate limiter.
 * Uses Upstash Redis in production, falls back to in-memory for development.
 *
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
): RateLimitResult | Promise<RateLimitResult> {
  const upstash = getUpstashLimiter(endpoint, limit, windowSec);

  if (upstash) {
    return upstash.limit(`${userId}`).then(({ success, remaining, reset }) => {
      if (success) return { ok: true, remaining };
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1_000));
      return { ok: false, remaining: 0, retryAfter };
    });
  }

  return checkInMemory(userId, endpoint, limit, windowSec);
}
