// =============================================================================
// NaKmetiji.si — Server Actions: Nagrade (Rewards)
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { getLevel, calculateTotalPoints } from "@/lib/greenPassport";

export type ZahtevekResult =
  | { ok: true; levelName: string }
  | { ok: false; napaka: string };

/**
 * Uveljavitev nagrade za zeleni potni list.
 *
 * Preveri pristnost, izračuna nivo in vstavi zahtevek v tabelo `nagrade`.
 * Vrne napako če gost nima kmetij (nima žigov) ali je zahtevek za ta nivo
 * že bil oddan.
 */
export async function zahtevajNagrado(): Promise<ZahtevekResult> {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  // Fetch stamps (ascending for correct point calculation)
  const { data: stampsRaw, error: stampsErr } = await supabase
    .from("green_stamps")
    .select("id, kmetije(regija)")
    .eq("gost_id", user.id)
    .order("ustvarjeno", { ascending: true });

  if (stampsErr) return { ok: false, napaka: "Napaka pri branju žigov." };

  type StampRow = { id: string; kmetije: { regija: string } | null };
  const stamps = (stampsRaw ?? []) as unknown as StampRow[];
  const stampData = stamps.map((s) => ({ regija: s.kmetije?.regija ?? "" }));

  const uniqueRegions = new Set(stampData.map((s) => s.regija).filter(Boolean)).size;
  const currentLevel = getLevel(stamps.length, uniqueRegions);
  calculateTotalPoints(stampData); // side-effect free, kept for future use

  if (stamps.length === 0) {
    return { ok: false, napaka: "Nimate še nobenega žiga." };
  }

  // Check for existing active claim at this level
  const { data: existing } = await supabase
    .from("nagrade")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("level_name", currentLevel.name)
    .in("status", ["caka", "odobreno"])
    .maybeSingle();

  if (existing) {
    if (existing.status === "odobreno") {
      return { ok: false, napaka: "Nagrada za ta nivo je že bila odobrena." };
    }
    return { ok: false, napaka: "Zahtevek za ta nivo je že v obravnavi." };
  }

  const { error: insertErr } = await supabase
    .from("nagrade")
    .insert({ user_id: user.id, level_name: currentLevel.name });

  if (insertErr) {
    // Unique index violation — race condition; another request beat us to it
    if (insertErr.code === "23505") {
      return { ok: false, napaka: "Zahtevek za ta nivo je že v obravnavi." };
    }
    return { ok: false, napaka: "Napaka pri oddaji zahtevka." };
  }

  return { ok: true, levelName: currentLevel.name };
}
