// =============================================================================
// NaKmetiji.si — Server Actions: Rezervacije (Booking Engine)
//
// Atomic booking flow using PostgreSQL advisory locking:
//   submit  → atomic_rezerviraj() RPC (farm-row lock + overlap check)
//   approve → status update + UPN generation + guest email with payment slip
//   reject  → status update + guest notification
//
// All DB writes go through atomic_rezerviraj() to guarantee:
//   1. No double-bookings (exclusion constraint + row lock)
//   2. No race conditions (farm row locked for duration of transaction)
//   3. Accurate error codes for UX (DATE_CONFLICT, OVER_CAPACITY, etc.)
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import {
  posljiEmailLastniku,
  posljiCakanjeGostu,
  posljiPotrditev,
  posljiZavrnitev,
} from "@/lib/email";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AtomicRpcResult {
  ok: boolean;
  id?: string;
  napaka?: string;
  code?: "DATE_CONFLICT" | "OVER_CAPACITY" | "RACE_CONDITION" | "NOT_FOUND" | "FARM_INACTIVE" | "INVALID_DATES" | "PAST_DATES" | "INTERNAL";
}

// ─── Oddaj rezervacijo (gost) ─────────────────────────────────────────────────

export async function oddajRezervacijo(input: {
  kmetija_id: string;
  datum_od: string;         // "YYYY-MM-DD"
  datum_do: string;
  gost_ime: string;
  gost_email: string;
  gost_telefon?: string;
  stevilo_oseb: number;
  opombe?: string;
}): Promise<{ ok: boolean; napaka?: string; id?: string }> {
  const supabase = await createSupabaseServer();

  // ── Fetch farm metadata for price calculation and emails ──────────────────
  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("id, slug, ime, naslov, cena_noc, max_gostov, lastnik_id, profili(email, ime)")
    .eq("id", input.kmetija_id)
    .single();

  if (!kmetija) return { ok: false, napaka: "Kmetija ne obstaja." };

  // Calculate nightly cost
  const od  = new Date(input.datum_od);
  const do_ = new Date(input.datum_do);
  const nocitve    = Math.max(1, Math.round((do_.getTime() - od.getTime()) / 86_400_000));
  const skupaj_cena = nocitve * (kmetija.cena_noc ?? 0);

  // ── Atomic booking via PL/pgSQL (single serialized transaction) ───────────
  const { data: rpc, error: rpcError } = await supabase.rpc("atomic_rezerviraj", {
    p_kmetija_id:   input.kmetija_id,
    p_datum_od:     input.datum_od,
    p_datum_do:     input.datum_do,
    p_gost_ime:     input.gost_ime,
    p_gost_email:   input.gost_email,
    p_gost_telefon: input.gost_telefon ?? null,
    p_stevilo_oseb: input.stevilo_oseb,
    p_opombe:       input.opombe ?? null,
    p_skupaj_cena:  skupaj_cena,
  });

  if (rpcError) {
    console.error("[booking] atomic_rezerviraj RPC error:", rpcError);
    return { ok: false, napaka: "Napaka pri rezervaciji. Prosimo poskusite znova." };
  }

  const result = rpc as AtomicRpcResult;

  if (!result.ok) {
    return { ok: false, napaka: result.napaka ?? "Rezervacija ni uspela." };
  }

  const rezervacija_id = result.id!;

  // ── Emails — fire-and-forget (never block the response) ───────────────────
  const profiliRaw  = kmetija.profili as unknown;
  const lastnikData = Array.isArray(profiliRaw) ? profiliRaw[0] : profiliRaw;
  const lastnikEmail = (lastnikData as { email?: string } | null)?.email ?? null;
  const lastnikIme   = (lastnikData as { ime?: string } | null)?.ime ?? "Lastnik";

  // Email to owner
  const logEmailError = (vir: string) => (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    void import("@/lib/logNapako").then(({ logNapako }) =>
      logNapako({ tip: "email", vir, sporocilo: msg, kontekst: { rezervacija_id } })
    );
  };

  if (lastnikEmail) {
    posljiEmailLastniku({
      lastnik_email: lastnikEmail,
      lastnik_ime:   lastnikIme,
      kmetija_ime:   kmetija.ime,
      gost_ime:      input.gost_ime,
      gost_email:    input.gost_email,
      gost_telefon:  input.gost_telefon ?? null,
      datum_od:      input.datum_od,
      datum_do:      input.datum_do,
      stevilo_oseb:  input.stevilo_oseb,
      opombe:        input.opombe ?? null,
      rezervacija_id,
      skupaj_cena,
    }).catch(logEmailError("rezervacije/oddaj/owner-email"));
  }

  // "Awaiting confirmation" email to guest
  posljiCakanjeGostu({
    gost_email:    input.gost_email,
    gost_ime:      input.gost_ime,
    kmetija_ime:   kmetija.ime,
    kmetija_naslov: kmetija.naslov,
    kmetija_slug:  kmetija.slug,
    datum_od:      input.datum_od,
    datum_do:      input.datum_do,
    stevilo_oseb:  input.stevilo_oseb,
    skupaj_cena:   skupaj_cena || null,
    rezervacija_id,
  }).catch(logEmailError("rezervacije/oddaj/guest-awaiting"));

  return { ok: true, id: rezervacija_id };
}

// ─── Potrdi rezervacijo (lastnik) ─────────────────────────────────────────────

export async function potrdiRezervacijo(
  rezervacija_id: string
): Promise<{ ok: boolean; napaka?: string }> {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  // Fetch booking + farm for ownership check
  const { data: rez } = await supabase
    .from("rezervacije")
    .select(`
      id, gost_ime, gost_email, datum_od, datum_do,
      skupaj_cena, stevilo_oseb, status,
      kmetije(id, slug, ime, naslov, lastnik_id, iban, bic)
    `)
    .eq("id", rezervacija_id)
    .single();

  if (!rez) return { ok: false, napaka: "Rezervacija ne obstaja." };

  const kmetija = rez.kmetije as unknown as {
    id: string; slug: string; ime: string; naslov: string | null;
    lastnik_id: string; iban?: string | null; bic?: string | null;
  };

  if (kmetija.lastnik_id !== user.id) {
    // Allow super_admin to override
    const { data: profil } = await supabase
      .from("profili").select("vloga").eq("id", user.id).single();
    if (profil?.vloga !== "super_admin") {
      return { ok: false, napaka: "Nimate dovoljenja." };
    }
  }

  if (rez.status !== "cakanje") {
    return { ok: false, napaka: `Rezervacija je v stanju "${rez.status}" in je ni mogoče potrditi.` };
  }

  // Update status
  const { error } = await supabase
    .from("rezervacije")
    .update({ status: "potrjena", posodobljeno: new Date().toISOString() })
    .eq("id", rezervacija_id);

  if (error?.code === "23P01") {
    return { ok: false, napaka: "Termini so bili medtem zasedeni s strani druge rezervacije." };
  }
  if (error) return { ok: false, napaka: "Napaka pri potrditvi." };

  // Send confirmation email with UPN payment slip (fire-and-forget)
  posljiPotrditev({
    gost_email:      rez.gost_email,
    gost_ime:        rez.gost_ime,
    kmetija_ime:     kmetija.ime,
    kmetija_naslov:  kmetija.naslov,
    kmetija_slug:    kmetija.slug,
    datum_od:        rez.datum_od,
    datum_do:        rez.datum_do,
    stevilo_oseb:    rez.stevilo_oseb,
    skupaj_cena:     rez.skupaj_cena,
    rezervacija_id,
    kmetija_iban:    kmetija.iban ?? null,
    kmetija_bic:     kmetija.bic ?? null,
  }).catch(console.error);

  return { ok: true };
}

// ─── Zavrni rezervacijo (lastnik) ─────────────────────────────────────────────

export async function zavrniRezervacijo(
  rezervacija_id: string
): Promise<{ ok: boolean; napaka?: string }> {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  const { data: rez } = await supabase
    .from("rezervacije")
    .select(`*, kmetije(ime, lastnik_id)`)
    .eq("id", rezervacija_id)
    .single();

  if (!rez) return { ok: false, napaka: "Rezervacija ne obstaja." };
  if ((rez.kmetije as { lastnik_id: string }).lastnik_id !== user.id) {
    const { data: profil } = await supabase
      .from("profili").select("vloga").eq("id", user.id).single();
    if (profil?.vloga !== "super_admin") {
      return { ok: false, napaka: "Nimate dovoljenja." };
    }
  }

  const { error } = await supabase
    .from("rezervacije")
    .update({ status: "zavrnjena", posodobljeno: new Date().toISOString() })
    .eq("id", rezervacija_id);

  if (error) return { ok: false, napaka: "Napaka pri zavrnitvi." };

  posljiZavrnitev({
    gost_email:    rez.gost_email,
    gost_ime:      rez.gost_ime,
    kmetija_ime:   (rez.kmetije as { ime: string }).ime,
    datum_od:      rez.datum_od,
    datum_do:      rez.datum_do,
    rezervacija_id,
  }).catch(console.error);

  return { ok: true };
}

// ─── Pridobi rezervacije za lastnika ─────────────────────────────────────────

export async function pridobiRezervacijeLastnika() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("rezervacije")
    .select(`*, kmetije(ime, id)`)
    .eq("kmetije.lastnik_id", user.id)
    .order("ustvarjeno", { ascending: false });

  return data || [];
}
