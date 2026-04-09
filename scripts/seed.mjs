#!/usr/bin/env node
// =============================================================================
// NaKmetiji.si — Database Seed Script
// Poženi: node scripts/seed.mjs
// Zahteva: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY v .env.local
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Preberi .env.local
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  env.split("\n").forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  });
} catch {
  // V CI ni .env.local — spremenljivke so že nastavljene
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Manjka NEXT_PUBLIC_SUPABASE_URL ali SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Seed podatki ─────────────────────────────────────────────────────────────

const DOZIVETJA = [
  { ime: "Prenočišče", slug: "prenocisce", ikona: "Bed", vrstni_red: 1 },
  { ime: "Kulinarika", slug: "kulinarika", ikona: "UtensilsCrossed", vrstni_red: 2 },
  { ime: "Vinski turizem", slug: "vino", ikona: "Wine", vrstni_red: 3 },
  { ime: "Konjeniška doživetja", slug: "konji", ikona: "Horse", vrstni_red: 4 },
  { ime: "Čebelarstvo", slug: "cebelarstvo", ikona: "Flower2", vrstni_red: 5 },
  { ime: "Kmečki turizem", slug: "kmecki-turizem", ikona: "Tractor", vrstni_red: 6 },
  { ime: "Pohodništvo", slug: "pohodnistvo", ikona: "Mountain", vrstni_red: 7 },
  { ime: "Otroci & družine", slug: "druzine", ikona: "Baby", vrstni_red: 8 },
];

const KMETIJE = [
  {
    slug: "kmetija-pr-janezu",
    ime: "Kmetija pri Janežu",
    kratki_opis: "Pristna gorenjska kmetija z razgledom na Triglav",
    opis: "Kmetija pri Janežu leži v srcu Gorenjske, tik pod vznožjem Triglava. Naša družinska kmetija, ki jo vodimo že 5. generacijo, ponuja pristno izkušnjo gorenjskega podeželja. Uživajte v svežem zraku, domači hrani in pomirjujočem pogledu na gore.",
    regija: "gorenjska",
    naslov: "Zgornja Radovna 25",
    obcina: "Bled",
    postna_stevilka: "4260",
    lat: 46.3897,
    lng: 13.9281,
    naslovna_slika: "/images/farms/kmetija-janezu.png",
    slike: ["/images/farms/gallery-prenocisce.png", "/images/farms/gallery-kulinarika.png"],
    kontaktni_podatki: { telefon: "+386 4 574 1234", email: "info@kmetija-pr-janezu.si" },
    amenitete: ["wifi", "parking", "bazen", "otrosko_igrisce", "domaca_hrana"],
    max_gostov: 14,
    cena_noc: 89,
    ocena: 4.8,
    stevilo_ocen: 47,
    premium: true,
    aktivna: true,
    dozivetja_slugi: ["prenocisce", "kulinarika", "pohodnistvo", "druzine"],
  },
  {
    slug: "vinska-klet-brda",
    ime: "Vinska klet Brda",
    kratki_opis: "Butična vinska klet v srcu Goriških Brd",
    opis: "Vinska klet Brda je butična vinska klet, ki leži sredi vinogradov Goriških Brd. Ponujamo vodene degustacije naših nagrajenih vin, prenočitve v lesenih viničarijah ter kulinarične večere s tipičnimi briškimi jedmi. Idealno za romantičen odklop ali skupinsko doživetje.",
    regija: "primorska",
    naslov: "Šmartno 42",
    obcina: "Brda",
    postna_stevilka: "5212",
    lat: 45.9167,
    lng: 13.5333,
    naslovna_slika: "/images/farms/vinska-klet-brda.png",
    slike: ["/images/farms/gallery-kulinarika.png", "/images/farms/gallery-zivali.png"],
    kontaktni_podatki: { telefon: "+386 5 395 2100", email: "degustacije@vinska-klet-brda.si", spletna_stran: "https://vinska-klet-brda.si" },
    amenitete: ["wifi", "parking", "degustacijska_dvorana", "terasa"],
    max_gostov: 8,
    cena_noc: 120,
    ocena: 4.9,
    stevilo_ocen: 83,
    premium: true,
    aktivna: true,
    dozivetja_slugi: ["vino", "kulinarika", "prenocisce"],
  },
  {
    slug: "eko-kmetija-drevc",
    ime: "Eko kmetija Drevc",
    kratki_opis: "Ekološka kmetija s čebelarsko tradicijo v Savinjski dolini",
    opis: "Eko kmetija Drevc je certificirana ekološka kmetija v Savinjski dolini. Specializirali smo se za čebelarstvo in pridelavo ekološkega medu. Gostom ponujamo vodene oglede čebeljnjaka, delavnice točenja medu, degustacije različnih vrst medu ter prenočitve v naši obnovljeni stari kmečki hiši.",
    regija: "savinjska",
    naslov: "Dramlje 18",
    obcina: "Celje",
    postna_stevilka: "3222",
    lat: 46.2167,
    lng: 15.2833,
    naslovna_slika: "/images/farms/eko-kmetija-drevc.png",
    slike: ["/images/farms/gallery-zivali.png", "/images/farms/gallery-prenocisce.png"],
    kontaktni_podatki: { telefon: "+386 3 571 3344", email: "info@eko-drevc.si" },
    amenitete: ["parking", "domaca_hrana", "cebelarstvo", "otrosko_igrisce"],
    max_gostov: 10,
    cena_noc: 75,
    ocena: 4.7,
    stevilo_ocen: 31,
    premium: false,
    aktivna: true,
    dozivetja_slugi: ["cebelarstvo", "kulinarika", "prenocisce", "druzine", "kmecki-turizem"],
  },
];

const IZDELKI_PO_KMETIJI = {
  "kmetija-pr-janezu": [
    { ime: "Domači kruh", opis: "Pečen po stari recepturi, iz naše moke", cena: 4.5, enota: "kos", kategorija: "pekovski_izdelki", zaloga: 20, na_voljo: true },
    { ime: "Planinski sir", opis: "Dozrevan 3 mesece na planini", cena: 18, enota: "kg", kategorija: "mlecni_izdelki", zaloga: 15, na_voljo: true },
    { ime: "Domača marmelada", opis: "Jagodna, malinova ali borovničeva", cena: 5.5, enota: "kozarec", kategorija: "ostalo", zaloga: 50, na_voljo: true },
  ],
  "vinska-klet-brda": [
    { ime: "Rebula 2023", opis: "Suho belo vino, 12.5% alk.", cena: 14, enota: "steklenica", kategorija: "vino_pijace", zaloga: 200, na_voljo: true },
    { ime: "Merlot 2021", opis: "Rdeče vino, 13.5% alk.", cena: 18, enota: "steklenica", kategorija: "vino_pijace", zaloga: 150, na_voljo: true },
    { ime: "Oljčno olje Brda", opis: "Hladno stiskano ekstra devičansko", cena: 22, enota: "steklenica", kategorija: "olja_kis", zaloga: 80, na_voljo: true },
  ],
  "eko-kmetija-drevc": [
    { ime: "Cvetlični med", opis: "100% ekološki, iz naših panjev", cena: 12, enota: "kozarec", kategorija: "med_cebelji_izdelki", zaloga: 100, na_voljo: true },
    { ime: "Gozdni med", opis: "Temnejši, intenzivnejši okus", cena: 14, enota: "kozarec", kategorija: "med_cebelji_izdelki", zaloga: 60, na_voljo: true },
    { ime: "Propolis tinktura", opis: "Naravno antibiotično sredstvo", cena: 9, enota: "steklenička", kategorija: "med_cebelji_izdelki", zaloga: 40, na_voljo: true },
  ],
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱 NaKmetiji.si — Seeding baze podatkov...\n");

  // 1. Ustvari doživetja
  console.log("📦 Ustvarjam doživetja...");
  const { data: dozData, error: dozErr } = await supabase
    .from("dozivetja")
    .upsert(DOZIVETJA, { onConflict: "slug" })
    .select("id, slug");

  if (dozErr) { console.error("❌ Doživetja:", dozErr.message); process.exit(1); }
  console.log(`   ✅ ${dozData.length} doživetij`);

  const dozMap = Object.fromEntries(dozData.map((d) => [d.slug, d.id]));

  // 2. Ustvari demo lastnika
  console.log("👤 Ustvarjam demo lastnika...");
  const { data: authData } = await supabase.auth.admin.createUser({
    email: "lastnik@demo.nakmetiji.si",
    password: "Demo1234!",
    email_confirm: true,
    user_metadata: { ime: "Demo Lastnik", vloga: "lastnik" },
  });

  let lastnikId = authData?.user?.id;

  if (!lastnikId) {
    // Morda že obstaja
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find(u => u.email === "lastnik@demo.nakmetiji.si");
    lastnikId = found?.id;
  }

  if (lastnikId) {
    await supabase.from("profili").upsert({
      id: lastnikId,
      email: "lastnik@demo.nakmetiji.si",
      ime: "Demo Lastnik",
      vloga: "lastnik",
    });
    console.log(`   ✅ Demo lastnik: lastnik@demo.nakmetiji.si / Demo1234!`);
  }

  // 3. Ustvari kmetije
  console.log("🏡 Ustvarjam kmetije...");
  for (const kmetija of KMETIJE) {
    const { dozivetja_slugi, ...kmetijaData } = kmetija;

    const { data: km, error: kmErr } = await supabase
      .from("kmetije")
      .upsert({ ...kmetijaData, lastnik_id: lastnikId }, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (kmErr) { console.error(`❌ Kmetija ${kmetija.ime}:`, kmErr.message); continue; }

    // Doživetja (many-to-many)
    await supabase.from("kmetija_dozivetje").delete().eq("kmetija_id", km.id);
    const pivot = dozivetja_slugi
      .filter((s) => dozMap[s])
      .map((s) => ({ kmetija_id: km.id, dozivetje_id: dozMap[s] }));
    if (pivot.length) await supabase.from("kmetija_dozivetje").insert(pivot);

    // Izdelki
    const izdelki = IZDELKI_PO_KMETIJI[km.slug] || [];
    if (izdelki.length) {
      await supabase.from("izdelki").delete().eq("kmetija_id", km.id);
      await supabase.from("izdelki").insert(izdelki.map((i) => ({ ...i, kmetija_id: km.id })));
    }

    console.log(`   ✅ ${kmetija.ime}`);
  }

  // 4. Demo rezervacija
  console.log("📅 Ustvarjam demo rezervacijo...");
  const { data: prva } = await supabase.from("kmetije").select("id").eq("slug", "kmetija-pr-janezu").single();
  if (prva) {
    await supabase.from("rezervacije").upsert({
      kmetija_id: prva.id,
      gost_ime: "Ana Kovač",
      gost_email: "ana.kovac@demo.si",
      gost_telefon: "+386 41 123 456",
      stevilo_oseb: 4,
      datum_od: "2026-07-10",
      datum_do: "2026-07-14",
      skupaj_cena: 356,
      opombe: "Imamo majhnega otroka. Ali imate otroško posteljico?",
      status: "cakanje",
    }, { onConflict: "id" });
    console.log("   ✅ Demo rezervacija (kmetija-pr-janezu)");
  }

  // 5. Demo mnenje
  console.log("⭐ Ustvarjam demo mnenja...");
  if (prva) {
    await supabase.from("mnenja").upsert([
      { kmetija_id: prva.id, uporabnik_ime: "Maja Horvat", uporabnik_email: "maja@demo.si", ocena: 5, komentar: "Čudovita izkušnja! Domača hrana je bila izvrstna, pogled na gore pa nepozaben.", status: "odobreno" },
      { kmetija_id: prva.id, uporabnik_ime: "Peter Zupan", uporabnik_email: "peter@demo.si", ocena: 5, komentar: "Topli gostitelji, udobne sobe. Vrnemo se zagotovo!", status: "odobreno" },
    ], { onConflict: "id" });
    console.log("   ✅ Demo mnenja");
  }

  console.log("\n✅ Seeding končan!\n");
  console.log("Demo account: lastnik@demo.nakmetiji.si / Demo1234!");
  console.log("Kmetije: kmetija-pr-janezu | vinska-klet-brda | eko-kmetija-drevc\n");
}

seed().catch((e) => { console.error("❌ Seed napaka:", e); process.exit(1); });
