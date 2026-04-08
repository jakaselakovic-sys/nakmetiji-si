// =============================================================================
// NaKmetiji.si — Server Actions: Doživetja (Experiences)
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import type { Dozivetje } from "@/types/database";

// ─── Pridobi vsa doživetja ──────────────────────────────────────────────────

export async function pridobiDozivetja(): Promise<Dozivetje[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("dozivetja")
    .select("*")
    .order("vrstni_red", { ascending: true });

  if (error) {
    console.error("Napaka pri pridobivanju doživetij:", error);
    return [];
  }

  return (data as Dozivetje[]) || [];
}

// ─── Pridobi eno doživetje po slug-u ────────────────────────────────────────

export async function pridobiDozivetje(
  slug: string
): Promise<Dozivetje | null> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("dozivetja")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  return data as Dozivetje;
}

// ─── Pridobi statistiko doživetij (koliko kmetij per doživetje) ─────────────

export async function pridobiStatistikoDozivetij(): Promise<
  (Dozivetje & { stevilo_kmetij: number })[]
> {
  const supabase = await createSupabaseServer();

  // Pridobi vsa doživetja
  const { data: dozivetja } = await supabase
    .from("dozivetja")
    .select("*")
    .order("vrstni_red", { ascending: true });

  if (!dozivetja) return [];

  // Za vsako doživetje preštej kmetije
  const rezultat = await Promise.all(
    (dozivetja as Dozivetje[]).map(async (doz) => {
      const { count } = await supabase
        .from("kmetija_dozivetje")
        .select("*", { count: "exact", head: true })
        .eq("dozivetje_id", doz.id);

      return {
        ...doz,
        stevilo_kmetij: count ?? 0,
      };
    })
  );

  return rezultat;
}
