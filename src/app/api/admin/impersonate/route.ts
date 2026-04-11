// =============================================================================
// NaKmetiji.si — Admin API: User Simulation (Impersonation)
// GET /api/admin/impersonate?user_id=<uuid>
//
// Returns the full vendor dashboard payload for any user — exactly what they
// see in their own dashboard. Admin-only. Read-only. No session swap.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();

  // Auth + role check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ napaka: "Niste prijavljeni." }, { status: 401 });

  const { data: adminProfil } = await supabase
    .from("profili")
    .select("vloga")
    .eq("id", user.id)
    .single();

  if (adminProfil?.vloga !== "super_admin") {
    return NextResponse.json({ napaka: "Nezadostne pravice." }, { status: 403 });
  }

  const targetId = req.nextUrl.searchParams.get("user_id");
  if (!targetId) {
    return NextResponse.json({ napaka: "Manjka user_id parameter." }, { status: 400 });
  }

  // Fetch target user profile
  const { data: profil } = await supabase
    .from("profili")
    .select("id, ime, email, vloga")
    .eq("id", targetId)
    .single();

  if (!profil) {
    return NextResponse.json({ napaka: "Uporabnik ne obstaja." }, { status: 404 });
  }

  // Fetch their farm
  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("*")
    .eq("lastnik_id", targetId)
    .single();

  // Fetch their bookings
  const { data: rezervacije } = kmetija
    ? await supabase
        .from("rezervacije")
        .select("*")
        .eq("kmetija_id", kmetija.id)
        .order("ustvarjeno", { ascending: false })
        .limit(50)
    : { data: [] };

  // Fetch experiences attached to their farm
  const { data: dozivetja } = kmetija
    ? await supabase
        .from("kmetija_dozivetje")
        .select("dozivetje_id")
        .eq("kmetija_id", kmetija.id)
    : { data: [] };

  return NextResponse.json({
    ok: true,
    profil,
    kmetija: kmetija ?? null,
    rezervacije: rezervacije ?? [],
    izbranaDozivetjaIds: (dozivetja ?? []).map((d: { dozivetje_id: string }) => d.dozivetje_id),
  });
}
