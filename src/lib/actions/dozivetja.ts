// =============================================================================
// NaKmetiji.si — Server Actions: Doživetja (Experiences)
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import * as Sentry from "@sentry/nextjs";
import type { Dozivetje } from "@/types/database";

// ─── Pridobi vsa doživetja ──────────────────────────────────────────────────

export async function pridobiDozivetja(): Promise<Dozivetje[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("dozivetja")
    .select("*")
    .order("vrstni_red", { ascending: true });

  if (error) {
    Sentry.captureException(error, { tags: { action: "pridobiDozivetja" } });
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

  // Single query: fetch all doživetja with their farm count via JOIN
  const { data: dozivetja } = await supabase
    .from("dozivetja")
    .select("*, kmetija_dozivetje(count)")
    .order("vrstni_red", { ascending: true });

  if (!dozivetja) return [];

  return (dozivetja as (Dozivetje & { kmetija_dozivetje: { count: number }[] })[]).map((doz) => ({
    ...doz,
    stevilo_kmetij: doz.kmetija_dozivetje?.[0]?.count ?? 0,
    kmetija_dozivetje: undefined,
  })) as (Dozivetje & { stevilo_kmetij: number })[];
}
