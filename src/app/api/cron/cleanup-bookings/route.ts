// =============================================================================
// NaKmetiji.si — Cron Job: Auto-cancel stale pending bookings
// GET /api/cron/cleanup-bookings
//
// Vercel Cron schedule (vercel.json): "0 */6 * * *" (every 6 hours)
//
// What it does:
//   1. Calls cron_preklic_zastarelih() PL/pgSQL function (atomic, indexed)
//   2. For each cancelled booking, sends "AutoCancelled" email to the guest
//   3. Returns a structured JSON log for Vercel's cron observability
//
// Security: validates Authorization: Bearer {CRON_SECRET} header
//   (Vercel injects this automatically when configured in project settings)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { posljiAvtoPreklic } from "@/lib/email";
import * as Sentry from "@sentry/nextjs";

export const maxDuration = 30;

interface CancelledBooking {
  id: string;
  gost_ime: string;
  gost_email: string;
  datum_od: string;
  datum_do: string;
  ustvarjeno: string;
  kmetije: { ime: string }[] | null;
}

export async function GET(req: NextRequest) {
  // ── Auth: Vercel Cron secret ───────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Guard: if secret is NOT configured, deny all requests — never allow open access
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized — invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  // ── Service role client (bypasses RLS for system operation) ───────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY configuration." },
      { status: 503 }
    );
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const startedAt = new Date().toISOString();
  const log: string[] = [`[${startedAt}] Cron: cleanup-bookings started`];

  try {
    // ── Step 1: Call atomic DB cleanup function ──────────────────────────────
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "cron_preklic_zastarelih"
    );

    if (rpcError) {
      log.push(`ERROR: cron_preklic_zastarelih RPC failed: ${rpcError.message}`);
      return NextResponse.json({ ok: false, log, error: rpcError.message }, { status: 500 });
    }

    const result = rpcResult as { ok: boolean; preklicane: number; ids?: string[] };
    log.push(`DB: cancelled ${result.preklicane} stale booking(s)`);

    if (result.preklicane === 0 || !result.ids?.length) {
      return NextResponse.json({ ok: true, preklicane: 0, log });
    }

    // ── Step 2: Fetch cancelled booking details for emails ───────────────────
    const { data: cancelledBookings } = await supabase
      .from("rezervacije")
      .select(`
        id, gost_ime, gost_email, datum_od, datum_do, ustvarjeno,
        kmetije(ime)
      `)
      .in("id", result.ids)
      .eq("status", "preklicana");

    if (!cancelledBookings?.length) {
      log.push("WARN: Could not fetch cancelled booking details for emails");
      return NextResponse.json({ ok: true, preklicane: result.preklicane, log });
    }

    // ── Step 3: Send cancellation emails concurrently ─────────────────────────
    const emailResults = await Promise.allSettled(
      (cancelledBookings as CancelledBooking[]).map(async (rez) => {
        const kmetija_ime = Array.isArray(rez.kmetije)
          ? (rez.kmetije[0]?.ime ?? "Kmetija")
          : "Kmetija";
        const urePretek = Math.round(
          (Date.now() - new Date(rez.ustvarjeno).getTime()) / 3_600_000
        );

        await posljiAvtoPreklic({
          gost_email:    rez.gost_email,
          gost_ime:      rez.gost_ime,
          kmetija_ime,
          datum_od:      rez.datum_od,
          datum_do:      rez.datum_do,
          rezervacija_id: rez.id,
          ure_pretekle:  urePretek,
        });

        return rez.id;
      })
    );

    const sent      = emailResults.filter((r) => r.status === "fulfilled").length;
    const failed    = emailResults.filter((r) => r.status === "rejected").length;

    emailResults.forEach((r, i) => {
      if (r.status === "rejected") {
        log.push(`EMAIL ERROR for booking ${cancelledBookings[i]?.id?.slice(0, 8)}: ${String(r.reason)}`);
      }
    });

    log.push(`Emails: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      ok: true,
      preklicane: result.preklicane,
      emails_sent: sent,
      emails_failed: failed,
      log,
      completed_at: new Date().toISOString(),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.push(`FATAL: ${msg}`);
    Sentry.captureException(err, { tags: { route: "cron/cleanup-bookings" } });
    return NextResponse.json({ ok: false, log, error: msg }, { status: 500 });
  }
}
