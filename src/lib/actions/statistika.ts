// =============================================================================
// NaKmetiji.si — Server Actions: Statistika
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";

export interface PlatformaStatistika {
  skupajKmetij: number;
  skupajRegij: number;
  skupajMnenj: number;
  povprecnaOcena: number | null;
}

// ─── Pridobi globalno statistiko platforme ──────────────────────────────────

export async function pridobiStatistiko(): Promise<PlatformaStatistika> {
  const supabase = await createSupabaseServer();

  // Število aktivnih kmetij
  const { count: kmetijCount } = await supabase
    .from("kmetije")
    .select("*", { count: "exact", head: true });

  // Število različnih regij z aktivnimi kmetijami
  const { data: regijeData } = await supabase
    .from("kmetije")
    .select("regija")
    .not("regija", "is", null);

  const unikatneRegije = new Set(
    (regijeData || []).map((r) => r.regija)
  );

  // Število odobrenih mnenj
  const { count: mnenjaCount } = await supabase
    .from("mnenja")
    .select("*", { count: "exact", head: true })
    .eq("odobreno", true);

  // Povprečna ocena
  const { data: ocenaData } = await supabase
    .from("kmetije")
    .select("ocena")
    .not("ocena", "is", null);

  let povprecnaOcena: number | null = null;
  if (ocenaData && ocenaData.length > 0) {
    const vsota = ocenaData.reduce(
      (acc, k) => acc + (k.ocena as number),
      0
    );
    povprecnaOcena =
      Math.round((vsota / ocenaData.length) * 10) / 10;
  }

  return {
    skupajKmetij: kmetijCount ?? 0,
    skupajRegij: unikatneRegije.size,
    skupajMnenj: mnenjaCount ?? 0,
    povprecnaOcena,
  };
}
