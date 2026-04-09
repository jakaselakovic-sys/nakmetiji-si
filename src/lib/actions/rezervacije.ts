// =============================================================================
// NaKmetiji.si — Server Actions: Rezervacije
// Booking flow: submit → pending → approve/reject
// =============================================================================

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { posljiEmailLastniku, posljiPotrditev, posljiZavrnitev } from "@/lib/email";

// ─── Oddaj rezervacijo (gost) ─────────────────────────────────────────────────

export async function oddajRezervacijo(input: {
  kmetija_id: string;
  datum_od: string;
  datum_do: string;
  gost_ime: string;
  gost_email: string;
  gost_telefon?: string;
  stevilo_oseb: number;
  opombe?: string;
}): Promise<{ ok: boolean; napaka?: string; id?: string }> {
  const supabase = await createSupabaseServer();

  // Pridobi kmetijo (za ceno, email lastnika, max gostov)
  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("id, ime, naslov, cena_noc, max_gostov, lastnik_id, profili(email)")
    .eq("id", input.kmetija_id)
    .single();

  if (!kmetija) return { ok: false, napaka: "Kmetija ne obstaja." };

  if (input.stevilo_oseb > (kmetija.max_gostov ?? 99)) {
    return { ok: false, napaka: `Največje število gostov je ${kmetija.max_gostov}.` };
  }

  // Preveri dostopnost
  const { data: konflikt } = await supabase
    .from("rezervacije")
    .select("id")
    .eq("kmetija_id", input.kmetija_id)
    .in("status", ["cakanje", "potrjena"])
    .lt("datum_od", input.datum_do)
    .gt("datum_do", input.datum_od)
    .limit(1);

  if (konflikt?.length) {
    return { ok: false, napaka: "Izbrani termini so zasedeni. Prosimo izberite druge datume." };
  }

  // Izračunaj ceno
  const od = new Date(input.datum_od);
  const do_ = new Date(input.datum_do);
  const nocitve = Math.round((do_.getTime() - od.getTime()) / 86400000);
  const skupaj_cena = nocitve * (kmetija.cena_noc ?? 0);

  // Vstavi rezervacijo
  const { data: rez, error } = await supabase
    .from("rezervacije")
    .insert({
      ...input,
      skupaj_cena,
      status: "cakanje",
    })
    .select()
    .single();

  if (error) {
    // 23P01 = exclusion constraint violation (race condition)
    if (error.code === "23P01") {
      return { ok: false, napaka: "Termini so bili ravnokar zasedeni. Poskusite znova." };
    }
    console.error("Rezervacija napaka:", error);
    return { ok: false, napaka: "Napaka pri oddaji. Poskusite znova." };
  }

  // Pošlji email lastniku (fire-and-forget)
  const profiliRaw = kmetija.profili as unknown;
  const lastnikEmail = profiliRaw && !Array.isArray(profiliRaw)
    ? (profiliRaw as { email: string }).email
    : Array.isArray(profiliRaw) && profiliRaw.length > 0
    ? (profiliRaw[0] as { email: string }).email
    : null;
  if (lastnikEmail) {
    posljiEmailLastniku({
      lastnik_email: lastnikEmail,
      kmetija_ime: kmetija.ime,
      gost_ime: input.gost_ime,
      gost_email: input.gost_email,
      gost_telefon: input.gost_telefon ?? null,
      datum_od: input.datum_od,
      datum_do: input.datum_do,
      stevilo_oseb: input.stevilo_oseb,
      opombe: input.opombe ?? null,
      rezervacija_id: rez.id,
    }).catch(console.error);
  }

  return { ok: true, id: rez.id };
}

// ─── Potrdi rezervacijo (lastnik) ─────────────────────────────────────────────

export async function potrdiRezervacijo(
  rezervacija_id: string
): Promise<{ ok: boolean; napaka?: string }> {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  // Pridobi rezervacijo + kmetijo za validacijo lastništva
  const { data: rez } = await supabase
    .from("rezervacije")
    .select(`*, kmetije(ime, naslov, lastnik_id)`)
    .eq("id", rezervacija_id)
    .single();

  if (!rez) return { ok: false, napaka: "Rezervacija ne obstaja." };
  if ((rez.kmetije as { lastnik_id: string }).lastnik_id !== user.id) {
    return { ok: false, napaka: "Nimate dovoljenja." };
  }
  if (rez.status !== "cakanje") {
    return { ok: false, napaka: "Rezervacija ni v čakanju." };
  }

  const { error } = await supabase
    .from("rezervacije")
    .update({ status: "potrjena", posodobljena: new Date().toISOString() })
    .eq("id", rezervacija_id);

  if (error?.code === "23P01") {
    return { ok: false, napaka: "Termini so bili medtem zasedeni." };
  }
  if (error) return { ok: false, napaka: "Napaka pri potrditvi." };

  // Pošlji email gostu
  posljiPotrditev({
    gost_email: rez.gost_email,
    gost_ime: rez.gost_ime,
    kmetija_ime: (rez.kmetije as { ime: string }).ime,
    kmetija_naslov: (rez.kmetije as { naslov: string | null }).naslov,
    datum_od: rez.datum_od,
    datum_do: rez.datum_do,
    skupaj_cena: rez.skupaj_cena,
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
    return { ok: false, napaka: "Nimate dovoljenja." };
  }

  await supabase
    .from("rezervacije")
    .update({ status: "zavrnjena", posodobljena: new Date().toISOString() })
    .eq("id", rezervacija_id);

  posljiZavrnitev({
    gost_email: rez.gost_email,
    gost_ime: rez.gost_ime,
    kmetija_ime: (rez.kmetije as { ime: string }).ime,
    datum_od: rez.datum_od,
    datum_do: rez.datum_do,
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
