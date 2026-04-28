"use server";

// =============================================================================
// NaKmetiji.si — Saved road-trip itineraries
// Server actions: save / list / delete a generated road-trip in the user's
// account. Falls back gracefully if the migration hasn't been applied yet.
// =============================================================================

import { createSupabaseServer } from "@/lib/supabase/server";
import * as Sentry from "@sentry/nextjs";

interface SaveResult {
  ok: boolean;
  id?: string;
  napaka?: string;
  needsLogin?: boolean;
}

export async function shraniPot(input: {
  ime: string;
  itinerary: unknown;
}): Promise<SaveResult> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, needsLogin: true, napaka: "Prijavite se za shranjevanje poti." };

  const ime = (input.ime ?? "").trim().slice(0, 120) || "Moja pot";

  const { data, error } = await sb
    .from("shranjene_poti")
    .insert({ gost_id: user.id, ime, itinerary: input.itinerary as object })
    .select("id")
    .single();

  if (error) {
    Sentry.captureException(error, { tags: { action: "shraniPot" } });
    // Most likely cause: migration not applied yet
    if (error.code === "42P01") {
      return { ok: false, napaka: "Tabela še ni pripravljena. Administrator naj zažene migracijo." };
    }
    return { ok: false, napaka: error.message };
  }

  return { ok: true, id: data.id as string };
}

export async function listSavedPaths(): Promise<{
  ok: boolean;
  paths?: { id: string; ime: string; ustvarjeno: string }[];
  napaka?: string;
}> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  const { data, error } = await sb
    .from("shranjene_poti")
    .select("id, ime, ustvarjeno")
    .eq("gost_id", user.id)
    .order("ustvarjeno", { ascending: false });

  if (error) return { ok: false, napaka: error.message };
  return { ok: true, paths: data ?? [] };
}

export async function deleteSavedPath(id: string): Promise<{ ok: boolean; napaka?: string }> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  const { error } = await sb
    .from("shranjene_poti")
    .delete()
    .eq("id", id)
    .eq("gost_id", user.id);

  if (error) return { ok: false, napaka: error.message };
  return { ok: true };
}
