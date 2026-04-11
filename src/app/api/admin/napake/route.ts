// =============================================================================
// NaKmetiji.si — Admin API: Error Log
// GET  /api/admin/napake          — list recent errors (latest 100)
// PATCH /api/admin/napake         — mark one or many as resolved
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

async function preveriAdmina(supabase: Awaited<ReturnType<typeof createSupabaseServer>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profili").select("vloga").eq("id", user.id).single();
  return data?.vloga === "super_admin";
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  if (!await preveriAdmina(supabase)) {
    return NextResponse.json({ napaka: "Nezadostne pravice." }, { status: 403 });
  }

  const url = req.nextUrl;
  const samo_nereseno = url.searchParams.get("nereseno") === "1";
  const tip = url.searchParams.get("tip");

  let query = supabase
    .from("napake_log")
    .select("*")
    .order("ustvarjeno", { ascending: false })
    .limit(100);

  if (samo_nereseno) query = query.eq("reseno", false);
  if (tip) query = query.eq("tip", tip);

  const { data, error } = await query;
  if (error) return NextResponse.json({ napaka: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, napake: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  if (!await preveriAdmina(supabase)) {
    return NextResponse.json({ napaka: "Nezadostne pravice." }, { status: 403 });
  }

  const body = await req.json() as { ids: string[] };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ napaka: "Pošlji polje 'ids'." }, { status: 400 });
  }

  const { error } = await supabase
    .from("napake_log")
    .update({ reseno: true })
    .in("id", body.ids);

  if (error) return NextResponse.json({ napaka: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
