import { createSupabaseServer } from "@/lib/supabase/server";
import type { KmetijaPaket, Regija } from "@/types/database";

export interface OwnerFarmDTO {
  id: string;
  slug: string;
  ime: string;
  regija: Regija;
  obcina: string | null;
  naslovna_slika: string;
  cena_noc: number | null;
  max_gostov: number | null;
  paket: KmetijaPaket | null;
  tier_rang: number;
  premium: boolean;
  aktivna: boolean;
}

export interface BookingDTO {
  id: string;
  kmetija_id: string;
  gost_ime: string;
  gost_email: string;
  datum_od: string;
  datum_do: string;
  stevilo_oseb: number;
  status: string;
  skupaj_cena: number | null;
  ustvarjeno: string;
}

export async function getOwnerFarmDTO(userId: string): Promise<OwnerFarmDTO | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("kmetije")
    .select("id, slug, ime, regija, obcina, naslovna_slika, cena_noc, max_gostov, paket, tier_rang, premium, aktivna")
    .eq("lastnik_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as OwnerFarmDTO;
}

export async function getBookingDTO(userId: string, bookingId: string): Promise<BookingDTO | null> {
  void userId; // RLS enforces participant access for the current Supabase session.
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("rezervacije")
    .select("id, kmetija_id, gost_ime, gost_email, datum_od, datum_do, stevilo_oseb, status, skupaj_cena, ustvarjeno")
    .eq("id", bookingId)
    .single();

  if (error || !data) return null;
  return data as BookingDTO;
}
