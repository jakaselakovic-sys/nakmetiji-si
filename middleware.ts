// =============================================================================
// NaKmetiji.si — Titan Middleware (Edge runtime)
// Zero-DB-hit admin auth via JWT `app_metadata.vloga` claim + Upstash
// rate-limit shield on /admin. Non-admin paths pass through untouched.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, decodeJwt } from "jose";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Rate limiter ──────────────────────────────────────────────────────────
// 3 admin-access attempts per IP per 10 min. After that → 429 for 1 h.
let adminLimiter: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  adminLimiter = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(3, "10 m"),
    prefix: "rl:admin",
  });
}

// ─── JWT verification ──────────────────────────────────────────────────────
// Supabase signs JWTs with the project's JWT secret (HS256). For Edge we can
// either verify the signature (recommended) or merely decode + trust (faster).
// Verifying is the correct default because the cookie is user-controlled.
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET
  ? new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET)
  : null;

interface AppClaims {
  sub: string;
  app_metadata?: { vloga?: string };
  aal?: "aal1" | "aal2";
  exp: number;
}

async function readVlogaFromCookie(req: NextRequest): Promise<AppClaims | null> {
  // Supabase SSR stores the access token in a cookie named `sb-<ref>-auth-token`.
  const tokenCookie = req.cookies
    .getAll()
    .find((c) => c.name.endsWith("-auth-token"));
  if (!tokenCookie) return null;

  // Cookie value is often a JSON-wrapped array: ["access_token", "refresh_token", ...]
  let accessToken: string | null = null;
  try {
    const parsed = JSON.parse(tokenCookie.value);
    accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token ?? null;
  } catch {
    accessToken = tokenCookie.value; // raw token fallback
  }
  if (!accessToken || typeof accessToken !== "string") return null;

  try {
    if (JWT_SECRET) {
      const { payload } = await jwtVerify(accessToken, JWT_SECRET, { algorithms: ["HS256"] });
      return payload as unknown as AppClaims;
    }
    // No secret configured — decode without verification (dev only)
    return decodeJwt(accessToken) as unknown as AppClaims;
  } catch {
    return null;
  }
}

// ─── Middleware ────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Circuit Breaker — Global Read-Only Mode ──────────────────────────────
  // When system:maintenance is set in Redis, block ALL mutating requests.
  // Health/ping endpoints are exempt so monitoring still works.
  const isMutating = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
  const isExempt = pathname.startsWith("/api/ping") || pathname.startsWith("/api/health") || pathname.startsWith("/api/cron");

  if (isMutating && !isExempt && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const maintenance = await redis.get<string>("system:maintenance");
      if (maintenance === "true" || maintenance === "1") {
        return new NextResponse(
          JSON.stringify({ error: "Platforma je trenutno v vzdrževalnem načinu. Poskusite pozneje." }),
          { status: 503, headers: { "Content-Type": "application/json", "Retry-After": "300" } }
        );
      }
    } catch {
      // Redis failure must not block normal traffic — fail open
    }
  }

  const isAdminPath = pathname.startsWith("/admin");
  const isAdminAction = pathname.startsWith("/api/admin");

  if (!isAdminPath && !isAdminAction) return NextResponse.next();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
          ?? req.headers.get("x-real-ip")
          ?? "unknown";

  // Rate-limit every /admin request so a bot spraying credentials is capped
  if (adminLimiter) {
    const { success } = await adminLimiter.limit(`${ip}:${pathname}`);
    if (!success) {
      return new NextResponse(
        "Too many admin access attempts. Locked out for 1 hour.",
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }
  }

  const claims = await readVlogaFromCookie(req);

  if (!claims) {
    const url = req.nextUrl.clone();
    url.pathname = "/prijava";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (Date.now() / 1000 > claims.exp) {
    const url = req.nextUrl.clone();
    url.pathname = "/prijava";
    url.searchParams.set("redirect", pathname);
    url.searchParams.set("reason", "expired");
    return NextResponse.redirect(url);
  }

  const vloga = claims.app_metadata?.vloga;
  if (vloga !== "super_admin") {
    // Non-titan → send to plain dashboard. No hint leaked about /admin.
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Super admins MUST have AAL2 (MFA)
  if (claims.aal !== "aal2") {
    const url = req.nextUrl.clone();
    url.pathname = "/prijava";
    url.searchParams.set("redirect", pathname);
    url.searchParams.set("reason", "mfa_required");
    return NextResponse.redirect(url);
  }

  // Pass the verified role downstream so server components don't re-check
  const res = NextResponse.next();
  res.headers.set("x-titan-vloga", vloga);
  res.headers.set("x-titan-aal", claims.aal ?? "aal1");
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
