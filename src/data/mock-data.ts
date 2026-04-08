// =============================================================================
// NaKmetiji.si — Mock Data
// 10 realističnih slovenskih kmetij s 5 izdelki na kmetijo
// Za razvoj brez Supabase povezave
// =============================================================================

import type {
  Kmetija,
  Dozivetje,
  Mnenje,
  Izdelek,
  Rezervacija,
  KmetijaSDozivetji,
} from "@/types/database";

// ─── Doživetja (Experience Categories) ──────────────────────────────────────

export const MOCK_DOZIVETJA: Dozivetje[] = [
  { id: "doz-01", ime: "Vino & Degustacija", slug: "vino", ikona: "Wine", opis: "Vinska doživetja in degustacije", vrstni_red: 1, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
  { id: "doz-02", ime: "Prenočišče", slug: "prenocisce", ikona: "Bed", opis: "Nastanitve na kmetiji", vrstni_red: 2, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
  { id: "doz-03", ime: "Za družine", slug: "druzine", ikona: "Users", opis: "Aktivnosti za vso družino", vrstni_red: 3, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
  { id: "doz-04", ime: "Kulinarika", slug: "kulinarika", ikona: "ChefHat", opis: "Kulinarna doživetja", vrstni_red: 4, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
  { id: "doz-05", ime: "Wellness & Spa", slug: "wellness", ikona: "Sparkles", opis: "Sprostitev in wellness", vrstni_red: 5, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
  { id: "doz-06", ime: "Šport & Avantura", slug: "sport", ikona: "Mountain", opis: "Športne aktivnosti", vrstni_red: 6, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
  { id: "doz-07", ime: "Živali na kmetiji", slug: "zivali", ikona: "PawPrint", opis: "Stik z živalmi", vrstni_red: 7, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
  { id: "doz-08", ime: "Delavnice", slug: "delavnice", ikona: "Hammer", opis: "Rokodelske delavnice", vrstni_red: 8, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
  { id: "doz-09", ime: "Ekološka kmetija", slug: "ekologija", ikona: "Leaf", opis: "Ekološka pridelava", vrstni_red: 9, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
  { id: "doz-10", ime: "Prireditve & Dogodki", slug: "prireditve", ikona: "PartyPopper", opis: "Dogodki in praznovanja", vrstni_red: 10, ustvarjeno: "2024-01-01", posodobljeno: "2024-01-01" },
];

// ─── 10 Realističnih Slovenskih Kmetij ──────────────────────────────────────

export const MOCK_KMETIJE: Kmetija[] = [
  {
    id: "km-01",
    slug: "kmetija-pr-janezu",
    ime: "Kmetija pr' Janežu",
    kratki_opis: "Gorenjska idila s pogledom na Julijske Alpe",
    opis: "Družinska kmetija pod vznožjem Triglava, ki že pet generacij ponuja pristen stik z naravo. Naši gostje uživajo v svežem gorskem zraku, domačih dobrotah in nebeških razgledih na Julijske Alpe. Posebej smo ponosni na naš domači sir, ki ga izdelujemo po tradicionalni recpturi naše babice.",
    regija: "gorenjska",
    naslov: "Zgornja Radovna 25",
    obcina: "Bled",
    postna_stevilka: "4260",
    lat: 46.3842,
    lng: 13.9738,
    naslovna_slika: "/images/farms/kmetija-janezu.png",
    slike: ["/images/farms/kmetija-janezu.png", "/images/farms/gallery-prenocisce.png", "/images/farms/gallery-zivali.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 4 572 33 00", email: "info@prjanezu.si", spletna_stran: "https://prjanezu.si" },
    ocena: 4.8,
    stevilo_ocen: 47,
    premium: true,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-01-15",
    posodobljeno: "2024-12-01",
  },
  {
    id: "km-02",
    slug: "vinska-klet-steyer",
    ime: "Vinska klet Šteyer",
    kratki_opis: "Vrhunska vina iz srca Štajerske",
    opis: "Na sončnih gričih Slovenskih goric ležijo naši vinogradi, ki jih obdelujemo že od leta 1892. Ponujamo degustacije vrhunskih vin — od aromatičnega laškega rizlinga do polnega šipona. Ob kozarcu vina vas čaka razgled, ki seže vse do Avstrije.",
    regija: "stajerska",
    naslov: "Škalce 15",
    obcina: "Lenart v Slovenskih goricah",
    postna_stevilka: "2230",
    lat: 46.5722,
    lng: 15.8294,
    naslovna_slika: "/images/farms/vinska-klet-brda.png",
    slike: ["/images/farms/vinska-klet-brda.png", "/images/farms/gallery-kulinarika.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 2 729 55 10", email: "vino@steyer.si", instagram: "steyer_wines" },
    ocena: 4.9,
    stevilo_ocen: 83,
    premium: true,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-02-10",
    posodobljeno: "2024-11-15",
  },
  {
    id: "km-03",
    slug: "eko-kmetija-zlatorog",
    ime: "Eko kmetija Zlatorog",
    kratki_opis: "Ekološko kmetovanje v Bohinju",
    opis: "Certificirana ekološka kmetija ob Bohinjskem jezeru. Pridelujemo ekološko zelenjavo, sadimo stara avtohtone sorte jabolk in redimo Drežniške koze. Naše mlečne izdelke pripravljamo ročno, brez konzervansov, z ljubeznijo do narave in tradicije.",
    regija: "gorenjska",
    naslov: "Stara Fužina 88",
    obcina: "Bohinj",
    postna_stevilka: "4265",
    lat: 46.2919,
    lng: 13.8653,
    naslovna_slika: "/images/farms/eko-kmetija-drevc.png",
    slike: ["/images/farms/eko-kmetija-drevc.png", "/images/farms/gallery-zivali.png", "/images/farms/gallery-prenocisce.png", "/images/farms/gallery-kulinarika.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 4 572 10 80", email: "info@zlatorog-eko.si" },
    ocena: 4.6,
    stevilo_ocen: 34,
    premium: false,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-03-05",
    posodobljeno: "2024-10-20",
  },
  {
    id: "km-04",
    slug: "turisticna-kmetija-klinec",
    ime: "Turistična kmetija Klinec",
    kratki_opis: "Kraška kulinarika z dušo",
    opis: "Na robu Krasa vas pričakujejo osmice, pršut, teran in neponovljiva kraška gostoljubnost. Naša kmetija je znana po sušenem mesu, ki ga pripravljamo v tradicionalni kraški sušilnici — burji. Ponujamo tudi prenočišča v renovirani kraški hiši iz 18. stoletja.",
    regija: "primorska",
    naslov: "Tomaj 36",
    obcina: "Sežana",
    postna_stevilka: "6221",
    lat: 45.7163,
    lng: 13.8542,
    naslovna_slika: "/images/farms/gallery-kulinarika.png",
    slike: ["/images/farms/gallery-kulinarika.png", "/images/farms/gallery-prenocisce.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 5 764 02 00", email: "osmica@klinec.si", facebook: "KmetijKlinec" },
    ocena: 4.7,
    stevilo_ocen: 62,
    premium: true,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-01-20",
    posodobljeno: "2024-12-10",
  },
  {
    id: "km-05",
    slug: "kmetija-bregar",
    ime: "Kmetija Bregar",
    kratki_opis: "Prleška domačija z gostilno",
    opis: "Na ovinkih Prlekije stoji naša kmetija, ki danes deluje kot kmečka gostilna z nastanitvami. Ponujamo tradicionalne prlške jedi — bujto repo, žgance, domačo potico — ob spremljavi naših vin. Idealno izhodišče za pohodništvo in kolesarjenje po vinskih cestah.",
    regija: "pomurska",
    naslov: "Kog 22a",
    obcina: "Ormož",
    postna_stevilka: "2270",
    lat: 46.3967,
    lng: 16.1342,
    naslovna_slika: "/images/farms/gallery-prenocisce.png",
    slike: ["/images/farms/gallery-prenocisce.png", "/images/farms/gallery-kulinarika.png", "/images/farms/vinska-klet-brda.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 2 741 00 55", email: "gostilna@bregar.si" },
    ocena: 4.5,
    stevilo_ocen: 29,
    premium: false,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-04-12",
    posodobljeno: "2024-11-30",
  },
  {
    id: "km-06",
    slug: "cebelarska-kmetija-ambrozic",
    ime: "Čebelarska kmetija Ambrožič",
    kratki_opis: "Sladki svet kranjskega medu",
    opis: "Smo tretja generacija čebelarjev na Kranjskem. Naših 120 panjev med cvetočimi travniki Sorške ravni proizvede vrhunski lipov, akacijev in gozdni med. Ponujamo oglede čebelnjaka, delavnice o apiterapiji in degustacije medenih izdelkov.",
    regija: "gorenjska",
    naslov: "Naklo 44",
    obcina: "Naklo",
    postna_stevilka: "4202",
    lat: 46.3373,
    lng: 14.3175,
    naslovna_slika: "/images/farms/eko-kmetija-drevc.png",
    slike: ["/images/farms/eko-kmetija-drevc.png", "/images/farms/gallery-zivali.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 4 277 60 00", email: "med@ambrozic.si", instagram: "ambrozic_med" },
    ocena: 4.4,
    stevilo_ocen: 18,
    premium: false,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-05-01",
    posodobljeno: "2024-09-15",
  },
  {
    id: "km-07",
    slug: "kmetija-pri-mariji",
    ime: "Kmetija pri Mariji",
    kratki_opis: "Dolenjske toplice za duho in telo",
    opis: "V zavetju dolenjskih gozdov in termalnih virov vas čaka sprostitev za telo in duho. Naše prenočitvene kapacitete zajemajo prenovljeno kašno domačijo s 6 sobami in wellness programom na bazi naravnih zeliščnih kopeli. Ponujamo tudi terapevtsko jahanje.",
    regija: "dolenjska",
    naslov: "Podturn 7",
    obcina: "Dolenjske Toplice",
    postna_stevilka: "8350",
    lat: 45.7553,
    lng: 15.0581,
    naslovna_slika: "/images/farms/gallery-prenocisce.png",
    slike: ["/images/farms/gallery-prenocisce.png", "/images/farms/gallery-zivali.png", "/images/farms/kmetija-janezu.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 7 384 50 00", email: "info@pri-mariji.si", spletna_stran: "https://pri-mariji.si" },
    ocena: 4.7,
    stevilo_ocen: 41,
    premium: true,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-02-28",
    posodobljeno: "2024-12-05",
  },
  {
    id: "km-08",
    slug: "sadjarski-vrt-kobal",
    ime: "Sadjarski vrt Kobal",
    kratki_opis: "Stare sorte jabolk in hrušk v Vipavski dolini",
    opis: "V sončni Vipavski dolini ohranjamo 45 starih avtohtonih sort jabolk in hrušk. Naš sadovnjak je živi muzej biodiverzitete, ki ga obiskovalci lahko raziščejo ob vodenih ogledih. Ponosni smo na naš jabolčnik in domače sokove brez dodanega sladkorja.",
    regija: "primorska",
    naslov: "Slap 15",
    obcina: "Vipava",
    postna_stevilka: "5271",
    lat: 45.8467,
    lng: 13.9633,
    naslovna_slika: "/images/farms/eko-kmetija-drevc.png",
    slike: ["/images/farms/eko-kmetija-drevc.png", "/images/farms/gallery-kulinarika.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 5 368 70 00", email: "sadje@kobal.si" },
    ocena: 4.3,
    stevilo_ocen: 22,
    premium: false,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-06-10",
    posodobljeno: "2024-10-01",
  },
  {
    id: "km-09",
    slug: "kmetija-logar",
    ime: "Kmetija Logar",
    kratki_opis: "Savinjski sir in alpski zrak",
    opis: "V prelepi Logarski dolini, eni najlepših alpskih dolin v Evropi, stoji naša kmetija. Ponujamo nastanitve z zajtrkom iz lastnih pridelkov — sir, maslo, med, domač kruh. Okolica je raj za pohodnike; od tu vodijo poti do Okrešlja in Ojstrice.",
    regija: "savinjska",
    naslov: "Logarska dolina 11",
    obcina: "Solčava",
    postna_stevilka: "3335",
    lat: 46.3932,
    lng: 14.6342,
    naslovna_slika: "/images/farms/gallery-zivali.png",
    slike: ["/images/farms/gallery-zivali.png", "/images/farms/gallery-prenocisce.png", "/images/farms/eko-kmetija-drevc.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 3 838 90 00", email: "kmetija@logar.si", spletna_stran: "https://kmetija-logar.si" },
    ocena: 4.9,
    stevilo_ocen: 91,
    premium: true,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-01-05",
    posodobljeno: "2024-12-12",
  },
  {
    id: "km-10",
    slug: "ranc-na-pohorju",
    ime: "Ranč na Pohorju",
    kratki_opis: "Konji, narava in pohorski gozdovi",
    opis: "Na pobočjih Pohorja vodimo ranč s 14 konji za terapevtsko in rekreativno jahanje. Poleg jahanja ponujamo izlete s konjsko vprego, teambuilding programe ter prenočišča v lesenih bungalovih sredi gozda. Poleti organiziramo tudi konjeniške tabore za otroke.",
    regija: "stajerska",
    naslov: "Rogla 5",
    obcina: "Zreče",
    postna_stevilka: "3214",
    lat: 46.4517,
    lng: 15.3958,
    naslovna_slika: "/images/farms/gallery-zivali.png",
    slike: ["/images/farms/gallery-zivali.png", "/images/farms/gallery-prenocisce.png"],
    video_url: null,
    kontaktni_podatki: { telefon: "+386 3 757 22 00", email: "info@ranc-pohorje.si", instagram: "ranc_pohorje" },
    ocena: 4.6,
    stevilo_ocen: 55,
    premium: false,
    aktivna: true,
    lastnik_id: null,
    ustvarjeno: "2024-03-18",
    posodobljeno: "2024-11-20",
  },
];

// ─── Doživetja na kmetijo (Many-to-Many) ────────────────────────────────────

export const MOCK_KMETIJA_DOZIVETJE: { kmetija_id: string; dozivetje_id: string }[] = [
  // Kmetija pr' Janežu → prenočišče, kulinarika, družine, živali, ekologija
  { kmetija_id: "km-01", dozivetje_id: "doz-02" },
  { kmetija_id: "km-01", dozivetje_id: "doz-04" },
  { kmetija_id: "km-01", dozivetje_id: "doz-03" },
  { kmetija_id: "km-01", dozivetje_id: "doz-07" },
  { kmetija_id: "km-01", dozivetje_id: "doz-09" },
  // Vinska klet Šteyer → vino, kulinarika, prireditve
  { kmetija_id: "km-02", dozivetje_id: "doz-01" },
  { kmetija_id: "km-02", dozivetje_id: "doz-04" },
  { kmetija_id: "km-02", dozivetje_id: "doz-10" },
  // Eko kmetija Zlatorog → ekologija, živali, družine, delavnice
  { kmetija_id: "km-03", dozivetje_id: "doz-09" },
  { kmetija_id: "km-03", dozivetje_id: "doz-07" },
  { kmetija_id: "km-03", dozivetje_id: "doz-03" },
  { kmetija_id: "km-03", dozivetje_id: "doz-08" },
  // Kmetija Klinec → kulinarika, vino, prenočišče, prireditve
  { kmetija_id: "km-04", dozivetje_id: "doz-04" },
  { kmetija_id: "km-04", dozivetje_id: "doz-01" },
  { kmetija_id: "km-04", dozivetje_id: "doz-02" },
  { kmetija_id: "km-04", dozivetje_id: "doz-10" },
  // Kmetija Bregar → kulinarika, vino, prenočišče, šport
  { kmetija_id: "km-05", dozivetje_id: "doz-04" },
  { kmetija_id: "km-05", dozivetje_id: "doz-01" },
  { kmetija_id: "km-05", dozivetje_id: "doz-02" },
  { kmetija_id: "km-05", dozivetje_id: "doz-06" },
  // Čebelarska kmetija Ambrožič → ekologija, delavnice, družine
  { kmetija_id: "km-06", dozivetje_id: "doz-09" },
  { kmetija_id: "km-06", dozivetje_id: "doz-08" },
  { kmetija_id: "km-06", dozivetje_id: "doz-03" },
  // Kmetija pri Mariji → prenočišče, wellness, živali, družine
  { kmetija_id: "km-07", dozivetje_id: "doz-02" },
  { kmetija_id: "km-07", dozivetje_id: "doz-05" },
  { kmetija_id: "km-07", dozivetje_id: "doz-07" },
  { kmetija_id: "km-07", dozivetje_id: "doz-03" },
  // Sadjarski vrt Kobal → ekologija, delavnice, družine
  { kmetija_id: "km-08", dozivetje_id: "doz-09" },
  { kmetija_id: "km-08", dozivetje_id: "doz-08" },
  { kmetija_id: "km-08", dozivetje_id: "doz-03" },
  // Kmetija Logar → prenočišče, kulinarika, šport, živali, ekologija
  { kmetija_id: "km-09", dozivetje_id: "doz-02" },
  { kmetija_id: "km-09", dozivetje_id: "doz-04" },
  { kmetija_id: "km-09", dozivetje_id: "doz-06" },
  { kmetija_id: "km-09", dozivetje_id: "doz-07" },
  { kmetija_id: "km-09", dozivetje_id: "doz-09" },
  // Ranč na Pohorju → šport, živali, družine, prenočišče, prireditve
  { kmetija_id: "km-10", dozivetje_id: "doz-06" },
  { kmetija_id: "km-10", dozivetje_id: "doz-07" },
  { kmetija_id: "km-10", dozivetje_id: "doz-03" },
  { kmetija_id: "km-10", dozivetje_id: "doz-02" },
  { kmetija_id: "km-10", dozivetje_id: "doz-10" },
];

// ─── Izdelki (5 na kmetijo = 50 skupaj) ─────────────────────────────────────

export const MOCK_IZDELKI: Izdelek[] = [
  // ── Kmetija pr' Janežu (km-01) ──
  { id: "iz-01-01", kmetija_id: "km-01", ime: "Bohinjski sir", opis: "Trdi sir, zorjen 6 mesecev v gorski kleti", cena: 18.50, enota: "kg", kategorija: "mlecni_izdelki", zaloga: 25, na_voljo: true, slika_url: "/images/products/bohinjski-sir.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-01-02", kmetija_id: "km-01", ime: "Gorenjski med", opis: "Lipov med iz lastnega čebelnjaka", cena: 12.00, enota: "kozarec (450g)", kategorija: "med_cebelji_izdelki", zaloga: 40, na_voljo: true, slika_url: "/images/products/gorenjski-med.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-01-03", kmetija_id: "km-01", ime: "Domače maslo", opis: "Sveže mešano maslo iz alpske smetane", cena: 5.80, enota: "kos (250g)", kategorija: "mlecni_izdelki", zaloga: 15, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-01-04", kmetija_id: "km-01", ime: "Ajdov kruh", opis: "Pečen v krušni peči na drva", cena: 4.50, enota: "kos", kategorija: "pekovski_izdelki", zaloga: 8, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-01-05", kmetija_id: "km-01", ime: "Jabolčni sok", opis: "100% naravni sok brez dodanega sladkorja", cena: 6.00, enota: "liter", kategorija: "sadje_zelenjava", zaloga: 50, na_voljo: true, slika_url: "/images/products/jabolcni-sok.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },

  // ── Vinska klet Šteyer (km-02) ──
  { id: "iz-02-01", kmetija_id: "km-02", ime: "Laški rizling 2022", opis: "Suho belo vino, sveže in aromatično", cena: 14.90, enota: "steklenica (0,75l)", kategorija: "vino_pijace", zaloga: 120, na_voljo: true, slika_url: "/images/products/laski-rizling.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-02-02", kmetija_id: "km-02", ime: "Šipon 2021", opis: "Polno belo vino z oreščki in medom", cena: 16.50, enota: "steklenica (0,75l)", kategorija: "vino_pijace", zaloga: 85, na_voljo: true, slika_url: "/images/products/sipon.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-02-03", kmetija_id: "km-02", ime: "Modra frankinja 2020", opis: "Rdeče vino, zorjeno v hrastovih sodih", cena: 19.00, enota: "steklenica (0,75l)", kategorija: "vino_pijace", zaloga: 60, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-02-04", kmetija_id: "km-02", ime: "Vinski kis", opis: "Naravni jabolčni kis, guten 2 leti", cena: 8.50, enota: "steklenica (0,5l)", kategorija: "olja_kis", zaloga: 30, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-02-05", kmetija_id: "km-02", ime: "Bučno olje", opis: "Hladno stiskano štajersko bučno olje", cena: 22.00, enota: "steklenica (0,5l)", kategorija: "olja_kis", zaloga: 45, na_voljo: true, slika_url: "/images/products/bucno-olje.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },

  // ── Eko kmetija Zlatorog (km-03) ──
  { id: "iz-03-01", kmetija_id: "km-03", ime: "Ekološke paradižnikove omake", opis: "Rezina eko paradižnikov s baziliko", cena: 5.50, enota: "kozarec (330ml)", kategorija: "sadje_zelenjava", zaloga: 60, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-03-02", kmetija_id: "km-03", ime: "Kozji sir", opis: "Sveži kozji sir iz Drežniških koz", cena: 14.00, enota: "kos (200g)", kategorija: "mlecni_izdelki", zaloga: 20, na_voljo: true, slika_url: "/images/products/kozji-sir.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-03-03", kmetija_id: "km-03", ime: "Ekološki jogurt", opis: "Naravni kozji jogurt brez dodatkov", cena: 3.80, enota: "lonček (350ml)", kategorija: "mlecni_izdelki", zaloga: 30, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-03-04", kmetija_id: "km-03", ime: "Suho sadje mešanica", opis: "Jabolka, hruške in slive — posušene na zraku", cena: 9.00, enota: "vrečka (200g)", kategorija: "sadje_zelenjava", zaloga: 35, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-03-05", kmetija_id: "km-03", ime: "Zeliščno milo", opis: "Ročno izdelano milo z lavando in kamilico", cena: 7.00, enota: "kos (100g)", kategorija: "domaca_kosmerika", zaloga: 50, na_voljo: true, slika_url: "/images/products/zeliscno-milo.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },

  // ── Turistična kmetija Klinec (km-04) ──
  { id: "iz-04-01", kmetija_id: "km-04", ime: "Kraški pršut", opis: "Sušen na burji, zorjen 18 mesecev", cena: 42.00, enota: "kg", kategorija: "mesni_izdelki", zaloga: 15, na_voljo: true, slika_url: "/images/products/kraski-prsut.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-04-02", kmetija_id: "km-04", ime: "Teran PTP 2022", opis: "Zaščiteno kraško rdeče vino", cena: 11.90, enota: "steklenica (0,75l)", kategorija: "vino_pijace", zaloga: 70, na_voljo: true, slika_url: "/images/products/teran.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-04-03", kmetija_id: "km-04", ime: "Panceta", opis: "Sušena svinjska trebušina po kraško", cena: 28.00, enota: "kg", kategorija: "mesni_izdelki", zaloga: 10, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-04-04", kmetija_id: "km-04", ime: "Oljčno olje", opis: "Ekstra deviško iz istrskih oljk", cena: 18.00, enota: "steklenica (0,5l)", kategorija: "olja_kis", zaloga: 25, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-04-05", kmetija_id: "km-04", ime: "Kraški med", opis: "Cvetlični med s kraških travnikov", cena: 14.00, enota: "kozarec (450g)", kategorija: "med_cebelji_izdelki", zaloga: 35, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },

  // ── Kmetija Bregar (km-05) ──
  { id: "iz-05-01", kmetija_id: "km-05", ime: "Prlška gibanica", opis: "Tradicionalna prekmurska gibanica z 4 polnili", cena: 22.00, enota: "kos (cca 2kg)", kategorija: "pekovski_izdelki", zaloga: 5, na_voljo: true, slika_url: "/images/products/gibanica.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-05-02", kmetija_id: "km-05", ime: "Domača klobasa", opis: "Dimljena klobasa iz domačega prašiča", cena: 16.00, enota: "kg", kategorija: "mesni_izdelki", zaloga: 20, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-05-03", kmetija_id: "km-05", ime: "Štrapon penina", opis: "Peneče vino iz traminCA", cena: 13.50, enota: "steklenica (0,75l)", kategorija: "vino_pijace", zaloga: 40, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-05-04", kmetija_id: "km-05", ime: "Domači žganje", opis: "Sadjevec iz domačih hrušk Viljamovk", cena: 25.00, enota: "steklenica (0,5l)", kategorija: "vino_pijace", zaloga: 15, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-05-05", kmetija_id: "km-05", ime: "Bučno olje ZGP", opis: "Zaščiteno geografsko poreklo, štajersko bučno olje", cena: 24.00, enota: "steklenica (0,5l)", kategorija: "olja_kis", zaloga: 30, na_voljo: true, slika_url: "/images/products/bucno-olje-zgp.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },

  // ── Čebelarska kmetija Ambrožič (km-06) ──
  { id: "iz-06-01", kmetija_id: "km-06", ime: "Lipov med", opis: "Aromatičen med z vonji lipe", cena: 14.00, enota: "kozarec (450g)", kategorija: "med_cebelji_izdelki", zaloga: 80, na_voljo: true, slika_url: "/images/products/lipov-med.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-06-02", kmetija_id: "km-06", ime: "Akacijev med", opis: "Nežno sladek, svetel in tekočega", cena: 16.00, enota: "kozarec (450g)", kategorija: "med_cebelji_izdelki", zaloga: 60, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-06-03", kmetija_id: "km-06", ime: "Propolis kapljice", opis: "Naravni propolisov izvleček za imunski sistem", cena: 18.00, enota: "steklenička (30ml)", kategorija: "med_cebelji_izdelki", zaloga: 45, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-06-04", kmetija_id: "km-06", ime: "Čebelji vosek sveče", opis: "Ročno valjane sveče iz naravnega voska", cena: 8.50, enota: "kos", kategorija: "ostalo", zaloga: 100, na_voljo: true, slika_url: "/images/products/svece.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-06-05", kmetija_id: "km-06", ime: "Medeni balzam za ustnice", opis: "Naravna kozmetika na osnovi čebeljega voska", cena: 6.00, enota: "kos", kategorija: "domaca_kosmerika", zaloga: 55, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },

  // ── Kmetija pri Mariji (km-07) ──
  { id: "iz-07-01", kmetija_id: "km-07", ime: "Zeliščni čaj mešanica", opis: "Mešanica meta, kamilice in šipka iz vrta", cena: 7.50, enota: "vrečka (80g)", kategorija: "ostalo", zaloga: 40, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-07-02", kmetija_id: "km-07", ime: "Lavandova kopel", opis: "Ročno pripravljena kopalna sol z lavando", cena: 12.00, enota: "vrečka (300g)", kategorija: "domaca_kosmerika", zaloga: 25, na_voljo: true, slika_url: "/images/products/lavandova-kopel.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-07-03", kmetija_id: "km-07", ime: "Domača marmelada", opis: "Jagodna marmelada iz lastnih nasadov", cena: 5.50, enota: "kozarec (280g)", kategorija: "sadje_zelenjava", zaloga: 35, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-07-04", kmetija_id: "km-07", ime: "Eterično olje meta", opis: "100% naravno eterično olje", cena: 15.00, enota: "steklenička (10ml)", kategorija: "domaca_kosmerika", zaloga: 20, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-07-05", kmetija_id: "km-07", ime: "Gozdni med", opis: "Temni gozdni med, bogat z minerali", cena: 13.00, enota: "kozarec (450g)", kategorija: "med_cebelji_izdelki", zaloga: 30, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },

  // ── Sadjarski vrt Kobal (km-08) ──
  { id: "iz-08-01", kmetija_id: "km-08", ime: "Jabolčni sok Jonagold", opis: "Naraven sok iz sorte Jonagold, brez sladkorja", cena: 5.50, enota: "liter", kategorija: "sadje_zelenjava", zaloga: 80, na_voljo: true, slika_url: "/images/products/sok-jonagold.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-08-02", kmetija_id: "km-08", ime: "Hruškovec", opis: "Žganje iz Viljamovk, dvojno destilirano", cena: 28.00, enota: "steklenica (0,5l)", kategorija: "vino_pijace", zaloga: 20, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-08-03", kmetija_id: "km-08", ime: "Jabolčni kis", opis: "Naravno fermentiran, nepasteriziran", cena: 7.00, enota: "steklenica (0,5l)", kategorija: "olja_kis", zaloga: 40, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-08-04", kmetija_id: "km-08", ime: "Suhe jabolčne rezine", opis: "Posušene na soncu, brez konzervansov", cena: 6.50, enota: "vrečka (150g)", kategorija: "sadje_zelenjava", zaloga: 50, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-08-05", kmetija_id: "km-08", ime: "Jabolčna čežana", opis: "Tradicionalna gosta jabolčna kaša", cena: 4.80, enota: "kozarec (350ml)", kategorija: "sadje_zelenjava", zaloga: 45, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },

  // ── Kmetija Logar (km-09) ──
  { id: "iz-09-01", kmetija_id: "km-09", ime: "Solčavski sir", opis: "Poltrdi sir iz polnomastnega mleka", cena: 20.00, enota: "kg", kategorija: "mlecni_izdelki", zaloga: 18, na_voljo: true, slika_url: "/images/products/solcavski-sir.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-09-02", kmetija_id: "km-09", ime: "Domače maslo", opis: "Sveže maslo iz planšarije", cena: 6.00, enota: "kos (250g)", kategorija: "mlecni_izdelki", zaloga: 12, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-09-03", kmetija_id: "km-09", ime: "Planšarski jogurt", opis: "Gosti jogurt z gozdnimi sadeži", cena: 3.50, enota: "lonček (350ml)", kategorija: "mlecni_izdelki", zaloga: 20, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-09-04", kmetija_id: "km-09", ime: "Kruh iz krušne peči", opis: "Mešan kruh, pečen na tradicionalen način", cena: 5.00, enota: "kos", kategorija: "pekovski_izdelki", zaloga: 6, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-09-05", kmetija_id: "km-09", ime: "Smrekova žganje", opis: "Liker iz mladih smrekovih vršičkov", cena: 18.00, enota: "steklenica (0,35l)", kategorija: "vino_pijace", zaloga: 30, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },

  // ── Ranč na Pohorju (km-10) ──
  { id: "iz-10-01", kmetija_id: "km-10", ime: "Pohorski med", opis: "Gozdni med iz pohorskih smrekovih gozdov", cena: 15.00, enota: "kozarec (450g)", kategorija: "med_cebelji_izdelki", zaloga: 35, na_voljo: true, slika_url: "/images/products/pohorski-med.jpg", ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-10-02", kmetija_id: "km-10", ime: "Konjski balzam", opis: "Hladilni gel na osnovi konjskega kostanja", cena: 10.00, enota: "tuba (200ml)", kategorija: "domaca_kosmerika", zaloga: 25, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-10-03", kmetija_id: "km-10", ime: "Suha salama", opis: "Tradicionalna suha salama, dimljena na bukvi", cena: 24.00, enota: "kg", kategorija: "mesni_izdelki", zaloga: 12, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-10-04", kmetija_id: "km-10", ime: "Borovničeva marmelada", opis: "Gozdne borovnice, pobrane na Pohorju", cena: 6.50, enota: "kozarec (280g)", kategorija: "sadje_zelenjava", zaloga: 40, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
  { id: "iz-10-05", kmetija_id: "km-10", ime: "Ajdovi žganci mix", opis: "Pripravljena mešanica za domače žgance", cena: 4.00, enota: "vrečka (500g)", kategorija: "pekovski_izdelki", zaloga: 55, na_voljo: true, slika_url: null, ustvarjeno: "2024-06-01", posodobljeno: "2024-12-01" },
];

// ─── Mnenja ─────────────────────────────────────────────────────────────────

export const MOCK_MNENJA: Mnenje[] = [
  { id: "mn-01", kmetija_id: "km-01", uporabnik_ime: "Ana Kovač", uporabnik_email: null, ocena: 5, komentar: "Čudovit razgled in najboljši sir, kar sem ga kdaj jedla! Otroci so bili navdušeni nad živalmi.", odobreno: true, datum: "2024-11-15" },
  { id: "mn-02", kmetija_id: "km-01", uporabnik_ime: "Marko Zupan", uporabnik_email: null, ocena: 5, komentar: "Izjemna kmetija. Gostoljubna družina, čudovita narava. Se bomo zagotovo vrnili!", odobreno: true, datum: "2024-10-20" },
  { id: "mn-03", kmetija_id: "km-02", uporabnik_ime: "Petra Novak", uporabnik_email: null, ocena: 5, komentar: "Najboljša vinska degustacija v Sloveniji! Šipon je fantastičen.", odobreno: true, datum: "2024-09-28" },
  { id: "mn-04", kmetija_id: "km-04", uporabnik_ime: "Luka Horvat", uporabnik_email: null, ocena: 5, komentar: "Pršut se topi na jeziku! Osmica s pogledom... noro.", odobreno: true, datum: "2024-11-01" },
  { id: "mn-05", kmetija_id: "km-07", uporabnik_ime: "Maja Kranjc", uporabnik_email: null, ocena: 5, komentar: "Wellness na kmetiji — kdo bi si mislil, da je to mogoče! Popolnoma sproščena.", odobreno: true, datum: "2024-08-15" },
  { id: "mn-06", kmetija_id: "km-09", uporabnik_ime: "Tomaž Vidmar", uporabnik_email: null, ocena: 5, komentar: "Logarska dolina je eno najlepših mest, kar sem jih videl. Kmetija Logar je biser.", odobreno: true, datum: "2024-07-22" },
  { id: "mn-07", kmetija_id: "km-09", uporabnik_ime: "Nina Šuštar", uporabnik_email: null, ocena: 5, komentar: "Zajtrk iz lastnih pridelkov! Sir, kruh, marmelada — vse sveže in domače.", odobreno: true, datum: "2024-08-30" },
  { id: "mn-08", kmetija_id: "km-10", uporabnik_ime: "Žan Potočnik", uporabnik_email: null, ocena: 4, komentar: "Super jahanje v gozdovih! Edino treba vnaprej rezervirat ker je veliko povpraševanje.", odobreno: true, datum: "2024-09-10" },
  { id: "mn-09", kmetija_id: "km-03", uporabnik_ime: "Eva Medved", uporabnik_email: null, ocena: 5, komentar: "Kozji sir iz eko kmetije je res nekaj posebnega. Čudovita izkušnja za otroke.", odobreno: true, datum: "2024-10-05" },
  { id: "mn-10", kmetija_id: "km-06", uporabnik_ime: "Rok Petrič", uporabnik_email: null, ocena: 4, komentar: "Zelo zanimiva delavnica o apiterapiji. Med je vrhunski, priporočam lipovega.", odobreno: true, datum: "2024-11-20" },
];

// ─── Rezervacije (Mock Bookings) ────────────────────────────────────────────

export const MOCK_REZERVACIJE: Rezervacija[] = [
  // ── Kmetija pr' Janežu (km-01) ──
  { id: "rez-01-01", kmetija_id: "km-01", gost_ime: "Družina Kovač", gost_email: "ana.kovac@gmail.com", gost_telefon: "+386 41 555 100", stevilo_oseb: 4, datum_od: "2025-07-10", datum_do: "2025-07-14", opombe: "Dva otroka (5 in 8 let), prosim sobo s pogledom na gore.", status: "potrjena", ustvarjeno: "2025-03-15", posodobljeno: "2025-03-17" },
  { id: "rez-01-02", kmetija_id: "km-01", gost_ime: "Peter Zore", gost_email: "peter.zore@yahoo.com", gost_telefon: null, stevilo_oseb: 2, datum_od: "2025-08-01", datum_do: "2025-08-03", opombe: null, status: "cakanje", ustvarjeno: "2025-04-01", posodobljeno: "2025-04-01" },

  // ── Vinska klet Šteyer (km-02) ──
  { id: "rez-02-01", kmetija_id: "km-02", gost_ime: "Maja in Tomaž Vidmar", gost_email: "vidmar.maja@gmail.com", gost_telefon: "+386 31 222 333", stevilo_oseb: 6, datum_od: "2025-06-20", datum_do: "2025-06-21", opombe: "Degustacija za 6 oseb, skupina prijateljev. Vegetarijanska opcija za 2.", status: "potrjena", ustvarjeno: "2025-02-10", posodobljeno: "2025-02-12" },

  // ── Eko kmetija Zlatorog (km-03) ──
  { id: "rez-03-01", kmetija_id: "km-03", gost_ime: "Eva Medved", gost_email: "eva.medved@outlook.com", gost_telefon: "+386 40 111 222", stevilo_oseb: 3, datum_od: "2025-05-15", datum_do: "2025-05-18", opombe: "Zanima nas delavnica izdelave sira.", status: "zakljucena", ustvarjeno: "2025-01-20", posodobljeno: "2025-05-19" },
  { id: "rez-03-02", kmetija_id: "km-03", gost_ime: "Rok Petrič", gost_email: "rok.petric@gmail.com", gost_telefon: null, stevilo_oseb: 2, datum_od: "2025-09-01", datum_do: "2025-09-04", opombe: null, status: "cakanje", ustvarjeno: "2025-04-02", posodobljeno: "2025-04-02" },

  // ── Turistična kmetija Klinec (km-04) ──
  { id: "rez-04-01", kmetija_id: "km-04", gost_ime: "Luka Horvat", gost_email: "luka.horvat@proton.me", gost_telefon: "+386 51 444 555", stevilo_oseb: 2, datum_od: "2025-06-05", datum_do: "2025-06-07", opombe: "Ali je mogoča zasebna osmica za dva?", status: "potrjena", ustvarjeno: "2025-03-01", posodobljeno: "2025-03-03" },
  { id: "rez-04-02", kmetija_id: "km-04", gost_ime: "Skupina Triglav d.o.o.", gost_email: "events@triglav.si", gost_telefon: "+386 1 234 5678", stevilo_oseb: 12, datum_od: "2025-10-10", datum_do: "2025-10-11", opombe: "Teambuilding za 12 zaposlenih. Potrebujemo račun na firmo.", status: "zavrnjena", ustvarjeno: "2025-04-05", posodobljeno: "2025-04-06" },

  // ── Kmetija Bregar (km-05) ──
  { id: "rez-05-01", kmetija_id: "km-05", gost_ime: "Neža Kralj", gost_email: "neza.kralj@gmail.com", gost_telefon: "+386 30 777 888", stevilo_oseb: 5, datum_od: "2025-07-20", datum_do: "2025-07-23", opombe: "Družina s 3 otroki. Zanima nas kolesarjenje po vinskih cestah.", status: "potrjena", ustvarjeno: "2025-02-28", posodobljeno: "2025-03-02" },

  // ── Čebelarska kmetija Ambrožič (km-06) ──
  { id: "rez-06-01", kmetija_id: "km-06", gost_ime: "OŠ Naklo - 4.a razred", gost_email: "uciteljica.nina@os-naklo.si", gost_telefon: "+386 4 277 60 10", stevilo_oseb: 25, datum_od: "2025-05-22", datum_do: "2025-05-22", opombe: "Šolska ekskurzija, 23 učencev + 2 spremljevalki. Prosimo ogled čebelnjaka in delavnico.", status: "potrjena", ustvarjeno: "2025-01-15", posodobljeno: "2025-01-17" },
  { id: "rez-06-02", kmetija_id: "km-06", gost_ime: "Martin Šiftar", gost_email: "martin.siftar@gmail.com", gost_telefon: null, stevilo_oseb: 1, datum_od: "2025-08-15", datum_do: "2025-08-15", opombe: "Zanima me apiterapija. Ali ponujate individualne termine?", status: "cakanje", ustvarjeno: "2025-04-03", posodobljeno: "2025-04-03" },

  // ── Kmetija pri Mariji (km-07) ──
  { id: "rez-07-01", kmetija_id: "km-07", gost_ime: "Irena in Jože Košir", gost_email: "kosir.irena@siol.net", gost_telefon: "+386 41 333 444", stevilo_oseb: 2, datum_od: "2025-06-01", datum_do: "2025-06-05", opombe: "Zanima naju wellness paket z zeliščnimi kopelmi.", status: "zakljucena", ustvarjeno: "2025-01-10", posodobljeno: "2025-06-06" },
  { id: "rez-07-02", kmetija_id: "km-07", gost_ime: "Sara Oman", gost_email: "sara.oman@gmail.com", gost_telefon: null, stevilo_oseb: 1, datum_od: "2025-09-10", datum_do: "2025-09-14", opombe: "Terapevtsko jahanje — ali je primerno za popolne začetnike?", status: "cakanje", ustvarjeno: "2025-04-04", posodobljeno: "2025-04-04" },

  // ── Sadjarski vrt Kobal (km-08) ──
  { id: "rez-08-01", kmetija_id: "km-08", gost_ime: "Alenka Bizjak", gost_email: "alenka.b@gmail.com", gost_telefon: "+386 40 999 000", stevilo_oseb: 8, datum_od: "2025-10-05", datum_do: "2025-10-05", opombe: "Skupina 8 prijateljic — želimo vodeni ogled sadovnjaka in pokušnjo sokov.", status: "potrjena", ustvarjeno: "2025-03-20", posodobljeno: "2025-03-22" },

  // ── Kmetija Logar (km-09) ──
  { id: "rez-09-01", kmetija_id: "km-09", gost_ime: "Thomas Müller", gost_email: "thomas.m@web.de", gost_telefon: "+49 170 1234567", stevilo_oseb: 2, datum_od: "2025-07-01", datum_do: "2025-07-07", opombe: "We are from Germany. Do you speak English? We would love to hike to Okrešelj.", status: "potrjena", ustvarjeno: "2025-02-05", posodobljeno: "2025-02-07" },
  { id: "rez-09-02", kmetija_id: "km-09", gost_ime: "Družina Novak", gost_email: "novak.peter@gmail.com", gost_telefon: "+386 31 555 666", stevilo_oseb: 4, datum_od: "2025-08-10", datum_do: "2025-08-15", opombe: "2 otroka (3 in 6 let). Ali imate otroško posteljo?", status: "preklicana", ustvarjeno: "2025-03-10", posodobljeno: "2025-04-01" },

  // ── Ranč na Pohorju (km-10) ──
  { id: "rez-10-01", kmetija_id: "km-10", gost_ime: "Žan Potočnik", gost_email: "zan.potocnik@gmail.com", gost_telefon: "+386 41 888 999", stevilo_oseb: 3, datum_od: "2025-06-15", datum_do: "2025-06-17", opombe: "Zanima nas vikend jahanje — imam 10 let izkušenj. Partnerica je začetnica.", status: "potrjena", ustvarjeno: "2025-02-20", posodobljeno: "2025-02-22" },
  { id: "rez-10-02", kmetija_id: "km-10", gost_ime: "Podjetje Vizija d.o.o.", gost_email: "hr@vizija.si", gost_telefon: "+386 2 620 4000", stevilo_oseb: 15, datum_od: "2025-09-19", datum_do: "2025-09-20", opombe: "Teambuilding za 15 oseb. Želimo jahanje + izlet s konjsko vprego + bungalove.", status: "cakanje", ustvarjeno: "2025-04-05", posodobljeno: "2025-04-05" },
];

// ─── Helper: Kmetije z doživetji ────────────────────────────────────────────

export function pridobiMockKmetijeSDozivetji(): KmetijaSDozivetji[] {
  return MOCK_KMETIJE.map((kmetija) => {
    const dozivetjeIds = MOCK_KMETIJA_DOZIVETJE
      .filter((kd) => kd.kmetija_id === kmetija.id)
      .map((kd) => kd.dozivetje_id);

    const dozivetja = MOCK_DOZIVETJA.filter((d) =>
      dozivetjeIds.includes(d.id)
    );

    return { ...kmetija, dozivetja };
  });
}

/** Pridobi kmetijo po slug-u z vsemi relacijami */
export function pridobiMockKmetijo(slug: string) {
  const kmetija = MOCK_KMETIJE.find((k) => k.slug === slug);
  if (!kmetija) return null;

  const dozivetjeIds = MOCK_KMETIJA_DOZIVETJE
    .filter((kd) => kd.kmetija_id === kmetija.id)
    .map((kd) => kd.dozivetje_id);

  const dozivetja = MOCK_DOZIVETJA.filter((d) => dozivetjeIds.includes(d.id));
  const mnenja = MOCK_MNENJA.filter((m) => m.kmetija_id === kmetija.id);
  const izdelki = MOCK_IZDELKI.filter((i) => i.kmetija_id === kmetija.id);

  return { ...kmetija, dozivetja, mnenja, izdelki };
}

/** Pridobi izdelke za kmetijo */
export function pridobiMockIzdelke(kmetijaId: string) {
  return MOCK_IZDELKI.filter((i) => i.kmetija_id === kmetijaId);
}

/** Pridobi rezervacije za kmetijo */
export function pridobiMockRezervacije(kmetijaId: string) {
  return MOCK_REZERVACIJE.filter((r) => r.kmetija_id === kmetijaId);
}

/** Pridobi vse rezervacije po statusu */
export function pridobiMockRezervacijePoStatusu(status: Rezervacija["status"]) {
  return MOCK_REZERVACIJE.filter((r) => r.status === status);
}
