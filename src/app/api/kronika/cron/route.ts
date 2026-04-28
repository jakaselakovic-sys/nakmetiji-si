// =============================================================================
// NaKmetiji.si — Kronika scheduled sender
// GET /api/kronika/cron
// Triggered by Vercel Cron (see vercel.json). Runs once weekly.
// Authentication: two accepted mechanisms, either is sufficient:
//   1. Vercel Cron adds a Bearer token with env.CRON_SECRET
//   2. A direct header "x-cron-secret" match (for manual curl during testing)
//
// Emits the same KronikaSendResult as the admin action, but bypasses the
// titanAction wrapper (no user session on a cron tick).
// =============================================================================

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateAndSendKronika } from "@/lib/kronika/send";
import * as Sentry from "@sentry/nextjs";

export const maxDuration = 60;
// Cron hits only the canonical URL — no ISR, no caching.

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // Vercel Cron sends: `Authorization: Bearer <CRON_SECRET>`
  const bearer = req.headers.get("authorization");
  if (bearer === `Bearer ${secret}`) return true;

  // Also accept x-cron-secret for manual triggering during dev/ops
  if (req.headers.get("x-cron-secret") === secret) return true;

  return false;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sb = getServiceClient();
  if (!sb) {
    Sentry.captureMessage("Kronika cron: service role not configured", "error");
    return new Response(
      JSON.stringify({ error: "Service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const result = await generateAndSendKronika(sb, {
      dryRun: false,
      createdBy: null,
    });
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "kronika.cron" } });
    return new Response(
      JSON.stringify({ error: "Cron run failed." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
