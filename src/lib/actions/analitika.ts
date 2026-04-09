// =============================================================================
// NaKmetiji.si — Server Actions: Analitika (prava data iz baze)
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";

export interface AnalitikaData {
  skupaj_rezervacij: number;
  potrjene: number;
  prihodki_skupaj: number;
  prihodki_ta_mesec: number;
  mesecni_prihodki: { mesec: string; prihodki: number; rezervacij: number }[];
  povprecna_ocena: number | null;
  stevilo_ocen: number;
}

export async function pridobiAnalitikoKmetije(
  kmetija_id: string
): Promise<AnalitikaData> {
  const supabase = await createSupabaseServer();

  // En klic — PostgreSQL funkcija naredi vse agregacije
  const { data, error } = await supabase
    .rpc("analitika_kmetije", { p_kmetija_id: kmetija_id });

  if (error || !data) {
    return {
      skupaj_rezervacij: 0, potrjene: 0,
      prihodki_skupaj: 0, prihodki_ta_mesec: 0,
      mesecni_prihodki: [], povprecna_ocena: null, stevilo_ocen: 0,
    };
  }

  // Pridobi povprečno oceno
  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("ocena, stevilo_ocen")
    .eq("id", kmetija_id)
    .single();

  return {
    skupaj_rezervacij: data.skupaj_rezervacij ?? 0,
    potrjene: data.potrjene ?? 0,
    prihodki_skupaj: data.prihodki_skupaj ?? 0,
    prihodki_ta_mesec: data.prihodki_ta_mesec ?? 0,
    mesecni_prihodki: data.mesecni_prihodki ?? [],
    povprecna_ocena: kmetija?.ocena ?? null,
    stevilo_ocen: kmetija?.stevilo_ocen ?? 0,
  };
}
