// =============================================================================
// NaKmetiji.si — Admin API: Moderacija mnenj
// GET /api/admin/mnenja — seznam za moderacijo
// PATCH /api/admin/mnenja — odobri/zavrni
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

  const status = req.nextUrl.searchParams.get("status") ?? "cakanje";

  const { data, error } = await supabase
    .from("mnenja")
    .select(`*, kmetije(ime, slug)`)
    .eq("status", status)
    .order("datum", { ascending: false });

  if (error) return NextResponse.json({ napaka: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  if (!await preveriAdmina(supabase)) {
    return NextResponse.json({ napaka: "Nezadostne pravice." }, { status: 403 });
  }

  const { id, status } = await req.json() as { id: string; status: "odobreno" | "zavrnjeno" };

  if (!["odobreno", "zavrnjeno"].includes(status)) {
    return NextResponse.json({ napaka: "Neveljaven status." }, { status: 400 });
  }

  const { error } = await supabase.from("mnenja").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ napaka: error.message }, { status: 500 });

  // Posodobi povprečno oceno kmetije če je odobreno
  if (status === "odobreno") {
    const { data: mnenje } = await supabase.from("mnenja").select("kmetija_id").eq("id", id).single();
    if (mnenje) await posodobiOceno(supabase, mnenje.kmetija_id);
  }

  return NextResponse.json({ ok: true });
}

async function posodobiOceno(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  kmetija_id: string
) {
  const { data } = await supabase
    .from("mnenja")
    .select("ocena")
    .eq("kmetija_id", kmetija_id)
    .eq("status", "odobreno");

  if (!data?.length) return;
  const avg = data.reduce((s, m) => s + m.ocena, 0) / data.length;

  await supabase
    .from("kmetije")
    .update({ ocena: Math.round(avg * 100) / 100, stevilo_ocen: data.length })
    .eq("id", kmetija_id);
}
