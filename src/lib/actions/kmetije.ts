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
    // Escape ILIKE special characters to prevent wildcard DoS / timing attacks
    const esc = iskanje.trim().replace(/[%_\\]/g, "\\$&").slice(0, 100);
    query = query.or(
      `ime.ilike.%${esc}%,opis.ilike.%${esc}%,kratki_opis.ilike.%${esc}%,obcina.ilike.%${esc}%`
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

// ─── Posodobi slike kmetije (doda URL v slike array) ────────────────────────

export async function posodobiSlikeKmetije(
  kmetija_id: string,
  nova_url: string
): Promise<{ ok: boolean; napaka?: string }> {
  // Whitelist: only allow HTTPS URLs pointing to Supabase storage
  try {
    const parsed = new URL(nova_url);
    const allowed = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace("https://", "");
    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(allowed)) {
      return { ok: false, napaka: "Neveljaven URL slike." };
    }
  } catch {
    return { ok: false, napaka: "Neveljaven URL slike." };
  }

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  const { data: k } = await supabase
    .from("kmetije")
    .select("slike, lastnik_id")
    .eq("id", kmetija_id)
    .single();

  const { data: profil } = await supabase
    .from("profili")
    .select("vloga")
    .eq("id", user.id)
    .single();

  if (k?.lastnik_id !== user.id && profil?.vloga !== "super_admin") {
    return { ok: false, napaka: "Nimate dovoljenja." };
  }

  const noveSlike = [...((k?.slike as string[]) ?? []), nova_url];
  const { error } = await supabase
    .from("kmetije")
    .update({ slike: noveSlike })
    .eq("id", kmetija_id);

  if (error) return { ok: false, napaka: error.message };
  return { ok: true };
}

// ─── Posodobi kmetijo (lastnik) ───────────────────────────────────────────────

export async function posodobiKmetijo(
  kmetija_id: string,
  vhod: {
    ime?: string;
    kratki_opis?: string;
    opis?: string;
    regija?: Regija;
    naslov?: string;
    obcina?: string;
    postna_stevilka?: string;
    kontakt_telefon?: string;
    kontakt_email?: string;
    kontakt_spletna_stran?: string;
    cena_noc?: number | null;
    max_gostov?: number | null;
    iban?: string | null;
    bic?: string | null;
    dozivetja_ids?: string[];
  }
): Promise<{ ok: boolean; napaka?: string }> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  const { data: k } = await supabase
    .from("kmetije")
    .select("lastnik_id")
    .eq("id", kmetija_id)
    .single();

  const { data: profil } = await supabase
    .from("profili")
    .select("vloga")
    .eq("id", user.id)
    .single();

  if (k?.lastnik_id !== user.id && profil?.vloga !== "super_admin") {
    return { ok: false, napaka: "Nimate dovoljenja." };
  }

  const kontaktniPodatki: import("@/types/database").KontaktniPodatki = {};
  if (vhod.kontakt_telefon !== undefined) kontaktniPodatki.telefon = vhod.kontakt_telefon || undefined;
  if (vhod.kontakt_email !== undefined) kontaktniPodatki.email = vhod.kontakt_email || undefined;
  if (vhod.kontakt_spletna_stran !== undefined) kontaktniPodatki.spletna_stran = vhod.kontakt_spletna_stran || undefined;

  const posodobitev: Record<string, unknown> = {};
  if (vhod.ime !== undefined) posodobitev.ime = vhod.ime;
  if (vhod.kratki_opis !== undefined) posodobitev.kratki_opis = vhod.kratki_opis || null;
  if (vhod.opis !== undefined) posodobitev.opis = vhod.opis;
  if (vhod.regija !== undefined) posodobitev.regija = vhod.regija;
  if (vhod.naslov !== undefined) posodobitev.naslov = vhod.naslov || null;
  if (vhod.obcina !== undefined) posodobitev.obcina = vhod.obcina || null;
  if (vhod.postna_stevilka !== undefined) posodobitev.postna_stevilka = vhod.postna_stevilka || null;
  if (Object.keys(kontaktniPodatki).length > 0) posodobitev.kontaktni_podatki = kontaktniPodatki;
  if (vhod.cena_noc !== undefined) posodobitev.cena_noc = vhod.cena_noc;
  if (vhod.max_gostov !== undefined) posodobitev.max_gostov = vhod.max_gostov;
  if (vhod.iban !== undefined) posodobitev.iban = vhod.iban || null;
  if (vhod.bic !== undefined) posodobitev.bic = vhod.bic || null;

  const { error } = await supabase
    .from("kmetije")
    .update(posodobitev)
    .eq("id", kmetija_id);

  if (error) return { ok: false, napaka: error.message };

  // Posodobi dozivetja (izbriši stare, vstavi nove)
  if (vhod.dozivetja_ids !== undefined) {
    await supabase.from("kmetija_dozivetje").delete().eq("kmetija_id", kmetija_id);
    if (vhod.dozivetja_ids.length > 0) {
      await supabase.from("kmetija_dozivetje").insert(
        vhod.dozivetja_ids.map((doz_id) => ({ kmetija_id, dozivetje_id: doz_id }))
      );
    }
  }

  return { ok: true };
}

// ─── Pridobi dozivetja IDs za kmetijo ────────────────────────────────────────

export async function pridobiDozivetjaKmetije(kmetija_id: string): Promise<string[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("kmetija_dozivetje")
    .select("dozivetje_id")
    .eq("kmetija_id", kmetija_id);
  return (data ?? []).map((d) => d.dozivetje_id);
}

// ─── Premium Boost ───────────────────────────────────────────────────────────
//
// Toggles the `premium` flag on a farm. Only the farm owner (or super_admin)
// can call this. Returns { ok, premium } so the UI can optimistically update.

export async function togglePremium(
  kmetija_id: string,
  enable: boolean
): Promise<{ ok: boolean; napaka?: string; premium?: boolean }> {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  // Ownership check — also allow super_admin override
  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("lastnik_id")
    .eq("id", kmetija_id)
    .single();

  if (!kmetija) return { ok: false, napaka: "Kmetija ne obstaja." };

  if (kmetija.lastnik_id !== user.id) {
    const { data: profil } = await supabase
      .from("profili").select("vloga").eq("id", user.id).single();
    if (profil?.vloga !== "super_admin") {
      return { ok: false, napaka: "Nimate dovoljenja." };
    }
  }

  // premium_until: 30 days from now when enabling, null when disabling
  const premiumUntil = enable
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase
    .from("kmetije")
    .update({ premium: enable, premium_until: premiumUntil, posodobljeno: new Date().toISOString() })
    .eq("id", kmetija_id);

  if (error) return { ok: false, napaka: "Napaka pri posodobitvi." };

  // Record subscription period (best-effort, fire-and-forget)
  if (enable) {
    void supabase.from("premium_narocnine").insert({
      kmetija_id,
      user_id: user.id,
      plan: "mesecna",
      zacetek: new Date().toISOString(),
      konec: premiumUntil!,
      cena_eur: 29.99,
    });
  }

  return { ok: true, premium: enable };
}

// ─── Iskanje (autocomplete) ───────────────────────────────────────────────────

export async function isciKmetije(iskanje: string, limit = 5) {
  if (!iskanje || iskanje.trim().length < 2) return [];

  const supabase = await createSupabaseServer();
  const esc = iskanje.trim().replace(/[%_\\]/g, "\\$&").slice(0, 100);
  const { data } = await supabase
    .from("kmetije")
    .select("id, slug, ime, regija, naslovna_slika")
    .or(`ime.ilike.%${esc}%,obcina.ilike.%${esc}%`)
    .eq("aktivna", true)
    .limit(limit);

  return data || [];
}
