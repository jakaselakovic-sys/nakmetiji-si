// =============================================================================
// NaKmetiji.si — Server Actions: Izdelki (CRUD)
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import type { Izdelek, UstvariIzdelekInput, PosodobiIzdelekInput } from "@/types/database";

async function preveriLastnistvo(supabase: Awaited<ReturnType<typeof createSupabaseServer>>, kmetija_id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profil } = await supabase.from("profili").select("vloga").eq("id", user.id).single();
  if (profil?.vloga === "super_admin") return true;
  const { data } = await supabase.from("kmetije").select("id").eq("id", kmetija_id).eq("lastnik_id", user.id).single();
  return !!data;
}

// ─── Pridobi vse izdelke kmetije ─────────────────────────────────────────────

export async function pridobiIzdelke(kmetija_id: string): Promise<Izdelek[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("izdelki")
    .select("*")
    .eq("kmetija_id", kmetija_id)
    .order("ustvarjeno", { ascending: false });
  return (data as Izdelek[]) || [];
}

// ─── Ustvari nov izdelek ──────────────────────────────────────────────────────

export async function ustvariIzdelek(
  input: UstvariIzdelekInput
): Promise<{ ok: boolean; napaka?: string; id?: string }> {
  const supabase = await createSupabaseServer();

  if (!await preveriLastnistvo(supabase, input.kmetija_id)) {
    return { ok: false, napaka: "Nimate dovoljenja." };
  }

  const { data, error } = await supabase
    .from("izdelki")
    .insert(input)
    .select("id")
    .single();

  if (error) return { ok: false, napaka: error.message };
  return { ok: true, id: data.id };
}

// ─── Posodobi izdelek ─────────────────────────────────────────────────────────

export async function posodobiIzdelek(
  id: string,
  kmetija_id: string,
  input: PosodobiIzdelekInput
): Promise<{ ok: boolean; napaka?: string }> {
  const supabase = await createSupabaseServer();

  if (!await preveriLastnistvo(supabase, kmetija_id)) {
    return { ok: false, napaka: "Nimate dovoljenja." };
  }

  const { error } = await supabase
    .from("izdelki")
    .update({ ...input, posodobljeno: new Date().toISOString() })
    .eq("id", id)
    .eq("kmetija_id", kmetija_id);

  if (error) return { ok: false, napaka: error.message };
  return { ok: true };
}

// ─── Izbriši izdelek ──────────────────────────────────────────────────────────

export async function izbrisiIzdelek(
  id: string,
  kmetija_id: string
): Promise<{ ok: boolean; napaka?: string }> {
  const supabase = await createSupabaseServer();

  if (!await preveriLastnistvo(supabase, kmetija_id)) {
    return { ok: false, napaka: "Nimate dovoljenja." };
  }

  const { error } = await supabase
    .from("izdelki")
    .delete()
    .eq("id", id)
    .eq("kmetija_id", kmetija_id);

  if (error) return { ok: false, napaka: error.message };
  return { ok: true };
}
