// =============================================================================
// NaKmetiji.si — Green Passport: Stamp Claim Endpoint
// GET /api/green-stamp?farm=SLUG
//
// Flow (QR code scan):
//   1. User scans QR code at the farm → lands here
//   2. If not logged in → redirect to /prijava (with return URL)
//   3. Look up farm by slug
//   4. Upsert green_stamp (unique per gost+kmetija — can only stamp once)
//   5. Redirect to /moj-potni-list?stamped=SLUG
//
// Flow (direct button from farm page):
//   POST /api/green-stamp  { farm: slug }  → JSON { ok, duplicate, error }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// ── GET: QR code scan redirect flow ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const farm = req.nextUrl.searchParams.get("farm");

  if (!farm) {
    return NextResponse.redirect(new URL("/green-passport", req.url));
  }

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const returnUrl = `/api/green-stamp?farm=${encodeURIComponent(farm)}`;
    return NextResponse.redirect(
      new URL(`/prijava?redirect=${encodeURIComponent(returnUrl)}`, req.url)
    );
  }

  // Look up farm
  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("id, slug, ime")
    .eq("slug", farm)
    .eq("aktivna", true)
    .single();

  if (!kmetija) {
    return NextResponse.redirect(new URL("/green-passport?error=farm_not_found", req.url));
  }

  // Upsert stamp — duplicate is silently accepted
  const { error } = await supabase
    .from("green_stamps")
    .upsert(
      { gost_id: user.id, kmetija_id: kmetija.id },
      { onConflict: "gost_id,kmetija_id", ignoreDuplicates: true }
    );

  if (error) {
    console.error("[green-stamp GET]", error);
    return NextResponse.redirect(new URL("/green-passport?error=stamp_failed", req.url));
  }

  return NextResponse.redirect(
    new URL(`/green-passport/potrditev?farm=${encodeURIComponent(kmetija.slug)}`, req.url)
  );
}

// ── POST: Direct claim from farm detail page ──────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json() as { farm?: string };
  const farm = body.farm?.trim();

  if (!farm) {
    return NextResponse.json({ ok: false, error: "Manjka slug kmetije." }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Prijava je potrebna." }, { status: 401 });
  }

  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("id, ime")
    .eq("slug", farm)
    .eq("aktivna", true)
    .single();

  if (!kmetija) {
    return NextResponse.json({ ok: false, error: "Kmetija ni najdena." }, { status: 404 });
  }

  // Atomic upsert — database-level uniqueness enforcement on (gost_id, kmetija_id).
  // This eliminates the TOCTOU race that existed when doing SELECT then INSERT
  // as two separate round-trips. ignoreDuplicates=true means a second concurrent
  // request becomes a no-op rather than a constraint violation error.
  const { error, count } = await supabase
    .from("green_stamps")
    .upsert(
      { gost_id: user.id, kmetija_id: kmetija.id },
      { onConflict: "gost_id,kmetija_id", ignoreDuplicates: true, count: "exact" }
    );

  if (error) {
    console.error("[green-stamp POST]", error);
    return NextResponse.json({ ok: false, error: "Napaka pri dodajanju žiga." }, { status: 500 });
  }

  // count=0 means the row already existed (upsert was a no-op)
  const duplicate = count === 0;
  return NextResponse.json({ ok: true, duplicate, ime: kmetija.ime });
}
