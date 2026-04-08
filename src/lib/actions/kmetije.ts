// =============================================================================
// NaKmetiji.si — Server Actions: Kmetije (Farms)
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import type {
  Kmetija,
  KmetijaSDozivetji,
  KmetijaPolna,
  KmetijeFilter,
  PaginiraniRezultat,
  Dozivetje,
} from "@/types/database";

// ─── Pomoč: pridobi doživetja za kmetijo ────────────────────────────────────

async function pridobiDozivetjaZaKmetijo(
  kmetijaId: string
): Promise<Dozivetje[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("kmetija_dozivetje")
    .select("dozivetje_id")
    .eq("kmetija_id", kmetijaId);

  if (error || !data || data.length === 0) return [];

  const ids = data.map((d) => d.dozivetje_id);

  const { data: dozivetja } = await supabase
    .from("dozivetja")
    .select("*")
    .in("id", ids)
    .order("vrstni_red", { ascending: true });

  return (dozivetja as Dozivetje[]) || [];
}

// ─── Pridobi vse kmetije s filtri ───────────────────────────────────────────

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

  // Začnemo query
  let query = supabase.from("kmetije").select("*", { count: "exact" });

  // Filter: regija
  if (regija) {
    if (Array.isArray(regija)) {
      query = query.in("regija", regija);
    } else {
      query = query.eq("regija", regija);
    }
  }

  // Filter: premium
  if (premium !== undefined) {
    query = query.eq("premium", premium);
  }

  // Filter: minimalna ocena
  if (ocenaMin) {
    query = query.gte("ocena", ocenaMin);
  }

  // Filter: iskanje (full-text)
  if (iskanje && iskanje.trim()) {
    query = query.or(
      `ime.ilike.%${iskanje}%,opis.ilike.%${iskanje}%,kratki_opis.ilike.%${iskanje}%,obcina.ilike.%${iskanje}%`
    );
  }

  // Sortiranje
  switch (sortiranje) {
    case "ocena":
      query = query.order("ocena", {
        ascending: smer === "asc",
        nullsFirst: false,
      });
      break;
    case "ime":
      query = query.order("ime", { ascending: smer === "asc" });
      break;
    case "najnovejse":
      query = query.order("ustvarjeno", {
        ascending: smer === "asc",
      });
      break;
  }

  // Paginacija
  const od = (stran - 1) * naStran;
  const dokončno = od + naStran - 1;
  query = query.range(od, dokončno);

  const { data, error, count } = await query;

  if (error) {
    console.error("Napaka pri pridobivanju kmetij:", error);
    return {
      podatki: [],
      skupaj: 0,
      stran,
      naStran,
      skupajStrani: 0,
    };
  }

  const kmetije = (data as Kmetija[]) || [];

  // Filtriranje po doživetju (many-to-many)
  let filtriraneKmetije = kmetije;
  if (dozivetje) {
    const slugi = Array.isArray(dozivetje) ? dozivetje : [dozivetje];

    // Pridobi ID-je doživetij iz slugov
    const { data: dozData } = await supabase
      .from("dozivetja")
      .select("id")
      .in("slug", slugi);

    if (dozData && dozData.length > 0) {
      const dozIds = dozData.map((d) => d.id);

      // Pridobi kmetije ki imajo ta doživetja
      const { data: kdData } = await supabase
        .from("kmetija_dozivetje")
        .select("kmetija_id")
        .in("dozivetje_id", dozIds);

      if (kdData) {
        const veljavniIds = new Set(kdData.map((kd) => kd.kmetija_id));
        filtriraneKmetije = kmetije.filter((k) => veljavniIds.has(k.id));
      }
    }
  }

  // Dodaj doživetja vsaki kmetiji
  const kmetijeSDozivetji: KmetijaSDozivetji[] = await Promise.all(
    filtriraneKmetije.map(async (kmetija) => ({
      ...kmetija,
      dozivetja: await pridobiDozivetjaZaKmetijo(kmetija.id),
    }))
  );

  const skupaj = dozivetje ? filtriraneKmetije.length : (count ?? 0);

  return {
    podatki: kmetijeSDozivetji,
    skupaj,
    stran,
    naStran,
    skupajStrani: Math.ceil(skupaj / naStran),
  };
}

// ─── Pridobi eno kmetijo po slug-u ──────────────────────────────────────────

export async function pridobiKmetijo(
  slug: string
): Promise<KmetijaPolna | null> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("kmetije")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("Napaka pri pridobivanju kmetije:", error);
    return null;
  }

  const kmetija = data as Kmetija;

  // Pridobi doživetja
  const dozivetja = await pridobiDozivetjaZaKmetijo(kmetija.id);

  // Pridobi mnenja
  const { data: mnenjaData } = await supabase
    .from("mnenja")
    .select("*")
    .eq("kmetija_id", kmetija.id)
    .order("datum", { ascending: false });

  return {
    ...kmetija,
    dozivetja,
    mnenja: mnenjaData || [],
  };
}

// ─── Pridobi izpostavljene (featured) kmetije ───────────────────────────────

export async function pridobiIzpostavljeneKmetije(
  limit: number = 3
): Promise<KmetijaSDozivetji[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("kmetije")
    .select("*")
    .eq("premium", true)
    .order("ocena", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) {
    console.error("Napaka pri izpostavljenih kmetijah:", error);
    return [];
  }

  return Promise.all(
    (data as Kmetija[]).map(async (kmetija) => ({
      ...kmetija,
      dozivetja: await pridobiDozivetjaZaKmetijo(kmetija.id),
    }))
  );
}

// ─── Pridobi kmetije za zemljevid ───────────────────────────────────────────

export async function pridobiKmetijeZaZemljevid(): Promise<
  Pick<
    KmetijaSDozivetji,
    | "id"
    | "slug"
    | "ime"
    | "kratki_opis"
    | "regija"
    | "lat"
    | "lng"
    | "naslovna_slika"
    | "ocena"
    | "stevilo_ocen"
    | "premium"
    | "dozivetja"
  >[]
> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("kmetije")
    .select(
      "id, slug, ime, kratki_opis, regija, lat, lng, naslovna_slika, ocena, stevilo_ocen, premium"
    )
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error || !data) {
    console.error("Napaka pri zemljevid kmetijah:", error);
    return [];
  }

  return Promise.all(
    data.map(async (kmetija) => ({
      ...(kmetija as Pick<
        Kmetija,
        | "id"
        | "slug"
        | "ime"
        | "kratki_opis"
        | "regija"
        | "lat"
        | "lng"
        | "naslovna_slika"
        | "ocena"
        | "stevilo_ocen"
        | "premium"
      >),
      dozivetja: await pridobiDozivetjaZaKmetijo(kmetija.id),
    }))
  );
}

// ─── Iskanje kmetij (za search bar autocomplete) ────────────────────────────

export async function isciKmetije(
  query: string,
  limit: number = 5
): Promise<Pick<Kmetija, "id" | "slug" | "ime" | "regija" | "naslovna_slika">[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("kmetije")
    .select("id, slug, ime, regija, naslovna_slika")
    .or(`ime.ilike.%${query}%,obcina.ilike.%${query}%,kratki_opis.ilike.%${query}%`)
    .limit(limit);

  if (error || !data) return [];

  return data as Pick<
    Kmetija,
    "id" | "slug" | "ime" | "regija" | "naslovna_slika"
  >[];
}
