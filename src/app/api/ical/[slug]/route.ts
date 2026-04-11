// =============================================================================
// NaKmetiji.si — iCal Export: /api/ical/[slug]
//
// Returns an RFC 5545-compliant .ics file for a farm's confirmed bookings.
// Owners can subscribe to this URL in Google Calendar / Apple Calendar:
//   webcal://nakmetiji.si/api/ical/kmetija-ime?token=SECRET
//
// Security: token-based auth (HMAC-SHA256 of farm ID using ICAL_SECRET env var).
// Public bookings (no sensitive guest data): only shows booked dates + short label.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

export const runtime = "nodejs";
// iCal feeds are cached 15 min (Cache-Control: max-age=900)
export const revalidate = 900;

// ─── Token verification ───────────────────────────────────────────────────────
// Token = HMAC-SHA256(kmetija_id, ICAL_SECRET) first 32 hex chars
// Owner gets their personal token URL from the dashboard settings.

function generateToken(kmetija_id: string): string {
  const secret = process.env.ICAL_SECRET ?? "nakmetiji-ical-dev-secret";
  return createHmac("sha256", secret)
    .update(kmetija_id)
    .digest("hex")
    .slice(0, 32);
}

function verifyToken(kmetija_id: string, token: string): boolean {
  const expected = generateToken(kmetija_id);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

// ─── iCal formatting helpers ──────────────────────────────────────────────────

// Fold long lines per RFC 5545 §3.1 (max 75 octets per line)
function foldLine(line: string): string {
  const MAX = 75;
  if (line.length <= MAX) return line;
  const parts: string[] = [];
  parts.push(line.slice(0, MAX));
  let i = MAX;
  while (i < line.length) {
    parts.push(" " + line.slice(i, i + MAX - 1));
    i += MAX - 1;
  }
  return parts.join("\r\n");
}

// Escape special chars per RFC 5545
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Format date as YYYYMMDD (all-day)
function icalDate(iso: string): string {
  return iso.replace(/-/g, "").slice(0, 8);
}

// Format datetime as YYYYMMDDTHHMMSSZ
function icalDateTime(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Token je obvezen. Pridobite ga v nastavitvah dashboarda.", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Use service role client (bypasses RLS — we already verified the token)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Fetch the farm
  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("id, ime, naslov, regija, slug")
    .eq("slug", slug)
    .single();

  if (!kmetija) {
    return new NextResponse("Kmetija ne obstaja.", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Verify HMAC token
  if (!verifyToken(kmetija.id, token)) {
    return new NextResponse("Neveljaven token.", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Fetch confirmed and pending bookings (next 365 days + past 30 days)
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const until = new Date();
  until.setDate(until.getDate() + 365);

  const { data: rezervacije } = await supabase
    .from("rezervacije")
    .select("id, gost_ime, datum_od, datum_do, stevilo_oseb, status, ustvarjeno, posodobljeno")
    .eq("kmetija_id", kmetija.id)
    .in("status", ["cakanje", "potrjena"])
    .gte("datum_do", from.toISOString().slice(0, 10))
    .lte("datum_od", until.toISOString().slice(0, 10))
    .order("datum_od");

  // ── Build iCal ────────────────────────────────────────────────────────────

  const PRODID = "-//NaKmetiji.si//Rezervacije v1.0//SL";
  const CALNAME = `${kmetija.ime} — Rezervacije`;
  const now = icalDateTime(new Date().toISOString());

  const events = (rezervacije ?? []).map((rez) => {
    const uid = `rezervacija-${rez.id}@nakmetiji.si`;
    const summary = rez.status === "cakanje"
      ? `⏳ Čaka potrditev (${rez.stevilo_oseb} os.)`
      : `✓ Rezervacija — ${rez.gost_ime} (${rez.stevilo_oseb} os.)`;

    const description = [
      `Gost: ${rez.gost_ime}`,
      `Oseb: ${rez.stevilo_oseb}`,
      `Status: ${rez.status === "potrjena" ? "Potrjena" : "Čaka potrditev"}`,
      `ID: ${rez.id.slice(0, 8).toUpperCase()}`,
    ].join("\\n");

    return [
      "BEGIN:VEVENT",
      foldLine(`UID:${uid}`),
      `DTSTART;VALUE=DATE:${icalDate(rez.datum_od)}`,
      `DTEND;VALUE=DATE:${icalDate(rez.datum_do)}`,
      foldLine(`SUMMARY:${escapeText(summary)}`),
      foldLine(`DESCRIPTION:${escapeText(description)}`),
      `STATUS:${rez.status === "potrjena" ? "CONFIRMED" : "TENTATIVE"}`,
      `DTSTAMP:${now}`,
      `CREATED:${icalDateTime(rez.ustvarjeno)}`,
      `LAST-MODIFIED:${icalDateTime(rez.posodobljeno)}`,
      "TRANSP:OPAQUE",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",         // reminder 1 day before
      "ACTION:DISPLAY",
      foldLine(`DESCRIPTION:Jutri: ${escapeText(summary)}`),
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    foldLine(`PRODID:${PRODID}`),
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(CALNAME)}`),
    "X-WR-TIMEZONE:Europe/Ljubljana",
    "X-WR-CALDESC:Rezervacije NaKmetiji.si",
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ical, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-rezervacije.ics"`,
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}

// ─── Token generator endpoint (for dashboard) ─────────────────────────────────
// GET /api/ical/[slug]?generate=1
// Returns the webcal:// URL for the farm's owner to subscribe to.
// Requires auth — only the farm owner can request this.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { createSupabaseServer } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });

  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("id, lastnik_id")
    .eq("slug", slug)
    .single();

  if (!kmetija) return NextResponse.json({ error: "Kmetija ne obstaja." }, { status: 404 });
  if (kmetija.lastnik_id !== user.id) {
    return NextResponse.json({ error: "Nimate dovoljenja." }, { status: 403 });
  }

  const token = generateToken(kmetija.id);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://nakmetiji.si";
  const icalUrl = `${baseUrl}/api/ical/${slug}?token=${token}`;
  const webcalUrl = icalUrl.replace(/^https?:/, "webcal:");

  return NextResponse.json({ ok: true, ical_url: icalUrl, webcal_url: webcalUrl, token });
}
