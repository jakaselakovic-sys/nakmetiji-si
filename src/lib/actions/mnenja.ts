// =============================================================================
// NaKmetiji.si — Server Actions: Mnenja (Reviews)
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import type { Mnenje, UstvariMnenjeInput } from "@/types/database";

// ─── Pridobi mnenja za kmetijo ──────────────────────────────────────────────

export async function pridobiMnenja(
  kmetijaId: string,
  stran: number = 1,
  naStran: number = 10
): Promise<{
  mnenja: Mnenje[];
  skupaj: number;
}> {
  const supabase = await createSupabaseServer();

  const od = (stran - 1) * naStran;
  const dokončno = od + naStran - 1;

  const { data, error, count } = await supabase
    .from("mnenja")
    .select("*", { count: "exact" })
    .eq("kmetija_id", kmetijaId)
    .order("datum", { ascending: false })
    .range(od, dokončno);

  if (error) {
    console.error("Napaka pri pridobivanju mnenj:", error);
    return { mnenja: [], skupaj: 0 };
  }

  return {
    mnenja: (data as Mnenje[]) || [],
    skupaj: count ?? 0,
  };
}

// ─── Oddaj novo mnenje ──────────────────────────────────────────────────────

export async function oddajMnenje(
  input: UstvariMnenjeInput
): Promise<{ uspeh: boolean; napaka?: string }> {
  // Validacija
  if (!input.uporabnik_ime || input.uporabnik_ime.trim().length < 2) {
    return { uspeh: false, napaka: "Ime mora imeti vsaj 2 znaka." };
  }

  if (!input.ocena || input.ocena < 1 || input.ocena > 5) {
    return { uspeh: false, napaka: "Ocena mora biti med 1 in 5." };
  }

  if (!input.kmetija_id) {
    return { uspeh: false, napaka: "Manjka ID kmetije." };
  }

  const supabase = await createSupabaseServer();

  const { error } = await supabase.from("mnenja").insert({
    kmetija_id: input.kmetija_id,
    uporabnik_ime: input.uporabnik_ime.trim(),
    uporabnik_email: input.uporabnik_email?.trim() || null,
    ocena: input.ocena,
    komentar: input.komentar?.trim() || null,
    status: "cakanje", // čaka na moderacijo
  });

  if (error) {
    console.error("Napaka pri oddaji mnenja:", error);
    return { uspeh: false, napaka: "Prišlo je do napake. Poskusite znova." };
  }

  return { uspeh: true };
}

// ─── Pridobi povprečno oceno za kmetijo ─────────────────────────────────────

export async function pridobiPovprecnoOceno(
  kmetijaId: string
): Promise<{ ocena: number | null; stevilo: number }> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("kmetije")
    .select("ocena, stevilo_ocen")
    .eq("id", kmetijaId)
    .single();

  if (error || !data) {
    return { ocena: null, stevilo: 0 };
  }

  return {
    ocena: data.ocena as number | null,
    stevilo: data.stevilo_ocen as number,
  };
}

// ─── Pridobi zadnja mnenja (za domačo stran testimoniale) ───────────────────

export async function pridobiZadnjaMnenja(
  limit: number = 5
): Promise<(Mnenje & { kmetija_ime: string; kmetija_slug: string })[]> {
  const supabase = await createSupabaseServer();

  // Pridobi zadnja odobrena mnenja
  const { data: mnenjaData, error } = await supabase
    .from("mnenja")
    .select("*")
    .eq("odobreno", true)
    .order("datum", { ascending: false })
    .limit(limit);

  if (error || !mnenjaData || mnenjaData.length === 0) return [];

  // Pridobi imena kmetij
  const kmetijaIds = [...new Set(mnenjaData.map((m) => m.kmetija_id))];

  const { data: kmetijeData } = await supabase
    .from("kmetije")
    .select("id, ime, slug")
    .in("id", kmetijaIds);

  const kmetijeMap = new Map(
    (kmetijeData || []).map((k) => [k.id, { ime: k.ime, slug: k.slug }])
  );

  return mnenjaData.map((mnenje) => {
    const kmetija = kmetijeMap.get(mnenje.kmetija_id);
    return {
      ...(mnenje as Mnenje),
      kmetija_ime: kmetija?.ime ?? "Neznana kmetija",
      kmetija_slug: kmetija?.slug ?? "",
    };
  });
}
