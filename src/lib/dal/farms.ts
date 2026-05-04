import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Dozivetje, KmetijaSDozivetji } from "@/types/database";
import { normalizirajKmetijo } from "@/lib/utils/normaliziraj-kmetijo";

const PUBLIC_FARM_SELECT = `
  id, slug, ime, kratki_opis, opis,
  regija, naslov, obcina, postna_stevilka, lat, lng,
  naslovna_slika, slike,
  cena_noc, max_gostov,
  ocena, stevilo_ocen, premium, aktivna, ustvarjeno, posodobljeno,
  kmetija_dozivetje(dozivetja(id, ime, slug, ikona, opis, vrstni_red, ustvarjeno, posodobljeno))
`;

function publicFarmDTO(raw: Record<string, unknown>): KmetijaSDozivetji {
  return {
    ...normalizirajKmetijo({
      ...raw,
      kontaktni_podatki: {},
      iban: null,
      bic: null,
      lastnik_id: null,
    }),
  };
}

function anonSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function getPublicFarmListingDTOs(): Promise<{
  kmetije: KmetijaSDozivetji[];
  dozivetja: Dozivetje[];
}> {
  const supabase = anonSupabase();
  const [{ data: kmetijeRaw }, { data: dozivetjaRaw }] = await Promise.all([
    supabase
      .from("kmetije")
      .select(PUBLIC_FARM_SELECT)
      .eq("aktivna", true)
      .order("premium", { ascending: false })
      .order("ocena", { ascending: false, nullsFirst: false }),
    supabase.from("dozivetja").select("*").order("vrstni_red"),
  ]);

  return {
    kmetije: ((kmetijeRaw ?? []) as Record<string, unknown>[]).map(publicFarmDTO),
    dozivetja: (dozivetjaRaw ?? []) as Dozivetje[],
  };
}

export async function getFeaturedFarmDTOs(limit = 9): Promise<KmetijaSDozivetji[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("kmetije")
    .select(PUBLIC_FARM_SELECT)
    .eq("aktivna", true)
    .order("premium", { ascending: false })
    .order("ocena", { ascending: false, nullsFirst: false })
    .limit(limit);

  return ((data ?? []) as Record<string, unknown>[]).map(publicFarmDTO);
}

export async function getPublicFarmDTO(slug: string): Promise<KmetijaSDozivetji | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("kmetije")
    .select(PUBLIC_FARM_SELECT)
    .eq("slug", slug)
    .eq("aktivna", true)
    .single();

  if (error || !data) return null;
  return publicFarmDTO(data as Record<string, unknown>);
}
