"use server";

// =============================================================================
// NaKmetiji.si — Per-farm rewards (kmetija_nagrade)
// Owner CRUD + public read for the farm-rewards system. Owner defines tiers
// like "5 žigov = 10% popust", "10 žigov = brezplačna degustacija".
// =============================================================================

import { createSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FarmReward {
  id: string;
  kmetija_id: string;
  ime: string;
  opis: string | null;
  min_zigi: number;
  aktivna: boolean;
  ustvarjeno: string;
}

interface ActionResult {
  ok: boolean;
  napaka?: string;
}

async function assertOwnsKmetija(kmetijaId: string): Promise<{ ok: true } | { ok: false; napaka: string }> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };
  const { data } = await sb.from("kmetije").select("lastnik_id").eq("id", kmetijaId).maybeSingle();
  if (!data || data.lastnik_id !== user.id) {
    return { ok: false, napaka: "Niste lastnik te kmetije." };
  }
  return { ok: true };
}

export async function listFarmRewards(kmetijaId: string): Promise<{ ok: boolean; rewards?: FarmReward[]; napaka?: string }> {
  const sb = await createSupabaseServer();
  const { data, error } = await sb
    .from("kmetija_nagrade")
    .select("*")
    .eq("kmetija_id", kmetijaId)
    .order("min_zigi", { ascending: true });
  if (error) {
    if (error.code === "42P01") return { ok: false, napaka: "Tabela še ni pripravljena. Zaženite migracijo." };
    return { ok: false, napaka: error.message };
  }
  return { ok: true, rewards: (data ?? []) as FarmReward[] };
}

export async function addFarmReward(input: {
  kmetija_id: string;
  ime: string;
  opis: string;
  min_zigi: number;
}): Promise<ActionResult> {
  const owns = await assertOwnsKmetija(input.kmetija_id);
  if (!owns.ok) return owns;

  const ime = input.ime.trim().slice(0, 120);
  if (!ime) return { ok: false, napaka: "Vnesite ime nagrade." };

  const min_zigi = Math.min(50, Math.max(1, Math.floor(input.min_zigi)));
  const opis = input.opis.trim().slice(0, 400) || null;

  const sb = await createSupabaseServer();
  const { error } = await sb.from("kmetija_nagrade").insert({
    kmetija_id: input.kmetija_id,
    ime,
    opis,
    min_zigi,
    aktivna: true,
  });
  if (error) return { ok: false, napaka: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleFarmReward(id: string, aktivna: boolean): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  const { error } = await sb.from("kmetija_nagrade").update({ aktivna }).eq("id", id);
  if (error) return { ok: false, napaka: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteFarmReward(id: string): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  const { error } = await sb.from("kmetija_nagrade").delete().eq("id", id);
  if (error) return { ok: false, napaka: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Public read: how many stamps does the current logged-in user have at this farm? */
export async function countMyStampsAtFarm(kmetijaId: string): Promise<{ count: number; loggedIn: boolean }> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { count: 0, loggedIn: false };

  const { count } = await sb
    .from("green_stamps")
    .select("id", { count: "exact", head: true })
    .eq("gost_id", user.id)
    .eq("kmetija_id", kmetijaId);

  return { count: count ?? 0, loggedIn: true };
}
