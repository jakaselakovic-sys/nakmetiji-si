// =============================================================================
// NaKmetiji.si — Server Actions: Kmetije (Farms)
// N+1 FIXED: vse relacije se fetchajo z enim JOIN klicem
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import type {
  Kmetija,
  KmetijaSDozivetji,
  KmetijaPolna,
  KmetijeFilter,
  PaginiraniRezultat,
  Regija,
} from "@/types/database";

// ─── Helper: normalizira Supabase JOIN rezultat v KmetijaSDozivetji ──────────

function normalizirajKmetijo(raw: Record<string, unknown>): KmetijaSDozivetji {
  const { kmetija_dozivetje, ...kmetija } = raw;
  return {
    ...(kmetija as unknown as Kmetija),
    dozivetja: Array.isArray(kmetija_dozivetje)
      ? (kmetija_dozivetje as Record<string, unknown>[])
          .filter((kd) => kd.dozivetja)
          .map((kd) => kd.dozivetja as import("@/types/database").Dozivetje)
          .sort((a, b) => ((a.vrstni_red ?? 0) - (b.vrstni_red ?? 0)))
      : [],
  };
}

// ─── Pridobi vse kmetije s filtri — en sam query (brez N+1) ─────────────────

export async function pridobiKmetije(
  filter: KmetijeFilter = {}
): Promise<PaginiraniRezultat<KmetijaSDozivetji>> {
  const supabase = await createSupabaseServer();

  const {
    regija,
    dozivetje,
    iskanje,
    premium,
    ocenaMin,
    sortiranje = "ocena",
    smer = "desc",
    stran = 1,
    naStran = 12,
  } = filter;

  let query = supabase.from("kmetije").select(
    `*, kmetija_dozivetje(dozivetja(*))`,
    { count: "exact" }
  );

  if (regija) {
    query = Array.isArray(regija)
      ? query.in("regija", regija)
      : query.eq("regija", regija);
  }
  if (premium !== undefined) query = query.eq("premium", premium);
  if (ocenaMin) query = query.gte("ocena", ocenaMin);
  if (iskanje?.trim()) {
    query = query.or(
      `ime.ilike.%${iskanje}%,opis.ilike.%${iskanje}%,kratki_opis.ilike.%${iskanje}%,obcina.ilike.%${iskanje}%`
    );
  }

  if (dozivetje) {
    const slugi = Array.isArray(dozivetje) ? dozivetje : [dozivetje];
    const { data: dozData } = await supabase
      .from("dozivetja")
      .select("id")
      .in("slug", slugi);

    if (dozData?.length) {
      const dozIds = dozData.map((d) => d.id);
      const { data: kdData } = await supabase
        .from("kmetija_dozivetje")
        .select("kmetija_id")
        .in("dozivetje_id", dozIds);

      if (kdData?.length) {
        query = query.in("id", [...new Set(kdData.map((kd) => kd.kmetija_id))]);
      }
    }
  }

  const ascending = smer === "asc";
  switch (sortiranje) {
    case "ocena":
      query = query.order("ocena", { ascending, nullsFirst: false });
      break;
    case "ime":
      query = query.order("ime", { ascending });
      break;
    case "najnovejse":
      query = query.order("ustvarjeno", { ascending });
      break;
  }

  const od = (stran - 1) * naStran;
  query = query.range(od, od + naStran - 1).eq("aktivna", true);

  const { data, error, count } = await query;

  if (error) {
    console.error("Napaka pri pridobivanju kmetij:", error);
    return { podatki: [], skupaj: 0, stran, naStran, skupajStrani: 0 };
  }

  return {
    podatki: ((data as Record<string, unknown>[]) || []).map(normalizirajKmetijo),
    skupaj: count ?? 0,
    stran,
    naStran,
    skupajStrani: Math.ceil((count ?? 0) / naStran),
  };
}

// ─── Pridobi eno kmetijo — en query z vsemi relacijami ──────────────────────

export async function pridobiKmetijo(slug: string): Promise<KmetijaPolna | null> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("kmetije")
    .select(`*, kmetija_dozivetje(dozivetja(*)), mnenja(*), izdelki(*)`)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  const raw = data as Record<string, unknown>;
  return {
    ...normalizirajKmetijo(raw),
    mnenja: ((raw.mnenja as unknown[]) || []) as import("@/types/database").Mnenje[],
    izdelki: ((raw.izdelki as unknown[]) || []) as import("@/types/database").Izdelek[],
  } as unknown as KmetijaPolna;
}

// ─── Izpostavljene kmetije ────────────────────────────────────────────────────

export async function pridobiIzpostavljeneKmetije(
  limit = 3
): Promise<KmetijaSDozivetji[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("kmetije")
    .select(`*, kmetija_dozivetje(dozivetja(*))`)
    .eq("premium", true)
    .eq("aktivna", true)
    .order("ocena", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(normalizirajKmetijo);
}

// ─── Kmetije za zemljevid (z bounding box filtrom) ───────────────────────────

export async function pridobiKmetijeZaZemljevid(filter?: {
  regija?: string;
  jvLat?: number; jvLng?: number;
  szLat?: number; szLng?: number;
}) {
  const supabase = await createSupabaseServer();

  let query = supabase
    .from("kmetije")
    .select(`id, slug, ime, kratki_opis, regija, lat, lng,
             naslovna_slika, ocena, stevilo_ocen, premium,
             kmetija_dozivetje(dozivetja(id, ime, slug, ikona))`)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .eq("aktivna", true);

  if (filter?.regija) query = query.eq("regija", filter.regija);

  if (filter?.jvLat !== undefined && filter?.szLat !== undefined) {
    query = query
      .gte("lat", Math.min(filter.jvLat, filter.szLat))
      .lte("lat", Math.max(filter.jvLat, filter.szLat))
      .gte("lng", Math.min(filter.jvLng!, filter.szLng!))
      .lte("lng", Math.max(filter.jvLng!, filter.szLng!));
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(normalizirajKmetijo);
}

// ─── Ustvari novo kmetijo ────────────────────────────────────────────────────

function slugify(besedilo: string): string {
  return (
    besedilo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

export async function ustvariKmetijo(vhod: {
  ime: string;
  kratki_opis: string;
  opis: string;
  regija: Regija;
  naslov: string;
  obcina: string;
  postna_stevilka: string;
  kontakt_telefon: string;
  kontakt_email: string;
  kontakt_spletna_stran: string;
  dozivetja_ids: string[];
}): Promise<{ uspeh: true; slug: string } | { uspeh: false; napaka: string }> {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { uspeh: false, napaka: "Niste prijavljeni." };

  const { data: profil } = await supabase
    .from("profili")
    .select("vloga")
    .eq("id", user.id)
    .single();

  if (!profil || (profil.vloga !== "lastnik" && profil.vloga !== "super_admin")) {
    return { uspeh: false, napaka: "Samo lastniki kmetij lahko dodajo kmetijo. Spremenite vlogo v nastavitvah." };
  }

  const slug = slugify(vhod.ime);

  const kontaktniPodatki: import("@/types/database").KontaktniPodatki = {};
  if (vhod.kontakt_telefon) kontaktniPodatki.telefon = vhod.kontakt_telefon;
  if (vhod.kontakt_email) kontaktniPodatki.email = vhod.kontakt_email;
  if (vhod.kontakt_spletna_stran) kontaktniPodatki.spletna_stran = vhod.kontakt_spletna_stran;

  const { data: kmetija, error } = await supabase
    .from("kmetije")
    .insert({
      ime: vhod.ime,
      kratki_opis: vhod.kratki_opis || null,
      opis: vhod.opis,
      regija: vhod.regija,
      naslov: vhod.naslov || null,
      obcina: vhod.obcina || null,
      postna_stevilka: vhod.postna_stevilka || null,
      kontaktni_podatki: kontaktniPodatki,
      slug,
      lastnik_id: user.id,
      aktivna: false,
      premium: false,
      naslovna_slika: "",
      slike: [],
      stevilo_ocen: 0,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { uspeh: false, napaka: "Kmetija s tem imenom že obstaja." };
    }
    return { uspeh: false, napaka: error.message };
  }

  if (vhod.dozivetja_ids.length > 0) {
    await supabase.from("kmetija_dozivetje").insert(
      vhod.dozivetja_ids.map((doz_id) => ({
        kmetija_id: kmetija.id,
        dozivetje_id: doz_id,
      }))
    );
  }

  return { uspeh: true, slug: kmetija.slug };
}

// ─── Iskanje (autocomplete) ───────────────────────────────────────────────────

export async function isciKmetije(iskanje: string, limit = 5) {
  if (!iskanje || iskanje.trim().length < 2) return [];

  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("kmetije")
    .select("id, slug, ime, regija, naslovna_slika")
    .or(`ime.ilike.%${iskanje}%,obcina.ilike.%${iskanje}%`)
    .eq("aktivna", true)
    .limit(limit);

  return data || [];
}
