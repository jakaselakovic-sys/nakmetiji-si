// =============================================================================
// NaKmetiji.si — /moj-racun  (Guest Unified Dashboard)
// Different persona from /dashboard (which is vendor/farm-owner oriented):
//   /moj-racun   → traveler (gost)
//   /dashboard   → vendor (lastnik)
// Data surfaces: rezervacije · green stamps · wishlist · saved roadtripi · settings
// =============================================================================

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { MojRacunClient } from "./MojRacunClient";


export interface Rezervacija {
  id: string;
  kmetija_id: string;
  kmetija_ime?: string;
  kmetija_slug?: string;
  datum_od: string;
  datum_do: string;
  stevilo_oseb: number;
  status: "cakanje" | "potrjena" | "zavrnjena" | "preklicana" | "zakljucena";
  skupaj_cena: number | null;
  ustvarjeno: string;
}

export interface StampRow {
  kmetija_id: string;
  kmetija_ime: string;
  regija: string;
  ustvarjeno: string;
}

export interface WishlistRow {
  kmetija_id: string;
  ime: string;
  slug: string;
  regija: string;
  naslovna_slika: string;
  ocena: number | null;
  cena_noc: number | null;
  ustvarjeno: string;
}

export interface RoadtripRow {
  id: string;
  naslov: string;
  regije: string[];
  days: number | null;
  share_slug: string | null;
  ustvarjeno: string;
  stops_count: number;
}

export default async function MojRacunPage() {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/prijava?redirect=/moj-racun");

  // Fetch everything in parallel — each collection is small (≤ hundreds)
  const [profilRes, rezRes, stampsRes, wishlistRes, tripsRes] = await Promise.all([
    sb.from("profili").select("ime, email").eq("id", user.id).maybeSingle(),
    sb
      .from("rezervacije")
      .select("id, kmetija_id, datum_od, datum_do, stevilo_oseb, status, skupaj_cena, ustvarjeno, kmetije:kmetija_id(ime, slug)")
      .eq("gost_id", user.id)
      .order("ustvarjeno", { ascending: false })
      .limit(30),
    sb
      .from("green_stamps")
      .select("kmetija_id, ustvarjeno, kmetije:kmetija_id(ime, regija)")
      .eq("gost_id", user.id)
      .order("ustvarjeno", { ascending: false })
      .limit(50),
    sb
      .from("uporabnik_wishlist")
      .select("kmetija_id, ustvarjeno, kmetije:kmetija_id(ime, slug, regija, naslovna_slika, ocena, cena_noc)")
      .eq("user_id", user.id)
      .order("ustvarjeno", { ascending: false })
      .limit(30),
    sb
      .from("uporabnik_roadtripi")
      .select("id, naslov, regije, days, share_slug, ustvarjeno, plan")
      .eq("user_id", user.id)
      .order("ustvarjeno", { ascending: false })
      .limit(20),
  ]);

  // Normalize joins — Supabase returns nested objects for .select with joins.
  type RezJoin = {
    id: string;
    kmetija_id: string;
    datum_od: string;
    datum_do: string;
    stevilo_oseb: number;
    status: Rezervacija["status"];
    skupaj_cena: number | null;
    ustvarjeno: string;
    kmetije: { ime: string; slug: string } | null;
  };
  const rezervacije: Rezervacija[] =
    ((rezRes.data as RezJoin[] | null) ?? []).map((r) => ({
      id: r.id,
      kmetija_id: r.kmetija_id,
      kmetija_ime: r.kmetije?.ime,
      kmetija_slug: r.kmetije?.slug,
      datum_od: r.datum_od,
      datum_do: r.datum_do,
      stevilo_oseb: r.stevilo_oseb,
      status: r.status,
      skupaj_cena: r.skupaj_cena,
      ustvarjeno: r.ustvarjeno,
    }));

  type StampJoin = {
    kmetija_id: string;
    ustvarjeno: string;
    kmetije: { ime: string; regija: string } | null;
  };
  const stamps: StampRow[] =
    ((stampsRes.data as StampJoin[] | null) ?? []).map((s) => ({
      kmetija_id: s.kmetija_id,
      kmetija_ime: s.kmetije?.ime ?? "(neznana)",
      regija: s.kmetije?.regija ?? "",
      ustvarjeno: s.ustvarjeno,
    }));

  type WishJoin = {
    kmetija_id: string;
    ustvarjeno: string;
    kmetije: {
      ime: string;
      slug: string;
      regija: string;
      naslovna_slika: string;
      ocena: number | null;
      cena_noc: number | null;
    } | null;
  };
  const wishlist: WishlistRow[] =
    ((wishlistRes.data as WishJoin[] | null) ?? [])
      .filter((w) => w.kmetije !== null)
      .map((w) => ({
        kmetija_id: w.kmetija_id,
        ime: w.kmetije!.ime,
        slug: w.kmetije!.slug,
        regija: w.kmetije!.regija,
        naslovna_slika: w.kmetije!.naslovna_slika,
        ocena: w.kmetije!.ocena,
        cena_noc: w.kmetije!.cena_noc,
        ustvarjeno: w.ustvarjeno,
      }));

  type TripRow = {
    id: string;
    naslov: string;
    regije: string[];
    days: number | null;
    share_slug: string | null;
    ustvarjeno: string;
    plan: { stops?: unknown[] } | null;
  };
  const roadtripi: RoadtripRow[] =
    ((tripsRes.data as TripRow[] | null) ?? []).map((t) => ({
      id: t.id,
      naslov: t.naslov,
      regije: t.regije,
      days: t.days,
      share_slug: t.share_slug,
      ustvarjeno: t.ustvarjeno,
      stops_count: Array.isArray(t.plan?.stops) ? t.plan!.stops!.length : 0,
    }));

  return (
    <MojRacunClient
      profilIme={(profilRes.data as { ime: string } | null)?.ime ?? ""}
      email={user.email ?? ""}
      rezervacije={rezervacije}
      stamps={stamps}
      wishlist={wishlist}
      roadtripi={roadtripi}
    />
  );
}
