-- =============================================================================
-- NaKmetiji.si — Seed Data (Polni nabor)
-- 10 doživetij, 10 kmetij, 50 izdelkov, mnenja in rezervacije
-- =============================================================================

-- ─── Doživetja (10 kategorij) ───────────────────────────────────────────────

INSERT INTO dozivetja (id, ime, slug, ikona, opis, vrstni_red) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Vino & Degustacija', 'vino', 'Wine', 'Vinarji, kleti in degustacije lokalnih sort', 1),
  ('d0000002-0000-0000-0000-000000000002', 'Prenočišče', 'prenocisce', 'BedDouble', 'Sobe, apartmaji in glamping na kmetiji', 2),
  ('d0000003-0000-0000-0000-000000000003', 'Za družine', 'druzine', 'Users', 'Aktivnosti za otroke in celo družino', 3),
  ('d0000004-0000-0000-0000-000000000004', 'Kulinarika', 'kulinarika', 'ChefHat', 'Domača hrana, kuharski tečaji in degustacije', 4),
  ('d0000005-0000-0000-0000-000000000005', 'Wellness & Spa', 'wellness', 'Flower2', 'Savne, masaže in naravni wellness programi', 5),
  ('d0000006-0000-0000-0000-000000000006', 'Šport & Avantura', 'sport', 'Mountain', 'Pohodništvo, kolesarjenje, jahanje in več', 6),
  ('d0000007-0000-0000-0000-000000000007', 'Živali na kmetiji', 'zivali', 'Rabbit', 'Krmljenje živali, mini živalski vrt', 7),
  ('d0000008-0000-0000-0000-000000000008', 'Delavnice', 'delavnice', 'Hammer', 'Ustvarjalne in izobraževalne delavnice', 8),
  ('d0000009-0000-0000-0000-000000000009', 'Ekološka kmetija', 'ekologija', 'Leaf', 'Certificirane eko kmetije in trajnostno kmetovanje', 9),
  ('d0000010-0000-0000-0000-000000000010', 'Prireditve & Dogodki', 'prireditve', 'PartyPopper', 'Poroke, praznovanja in posebni dogodki', 10)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- KMETIJE (10 realističnih slovenskih kmetij)
-- =============================================================================

INSERT INTO kmetije (id, slug, ime, kratki_opis, opis, regija, naslov, obcina, postna_stevilka, lat, lng, naslovna_slika, slike, video_url, kontaktni_podatki, ocena, stevilo_ocen, premium) VALUES

-- 1. Kmetija pr' Janežu ──────────────────────────────────────────────────────
(
  'a1000001-0000-0000-0000-000000000001',
  'kmetija-pr-janezu',
  'Kmetija pr'' Janežu',
  'Gorenjska idila s pogledom na Julijske Alpe',
  'Družinska kmetija pod vznožjem Triglava, ki že pet generacij ponuja pristen stik z naravo. Naši gostje uživajo v svežem gorskem zraku, domačih dobrotah in nebeških razgledih na Julijske Alpe. Posebej smo ponosni na naš domači sir, ki ga izdelujemo po tradicionalni recepturi naše babice.',
  'gorenjska',
  'Zgornja Radovna 25',
  'Bled',
  '4260',
  46.3842, 13.9738,
  '/images/farms/pr-janezu.jpg',
  ARRAY['/images/farms/pr-janezu-1.jpg', '/images/farms/pr-janezu-2.jpg', '/images/farms/pr-janezu-3.jpg'],
  NULL,
  '{"telefon": "+386 4 572 33 00", "email": "info@prjanezu.si", "spletna_stran": "https://prjanezu.si"}'::jsonb,
  4.8, 47, TRUE
),

-- 2. Vinska klet Šteyer ──────────────────────────────────────────────────────
(
  'a1000002-0000-0000-0000-000000000002',
  'vinska-klet-steyer',
  'Vinska klet Šteyer',
  'Vrhunska vina iz srca Štajerske',
  'Na sončnih gričih Slovenskih goric ležijo naši vinogradi, ki jih obdelujemo že od leta 1892. Ponujamo degustacije vrhunskih vin — od aromatičnega laškega rizlinga do polnega šipona. Ob kozarcu vina vas čaka razgled, ki seže vse do Avstrije.',
  'stajerska',
  'Škalce 15',
  'Lenart v Slovenskih goricah',
  '2230',
  46.5722, 15.8294,
  '/images/farms/steyer.jpg',
  ARRAY['/images/farms/steyer-1.jpg', '/images/farms/steyer-2.jpg'],
  NULL,
  '{"telefon": "+386 2 729 55 10", "email": "vino@steyer.si", "instagram": "steyer_wines"}'::jsonb,
  4.9, 83, TRUE
),

-- 3. Eko kmetija Zlatorog ────────────────────────────────────────────────────
(
  'a1000003-0000-0000-0000-000000000003',
  'eko-kmetija-zlatorog',
  'Eko kmetija Zlatorog',
  'Ekološko kmetovanje v Bohinju',
  'Certificirana ekološka kmetija ob Bohinjskem jezeru. Pridelujemo ekološko zelenjavo, sadimo stare avtohtone sorte jabolk in redimo Drežniške koze. Naše mlečne izdelke pripravljamo ročno, brez konzervansov, z ljubeznijo do narave in tradicije.',
  'gorenjska',
  'Stara Fužina 88',
  'Bohinj',
  '4265',
  46.2919, 13.8653,
  '/images/farms/zlatorog.jpg',
  ARRAY['/images/farms/zlatorog-1.jpg', '/images/farms/zlatorog-2.jpg', '/images/farms/zlatorog-3.jpg', '/images/farms/zlatorog-4.jpg'],
  NULL,
  '{"telefon": "+386 4 572 10 80", "email": "info@zlatorog-eko.si"}'::jsonb,
  4.6, 34, FALSE
),

-- 4. Turistična kmetija Klinec ───────────────────────────────────────────────
(
  'a1000004-0000-0000-0000-000000000004',
  'turisticna-kmetija-klinec',
  'Turistična kmetija Klinec',
  'Kraška kulinarika z dušo',
  'Na robu Krasa vas pričakujejo osmice, pršut, teran in neponovljiva kraška gostoljubnost. Naša kmetija je znana po sušenem mesu, ki ga pripravljamo v tradicionalni kraški sušilnici — burji. Ponujamo tudi prenočišča v renovirani kraški hiši iz 18. stoletja.',
  'primorska',
  'Tomaj 36',
  'Sežana',
  '6221',
  45.7163, 13.8542,
  '/images/farms/klinec.jpg',
  ARRAY['/images/farms/klinec-1.jpg', '/images/farms/klinec-2.jpg'],
  NULL,
  '{"telefon": "+386 5 764 02 00", "email": "osmica@klinec.si", "facebook": "KmetijKlinec"}'::jsonb,
  4.7, 62, TRUE
),

-- 5. Kmetija Bregar ──────────────────────────────────────────────────────────
(
  'a1000005-0000-0000-0000-000000000005',
  'kmetija-bregar',
  'Kmetija Bregar',
  'Prleška domačija z gostilno',
  'Na ovinkih Prlekije stoji naša kmetija, ki danes deluje kot kmečka gostilna z nastanitvami. Ponujamo tradicionalne prlške jedi — bujto repo, žgance, domačo potico — ob spremljavi naših vin. Idealno izhodišče za pohodništvo in kolesarjenje po vinskih cestah.',
  'pomurska',
  'Kog 22a',
  'Ormož',
  '2270',
  46.3967, 16.1342,
  '/images/farms/bregar.jpg',
  ARRAY['/images/farms/bregar-1.jpg', '/images/farms/bregar-2.jpg', '/images/farms/bregar-3.jpg'],
  NULL,
  '{"telefon": "+386 2 741 00 55", "email": "gostilna@bregar.si"}'::jsonb,
  4.5, 29, FALSE
),

-- 6. Čebelarska kmetija Ambrožič ─────────────────────────────────────────────
(
  'a1000006-0000-0000-0000-000000000006',
  'cebelarska-kmetija-ambrozic',
  'Čebelarska kmetija Ambrožič',
  'Sladki svet kranjskega medu',
  'Smo tretja generacija čebelarjev na Kranjskem. Naših 120 panjev med cvetočimi travniki Sorške ravni proizvede vrhunski lipov, akacijev in gozdni med. Ponujamo oglede čebelnjaka, delavnice o apiterapiji in degustacije medenih izdelkov.',
  'gorenjska',
  'Naklo 44',
  'Naklo',
  '4202',
  46.3373, 14.3175,
  '/images/farms/ambrozic.jpg',
  ARRAY['/images/farms/ambrozic-1.jpg', '/images/farms/ambrozic-2.jpg'],
  NULL,
  '{"telefon": "+386 4 277 60 00", "email": "med@ambrozic.si", "instagram": "ambrozic_med"}'::jsonb,
  4.4, 18, FALSE
),

-- 7. Kmetija pri Mariji ──────────────────────────────────────────────────────
(
  'a1000007-0000-0000-0000-000000000007',
  'kmetija-pri-mariji',
  'Kmetija pri Mariji',
  'Dolenjske toplice za dušo in telo',
  'V zavetju dolenjskih gozdov in termalnih virov vas čaka sprostitev za telo in duho. Naše prenočitvene kapacitete zajemajo prenovljeno kašno domačijo s 6 sobami in wellness programom na bazi naravnih zeliščnih kopeli. Ponujamo tudi terapevtsko jahanje.',
  'dolenjska',
  'Podturn 7',
  'Dolenjske Toplice',
  '8350',
  45.7553, 15.0581,
  '/images/farms/pri-mariji.jpg',
  ARRAY['/images/farms/pri-mariji-1.jpg', '/images/farms/pri-mariji-2.jpg', '/images/farms/pri-mariji-3.jpg'],
  NULL,
  '{"telefon": "+386 7 384 50 00", "email": "info@pri-mariji.si", "spletna_stran": "https://pri-mariji.si"}'::jsonb,
  4.7, 41, TRUE
),

-- 8. Sadjarski vrt Kobal ─────────────────────────────────────────────────────
(
  'a1000008-0000-0000-0000-000000000008',
  'sadjarski-vrt-kobal',
  'Sadjarski vrt Kobal',
  'Stare sorte jabolk in hrušk v Vipavski dolini',
  'V sončni Vipavski dolini ohranjamo 45 starih avtohtonih sort jabolk in hrušk. Naš sadovnjak je živi muzej biodiverzitete, ki ga obiskovalci lahko raziščejo ob vodenih ogledih. Ponosni smo na naš jabolčnik in domače sokove brez dodanega sladkorja.',
  'primorska',
  'Slap 15',
  'Vipava',
  '5271',
  45.8467, 13.9633,
  '/images/farms/kobal.jpg',
  ARRAY['/images/farms/kobal-1.jpg', '/images/farms/kobal-2.jpg'],
  NULL,
  '{"telefon": "+386 5 368 70 00", "email": "sadje@kobal.si"}'::jsonb,
  4.3, 22, FALSE
),

-- 9. Kmetija Logar ───────────────────────────────────────────────────────────
(
  'a1000009-0000-0000-0000-000000000009',
  'kmetija-logar',
  'Kmetija Logar',
  'Savinjski sir in alpski zrak',
  'V prelepi Logarski dolini, eni najlepših alpskih dolin v Evropi, stoji naša kmetija. Ponujamo nastanitve z zajtrkom iz lastnih pridelkov — sir, maslo, med, domač kruh. Okolica je raj za pohodnike; od tu vodijo poti do Okrešlja in Ojstrice.',
  'savinjska',
  'Logarska dolina 11',
  'Solčava',
  '3335',
  46.3932, 14.6342,
  '/images/farms/logar.jpg',
  ARRAY['/images/farms/logar-1.jpg', '/images/farms/logar-2.jpg', '/images/farms/logar-3.jpg'],
  NULL,
  '{"telefon": "+386 3 838 90 00", "email": "kmetija@logar.si", "spletna_stran": "https://kmetija-logar.si"}'::jsonb,
  4.9, 91, TRUE
),

-- 10. Ranč na Pohorju ────────────────────────────────────────────────────────
(
  'a1000010-0000-0000-0000-000000000010',
  'ranc-na-pohorju',
  'Ranč na Pohorju',
  'Konji, narava in pohorski gozdovi',
  'Na pobočjih Pohorja vodimo ranč s 14 konji za terapevtsko in rekreativno jahanje. Poleg jahanja ponujamo izlete s konjsko vprego, teambuilding programe ter prenočišča v lesenih bungalovih sredi gozda. Poleti organiziramo tudi konjeniške tabore za otroke.',
  'stajerska',
  'Rogla 5',
  'Zreče',
  '3214',
  46.4517, 15.3958,
  '/images/farms/ranc-pohorje.jpg',
  ARRAY['/images/farms/ranc-pohorje-1.jpg', '/images/farms/ranc-pohorje-2.jpg'],
  NULL,
  '{"telefon": "+386 3 757 22 00", "email": "info@ranc-pohorje.si", "instagram": "ranc_pohorje"}'::jsonb,
  4.6, 55, FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- POVEZAVE KMETIJA ↔ DOŽIVETJE
-- =============================================================================

-- Kmetija pr' Janežu → prenočišče, kulinarika, družine, živali, ekologija
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'd0000002-0000-0000-0000-000000000002'),
  ('a1000001-0000-0000-0000-000000000001', 'd0000004-0000-0000-0000-000000000004'),
  ('a1000001-0000-0000-0000-000000000001', 'd0000003-0000-0000-0000-000000000003'),
  ('a1000001-0000-0000-0000-000000000001', 'd0000007-0000-0000-0000-000000000007'),
  ('a1000001-0000-0000-0000-000000000001', 'd0000009-0000-0000-0000-000000000009')
ON CONFLICT DO NOTHING;

-- Vinska klet Šteyer → vino, kulinarika, prireditve
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000002-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('a1000002-0000-0000-0000-000000000002', 'd0000004-0000-0000-0000-000000000004'),
  ('a1000002-0000-0000-0000-000000000002', 'd0000010-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- Eko kmetija Zlatorog → ekologija, živali, družine, delavnice
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000003-0000-0000-0000-000000000003', 'd0000009-0000-0000-0000-000000000009'),
  ('a1000003-0000-0000-0000-000000000003', 'd0000007-0000-0000-0000-000000000007'),
  ('a1000003-0000-0000-0000-000000000003', 'd0000003-0000-0000-0000-000000000003'),
  ('a1000003-0000-0000-0000-000000000003', 'd0000008-0000-0000-0000-000000000008')
ON CONFLICT DO NOTHING;

-- Turistična kmetija Klinec → kulinarika, vino, prenočišče, prireditve
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000004-0000-0000-0000-000000000004', 'd0000004-0000-0000-0000-000000000004'),
  ('a1000004-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001'),
  ('a1000004-0000-0000-0000-000000000004', 'd0000002-0000-0000-0000-000000000002'),
  ('a1000004-0000-0000-0000-000000000004', 'd0000010-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- Kmetija Bregar → kulinarika, vino, prenočišče, šport
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000005-0000-0000-0000-000000000005', 'd0000004-0000-0000-0000-000000000004'),
  ('a1000005-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001'),
  ('a1000005-0000-0000-0000-000000000005', 'd0000002-0000-0000-0000-000000000002'),
  ('a1000005-0000-0000-0000-000000000005', 'd0000006-0000-0000-0000-000000000006')
ON CONFLICT DO NOTHING;

-- Čebelarska kmetija Ambrožič → ekologija, delavnice, družine
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000006-0000-0000-0000-000000000006', 'd0000009-0000-0000-0000-000000000009'),
  ('a1000006-0000-0000-0000-000000000006', 'd0000008-0000-0000-0000-000000000008'),
  ('a1000006-0000-0000-0000-000000000006', 'd0000003-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Kmetija pri Mariji → prenočišče, wellness, živali, družine
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000007-0000-0000-0000-000000000007', 'd0000002-0000-0000-0000-000000000002'),
  ('a1000007-0000-0000-0000-000000000007', 'd0000005-0000-0000-0000-000000000005'),
  ('a1000007-0000-0000-0000-000000000007', 'd0000007-0000-0000-0000-000000000007'),
  ('a1000007-0000-0000-0000-000000000007', 'd0000003-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Sadjarski vrt Kobal → ekologija, delavnice, družine
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000008-0000-0000-0000-000000000008', 'd0000009-0000-0000-0000-000000000009'),
  ('a1000008-0000-0000-0000-000000000008', 'd0000008-0000-0000-0000-000000000008'),
  ('a1000008-0000-0000-0000-000000000008', 'd0000003-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Kmetija Logar → prenočišče, kulinarika, šport, živali, ekologija
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000009-0000-0000-0000-000000000009', 'd0000002-0000-0000-0000-000000000002'),
  ('a1000009-0000-0000-0000-000000000009', 'd0000004-0000-0000-0000-000000000004'),
  ('a1000009-0000-0000-0000-000000000009', 'd0000006-0000-0000-0000-000000000006'),
  ('a1000009-0000-0000-0000-000000000009', 'd0000007-0000-0000-0000-000000000007'),
  ('a1000009-0000-0000-0000-000000000009', 'd0000009-0000-0000-0000-000000000009')
ON CONFLICT DO NOTHING;

-- Ranč na Pohorju → šport, živali, družine, prenočišče, prireditve
INSERT INTO kmetija_dozivetje (kmetija_id, dozivetje_id) VALUES
  ('a1000010-0000-0000-0000-000000000010', 'd0000006-0000-0000-0000-000000000006'),
  ('a1000010-0000-0000-0000-000000000010', 'd0000007-0000-0000-0000-000000000007'),
  ('a1000010-0000-0000-0000-000000000010', 'd0000003-0000-0000-0000-000000000003'),
  ('a1000010-0000-0000-0000-000000000010', 'd0000002-0000-0000-0000-000000000002'),
  ('a1000010-0000-0000-0000-000000000010', 'd0000010-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- IZDELKI (50 — 5 na kmetijo)
-- =============================================================================

-- ── Kmetija pr' Janežu (a1000001) ───────────────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Bohinjski sir', 'Trdi sir, zorjen 6 mesecev v gorski kleti', 'mlecni_izdelki', 18.50, 'kg', 25, TRUE, '/images/products/bohinjski-sir.jpg'),
  ('a1000001-0000-0000-0000-000000000001', 'Gorenjski med', 'Lipov med iz lastnega čebelnjaka', 'med_cebelji_izdelki', 12.00, 'kozarec (450g)', 40, TRUE, '/images/products/gorenjski-med.jpg'),
  ('a1000001-0000-0000-0000-000000000001', 'Domače maslo', 'Sveže mešano maslo iz alpske smetane', 'mlecni_izdelki', 5.80, 'kos (250g)', 15, TRUE, NULL),
  ('a1000001-0000-0000-0000-000000000001', 'Ajdov kruh', 'Pečen v krušni peči na drva', 'pekovski_izdelki', 4.50, 'kos', 8, TRUE, NULL),
  ('a1000001-0000-0000-0000-000000000001', 'Jabolčni sok', '100% naravni sok brez dodanega sladkorja', 'sadje_zelenjava', 6.00, 'liter', 50, TRUE, '/images/products/jabolcni-sok.jpg')
ON CONFLICT DO NOTHING;

-- ── Vinska klet Šteyer (a1000002) ───────────────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000002-0000-0000-0000-000000000002', 'Laški rizling 2022', 'Suho belo vino, sveže in aromatično', 'vino_pijace', 14.90, 'steklenica (0,75l)', 120, TRUE, '/images/products/laski-rizling.jpg'),
  ('a1000002-0000-0000-0000-000000000002', 'Šipon 2021', 'Polno belo vino z oreščki in medom', 'vino_pijace', 16.50, 'steklenica (0,75l)', 85, TRUE, '/images/products/sipon.jpg'),
  ('a1000002-0000-0000-0000-000000000002', 'Modra frankinja 2020', 'Rdeče vino, zorjeno v hrastovih sodih', 'vino_pijace', 19.00, 'steklenica (0,75l)', 60, TRUE, NULL),
  ('a1000002-0000-0000-0000-000000000002', 'Vinski kis', 'Naravni jabolčni kis, zorjen 2 leti', 'olja_kis', 8.50, 'steklenica (0,5l)', 30, TRUE, NULL),
  ('a1000002-0000-0000-0000-000000000002', 'Bučno olje', 'Hladno stiskano štajersko bučno olje', 'olja_kis', 22.00, 'steklenica (0,5l)', 45, TRUE, '/images/products/bucno-olje.jpg')
ON CONFLICT DO NOTHING;

-- ── Eko kmetija Zlatorog (a1000003) ─────────────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000003-0000-0000-0000-000000000003', 'Ekološke paradižnikove omake', 'Rezine eko paradižnikov s baziliko', 'sadje_zelenjava', 5.50, 'kozarec (330ml)', 60, TRUE, NULL),
  ('a1000003-0000-0000-0000-000000000003', 'Kozji sir', 'Sveži kozji sir iz Drežniških koz', 'mlecni_izdelki', 14.00, 'kos (200g)', 20, TRUE, '/images/products/kozji-sir.jpg'),
  ('a1000003-0000-0000-0000-000000000003', 'Ekološki jogurt', 'Naravni kozji jogurt brez dodatkov', 'mlecni_izdelki', 3.80, 'lonček (350ml)', 30, TRUE, NULL),
  ('a1000003-0000-0000-0000-000000000003', 'Suho sadje mešanica', 'Jabolka, hruške in slive — posušene na zraku', 'sadje_zelenjava', 9.00, 'vrečka (200g)', 35, TRUE, NULL),
  ('a1000003-0000-0000-0000-000000000003', 'Zeliščno milo', 'Ročno izdelano milo z lavando in kamilico', 'domaca_kosmerika', 7.00, 'kos (100g)', 50, TRUE, '/images/products/zeliscno-milo.jpg')
ON CONFLICT DO NOTHING;

-- ── Turistična kmetija Klinec (a1000004) ────────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000004-0000-0000-0000-000000000004', 'Kraški pršut', 'Sušen na burji, zorjen 18 mesecev', 'mesni_izdelki', 42.00, 'kg', 15, TRUE, '/images/products/kraski-prsut.jpg'),
  ('a1000004-0000-0000-0000-000000000004', 'Teran PTP 2022', 'Zaščiteno kraško rdeče vino', 'vino_pijace', 11.90, 'steklenica (0,75l)', 70, TRUE, '/images/products/teran.jpg'),
  ('a1000004-0000-0000-0000-000000000004', 'Panceta', 'Sušena svinjska trebušina po kraško', 'mesni_izdelki', 28.00, 'kg', 10, TRUE, NULL),
  ('a1000004-0000-0000-0000-000000000004', 'Oljčno olje', 'Ekstra deviško iz istrskih oljk', 'olja_kis', 18.00, 'steklenica (0,5l)', 25, TRUE, NULL),
  ('a1000004-0000-0000-0000-000000000004', 'Kraški med', 'Cvetlični med s kraških travnikov', 'med_cebelji_izdelki', 14.00, 'kozarec (450g)', 35, TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ── Kmetija Bregar (a1000005) ───────────────────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000005-0000-0000-0000-000000000005', 'Prlška gibanica', 'Tradicionalna prekmurska gibanica z 4 polnili', 'pekovski_izdelki', 22.00, 'kos (cca 2kg)', 5, TRUE, '/images/products/gibanica.jpg'),
  ('a1000005-0000-0000-0000-000000000005', 'Domača klobasa', 'Dimljena klobasa iz domačega prašiča', 'mesni_izdelki', 16.00, 'kg', 20, TRUE, NULL),
  ('a1000005-0000-0000-0000-000000000005', 'Štrapon penina', 'Peneče vino iz traminca', 'vino_pijace', 13.50, 'steklenica (0,75l)', 40, TRUE, NULL),
  ('a1000005-0000-0000-0000-000000000005', 'Domači žganje', 'Sadjevec iz domačih hrušk Viljamovk', 'vino_pijace', 25.00, 'steklenica (0,5l)', 15, TRUE, NULL),
  ('a1000005-0000-0000-0000-000000000005', 'Bučno olje ZGP', 'Zaščiteno geografsko poreklo, štajersko bučno olje', 'olja_kis', 24.00, 'steklenica (0,5l)', 30, TRUE, '/images/products/bucno-olje-zgp.jpg')
ON CONFLICT DO NOTHING;

-- ── Čebelarska kmetija Ambrožič (a1000006) ──────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000006-0000-0000-0000-000000000006', 'Lipov med', 'Aromatičen med z vonji lipe', 'med_cebelji_izdelki', 14.00, 'kozarec (450g)', 80, TRUE, '/images/products/lipov-med.jpg'),
  ('a1000006-0000-0000-0000-000000000006', 'Akacijev med', 'Nežno sladek, svetel in tekoč', 'med_cebelji_izdelki', 16.00, 'kozarec (450g)', 60, TRUE, NULL),
  ('a1000006-0000-0000-0000-000000000006', 'Propolis kapljice', 'Naravni propolisov izvleček za imunski sistem', 'med_cebelji_izdelki', 18.00, 'steklenička (30ml)', 45, TRUE, NULL),
  ('a1000006-0000-0000-0000-000000000006', 'Čebelji vosek sveče', 'Ročno valjane sveče iz naravnega voska', 'ostalo', 8.50, 'kos', 100, TRUE, '/images/products/svece.jpg'),
  ('a1000006-0000-0000-0000-000000000006', 'Medeni balzam za ustnice', 'Naravna kozmetika na osnovi čebeljega voska', 'domaca_kosmerika', 6.00, 'kos', 55, TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ── Kmetija pri Mariji (a1000007) ───────────────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000007-0000-0000-0000-000000000007', 'Zeliščni čaj mešanica', 'Mešanica mete, kamilice in šipka iz vrta', 'ostalo', 7.50, 'vrečka (80g)', 40, TRUE, NULL),
  ('a1000007-0000-0000-0000-000000000007', 'Lavandova kopel', 'Ročno pripravljena kopalna sol z lavando', 'domaca_kosmerika', 12.00, 'vrečka (300g)', 25, TRUE, '/images/products/lavandova-kopel.jpg'),
  ('a1000007-0000-0000-0000-000000000007', 'Domača marmelada', 'Jagodna marmelada iz lastnih nasadov', 'sadje_zelenjava', 5.50, 'kozarec (280g)', 35, TRUE, NULL),
  ('a1000007-0000-0000-0000-000000000007', 'Eterično olje mete', '100% naravno eterično olje', 'domaca_kosmerika', 15.00, 'steklenička (10ml)', 20, TRUE, NULL),
  ('a1000007-0000-0000-0000-000000000007', 'Gozdni med', 'Temni gozdni med, bogat z minerali', 'med_cebelji_izdelki', 13.00, 'kozarec (450g)', 30, TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ── Sadjarski vrt Kobal (a1000008) ──────────────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000008-0000-0000-0000-000000000008', 'Jabolčni sok Jonagold', 'Naraven sok iz sorte Jonagold, brez sladkorja', 'sadje_zelenjava', 5.50, 'liter', 80, TRUE, '/images/products/sok-jonagold.jpg'),
  ('a1000008-0000-0000-0000-000000000008', 'Hruškovec', 'Žganje iz Viljamovk, dvojno destilirano', 'vino_pijace', 28.00, 'steklenica (0,5l)', 20, TRUE, NULL),
  ('a1000008-0000-0000-0000-000000000008', 'Jabolčni kis', 'Naravno fermentiran, nepasteriziran', 'olja_kis', 7.00, 'steklenica (0,5l)', 40, TRUE, NULL),
  ('a1000008-0000-0000-0000-000000000008', 'Suhe jabolčne rezine', 'Posušene na soncu, brez konzervansov', 'sadje_zelenjava', 6.50, 'vrečka (150g)', 50, TRUE, NULL),
  ('a1000008-0000-0000-0000-000000000008', 'Jabolčna čežana', 'Tradicionalna gosta jabolčna kaša', 'sadje_zelenjava', 4.80, 'kozarec (350ml)', 45, TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ── Kmetija Logar (a1000009) ────────────────────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000009-0000-0000-0000-000000000009', 'Solčavski sir', 'Poltrdi sir iz polnomastnega mleka', 'mlecni_izdelki', 20.00, 'kg', 18, TRUE, '/images/products/solcavski-sir.jpg'),
  ('a1000009-0000-0000-0000-000000000009', 'Domače maslo', 'Sveže maslo iz planšarije', 'mlecni_izdelki', 6.00, 'kos (250g)', 12, TRUE, NULL),
  ('a1000009-0000-0000-0000-000000000009', 'Planšarski jogurt', 'Gosti jogurt z gozdnimi sadeži', 'mlecni_izdelki', 3.50, 'lonček (350ml)', 20, TRUE, NULL),
  ('a1000009-0000-0000-0000-000000000009', 'Kruh iz krušne peči', 'Mešan kruh, pečen na tradicionalen način', 'pekovski_izdelki', 5.00, 'kos', 6, TRUE, NULL),
  ('a1000009-0000-0000-0000-000000000009', 'Smrekova žganje', 'Liker iz mladih smrekovih vršičkov', 'vino_pijace', 18.00, 'steklenica (0,35l)', 30, TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ── Ranč na Pohorju (a1000010) ──────────────────────────────────────────────
INSERT INTO izdelki (kmetija_id, ime, opis, kategorija, cena, enota, zaloga, na_voljo, slika_url) VALUES
  ('a1000010-0000-0000-0000-000000000010', 'Pohorski med', 'Gozdni med iz pohorskih smrekovih gozdov', 'med_cebelji_izdelki', 15.00, 'kozarec (450g)', 35, TRUE, '/images/products/pohorski-med.jpg'),
  ('a1000010-0000-0000-0000-000000000010', 'Konjski balzam', 'Hladilni gel na osnovi konjskega kostanja', 'domaca_kosmerika', 10.00, 'tuba (200ml)', 25, TRUE, NULL),
  ('a1000010-0000-0000-0000-000000000010', 'Suha salama', 'Tradicionalna suha salama, dimljena na bukvi', 'mesni_izdelki', 24.00, 'kg', 12, TRUE, NULL),
  ('a1000010-0000-0000-0000-000000000010', 'Borovničeva marmelada', 'Gozdne borovnice, pobrane na Pohorju', 'sadje_zelenjava', 6.50, 'kozarec (280g)', 40, TRUE, NULL),
  ('a1000010-0000-0000-0000-000000000010', 'Ajdovi žganci mix', 'Pripravljena mešanica za domače žgance', 'pekovski_izdelki', 4.00, 'vrečka (500g)', 55, TRUE, NULL)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- MNENJA (10 testnih, po 1 za vsako kmetijo)
-- =============================================================================

INSERT INTO mnenja (kmetija_id, uporabnik_ime, uporabnik_email, ocena, komentar, odobreno) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Ana Kovač', 'ana.kovac@test.si', 5, 'Čudovit razgled in najboljši sir, kar sem ga kdaj jedla! Otroci so bili navdušeni nad živalmi.', TRUE),
  ('a1000001-0000-0000-0000-000000000001', 'Marko Zupan', 'marko.zupan@test.si', 5, 'Izjemna kmetija. Gostoljubna družina, čudovita narava. Se bomo zagotovo vrnili!', TRUE),
  ('a1000002-0000-0000-0000-000000000002', 'Petra Novak', 'petra.novak@test.si', 5, 'Najboljša vinska degustacija v Sloveniji! Šipon je fantastičen.', TRUE),
  ('a1000004-0000-0000-0000-000000000004', 'Luka Horvat', 'luka.horvat@test.si', 5, 'Pršut se topi na jeziku! Osmica s pogledom... noro.', TRUE),
  ('a1000007-0000-0000-0000-000000000007', 'Maja Kranjc', 'maja.kranjc@test.si', 5, 'Wellness na kmetiji — kdo bi si mislil, da je to mogoče! Popolnoma sproščena.', TRUE),
  ('a1000009-0000-0000-0000-000000000009', 'Tomaž Vidmar', 'tomaz.vidmar@test.si', 5, 'Logarska dolina je eno najlepših mest, kar sem jih videl. Kmetija Logar je biser.', TRUE),
  ('a1000009-0000-0000-0000-000000000009', 'Nina Šuštar', 'nina.sustar@test.si', 5, 'Zajtrk iz lastnih pridelkov! Sir, kruh, marmelada — vse sveže in domače.', TRUE),
  ('a1000010-0000-0000-0000-000000000010', 'Žan Potočnik', 'zan.potocnik@test.si', 4, 'Super jahanje v gozdovih! Edino treba vnaprej rezervirat ker je veliko povpraševanje.', TRUE),
  ('a1000003-0000-0000-0000-000000000003', 'Eva Medved', 'eva.medved@test.si', 5, 'Kozji sir iz eko kmetije je res nekaj posebnega. Čudovita izkušnja za otroke.', TRUE),
  ('a1000006-0000-0000-0000-000000000006', 'Rok Petrič', 'rok.petric@test.si', 4, 'Zelo zanimiva delavnica o apiterapiji. Med je vrhunski, priporočam lipovega.', TRUE)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- REZERVACIJE (18 testnih)
-- =============================================================================

INSERT INTO rezervacije (kmetija_id, gost_ime, gost_email, gost_telefon, stevilo_oseb, datum_od, datum_do, opombe, status) VALUES
  -- Kmetija pr' Janežu
  ('a1000001-0000-0000-0000-000000000001', 'Družina Kovač', 'ana.kovac@gmail.com', '+386 41 555 100', 4, '2025-07-10', '2025-07-14', 'Dva otroka (5 in 8 let), prosim sobo s pogledom na gore.', 'potrjena'),
  ('a1000001-0000-0000-0000-000000000001', 'Peter Zore', 'peter.zore@yahoo.com', NULL, 2, '2025-08-01', '2025-08-03', NULL, 'cakanje'),

  -- Vinska klet Šteyer
  ('a1000002-0000-0000-0000-000000000002', 'Maja in Tomaž Vidmar', 'vidmar.maja@gmail.com', '+386 31 222 333', 6, '2025-06-20', '2025-06-21', 'Degustacija za 6 oseb, skupina prijateljev. Vegetarijanska opcija za 2.', 'potrjena'),

  -- Eko kmetija Zlatorog
  ('a1000003-0000-0000-0000-000000000003', 'Eva Medved', 'eva.medved@outlook.com', '+386 40 111 222', 3, '2025-05-15', '2025-05-18', 'Zanima nas delavnica izdelave sira.', 'zakljucena'),
  ('a1000003-0000-0000-0000-000000000003', 'Rok Petrič', 'rok.petric@gmail.com', NULL, 2, '2025-09-01', '2025-09-04', NULL, 'cakanje'),

  -- Turistična kmetija Klinec
  ('a1000004-0000-0000-0000-000000000004', 'Luka Horvat', 'luka.horvat@proton.me', '+386 51 444 555', 2, '2025-06-05', '2025-06-07', 'Ali je mogoča zasebna osmica za dva?', 'potrjena'),
  ('a1000004-0000-0000-0000-000000000004', 'Skupina Triglav d.o.o.', 'events@triglav.si', '+386 1 234 5678', 12, '2025-10-10', '2025-10-11', 'Teambuilding za 12 zaposlenih. Potrebujemo račun na firmo.', 'zavrnjena'),

  -- Kmetija Bregar
  ('a1000005-0000-0000-0000-000000000005', 'Neža Kralj', 'neza.kralj@gmail.com', '+386 30 777 888', 5, '2025-07-20', '2025-07-23', 'Družina s 3 otroki. Zanima nas kolesarjenje po vinskih cestah.', 'potrjena'),

  -- Čebelarska kmetija Ambrožič
  ('a1000006-0000-0000-0000-000000000006', 'OŠ Naklo - 4.a razred', 'uciteljica.nina@os-naklo.si', '+386 4 277 60 10', 25, '2025-05-22', '2025-05-22', 'Šolska ekskurzija, 23 učencev + 2 spremljevalki.', 'potrjena'),
  ('a1000006-0000-0000-0000-000000000006', 'Martin Šiftar', 'martin.siftar@gmail.com', NULL, 1, '2025-08-15', '2025-08-15', 'Zanima me apiterapija. Ali ponujate individualne termine?', 'cakanje'),

  -- Kmetija pri Mariji
  ('a1000007-0000-0000-0000-000000000007', 'Irena in Jože Košir', 'kosir.irena@siol.net', '+386 41 333 444', 2, '2025-06-01', '2025-06-05', 'Zanima naju wellness paket z zeliščnimi kopelmi.', 'zakljucena'),
  ('a1000007-0000-0000-0000-000000000007', 'Sara Oman', 'sara.oman@gmail.com', NULL, 1, '2025-09-10', '2025-09-14', 'Terapevtsko jahanje — ali je primerno za popolne začetnike?', 'cakanje'),

  -- Sadjarski vrt Kobal
  ('a1000008-0000-0000-0000-000000000008', 'Alenka Bizjak', 'alenka.b@gmail.com', '+386 40 999 000', 8, '2025-10-05', '2025-10-05', 'Skupina 8 prijateljic — želimo vodeni ogled sadovnjaka in pokušnjo sokov.', 'potrjena'),

  -- Kmetija Logar
  ('a1000009-0000-0000-0000-000000000009', 'Thomas Müller', 'thomas.m@web.de', '+49 170 1234567', 2, '2025-07-01', '2025-07-07', 'We are from Germany. Do you speak English? We would love to hike to Okrešelj.', 'potrjena'),
  ('a1000009-0000-0000-0000-000000000009', 'Družina Novak', 'novak.peter@gmail.com', '+386 31 555 666', 4, '2025-08-10', '2025-08-15', '2 otroka (3 in 6 let). Ali imate otroško posteljo?', 'preklicana'),

  -- Ranč na Pohorju
  ('a1000010-0000-0000-0000-000000000010', 'Žan Potočnik', 'zan.potocnik@gmail.com', '+386 41 888 999', 3, '2025-06-15', '2025-06-17', 'Zanima nas vikend jahanje — imam 10 let izkušenj. Partnerica je začetnica.', 'potrjena'),
  ('a1000010-0000-0000-0000-000000000010', 'Podjetje Vizija d.o.o.', 'hr@vizija.si', '+386 2 620 4000', 15, '2025-09-19', '2025-09-20', 'Teambuilding za 15 oseb. Želimo jahanje + izlet s konjsko vprego + bungalove.', 'cakanje')
ON CONFLICT DO NOTHING;
