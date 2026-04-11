// =============================================================================
// NaKmetiji.si — Demo / Commercial Feature Flags
//
// ARCHITECTURE DECISION:
//   This file is the single switch between "Hobby Demo" and "Live Commercial".
//   When you open your s.p. and want to go live:
//     1. Set DEMO_MODE=false in .env.local (or Vercel env vars)
//     2. Set MOCK_BOOKING=false → real Supabase booking flow activates
//     3. Set PAYMENTS_ENABLED=true → Stripe integration activates
//     4. Set AI_DEMO_MODE=false → real Groq API calls activate
//   That's it. No code changes needed anywhere else.
//
// PATTERN: Feature flags are read ONLY here. Components import from this file.
//   ✅  import { DEMO_MODE } from "@/lib/config/demo"
//   ❌  process.env.NEXT_PUBLIC_DEMO_MODE !== "false"  (scattered everywhere)
// =============================================================================

/** Master switch: shows disclaimer banner, demo badges, and mock flows */
export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

/** Booking: when true, reservation is simulated locally — nothing written to DB */
export const MOCK_BOOKING =
  process.env.NEXT_PUBLIC_MOCK_BOOKING !== "false";

/**
 * Payments: when false, Stripe/payment module is fully excluded from bundle.
 * Set to true only after registering as s.p. and setting up Stripe.
 */
export const PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

/**
 * AI: when true, Oracle falls back to canned responses if GROQ_API_KEY is absent.
 * Always graceful — never crashes; just less impressive.
 */
export const AI_DEMO_MODE =
  !process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_AI_DEMO_MODE === "true";

/**
 * Commission rate — 12 % in production.
 * Can be changed here without touching revenue calculations.
 */
export const PLATFORM_COMMISSION = 0.12;

/**
 * Site metadata
 */
export const SITE = {
  name: "NaKmetiji.si",
  url:  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nakmetiji.si",
  email: "info@nakmetiji.si",
} as const;

// ---------------------------------------------------------------------------
// Type-safe helper — use in components to gate commercial features
// ---------------------------------------------------------------------------

/**
 * Returns a value based on current mode.
 * @example
 * const label = demoOr("Rezerviraj (DEMO)", "Rezerviraj in plačaj")
 */
export function demoOr<T>(demoValue: T, liveValue: T): T {
  return DEMO_MODE ? demoValue : liveValue;
}
