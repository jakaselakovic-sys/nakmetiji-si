-- =============================================================================
-- NaKmetiji.si — Schema v2
-- Poženi v Supabase SQL Editor
-- =============================================================================

-- ─── Razširitve ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ─── Profili (razširitev auth.users) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profili (
  id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vloga   TEXT NOT NULL DEFAULT 'gost' CHECK (vloga IN ('super_admin', 'lastnik', 'gost')),
  ime     TEXT,
  email   TEXT NOT NULL,
  ustvarjen TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.ustvari_profil()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profili (id, email, vloga)
  VALUES (NEW.id, NEW.email, 'gost')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ob_registraciji ON auth.users;
CREATE TRIGGER ob_registraciji
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ustvari_profil();

-- ─── Kmetije ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kmetije (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lastnik_id       UUID REFERENCES public.profili(id),
  slug             TEXT UNIQUE NOT NULL,
  ime              TEXT NOT NULL,
  kratki_opis      TEXT,
  opis             TEXT,
  regija           TEXT,
  naslov           TEXT,
  obcina           TEXT,
  postna_stevilka  TEXT,
  lat              NUMERIC(9,6),
  lng              NUMERIC(9,6),
  naslovna_slika   TEXT,
  slike            TEXT[] DEFAULT '{}',
  kontaktni_podatki JSONB DEFAULT '{}',
  amenitete        TEXT[] DEFAULT '{}',
  max_gostov       INTEGER DEFAULT 10,
  cena_noc         NUMERIC(10,2) DEFAULT 0,
  ocena            NUMERIC(3,2),
  stevilo_ocen     INTEGER DEFAULT 0,
  premium          BOOLEAN DEFAULT FALSE,
  aktivna          BOOLEAN DEFAULT TRUE,
  ical_uvoz_url    TEXT,
  ical_izvoz_uuid  UUID DEFAULT gen_random_uuid(),
  ustvarjeno       TIMESTAMPTZ DEFAULT NOW(),
  posodobljeno     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Dozivetja ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dozivetja (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ime         TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  ikona       TEXT,
  opis        TEXT,
  vrstni_red  INTEGER DEFAULT 0,
  ustvarjeno  TIMESTAMPTZ DEFAULT NOW(),
  posodobljeno TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kmetija_dozivetje (
  kmetija_id  UUID REFERENCES public.kmetije(id) ON DELETE CASCADE,
  dozivetje_id UUID REFERENCES public.dozivetja(id) ON DELETE CASCADE,
  PRIMARY KEY (kmetija_id, dozivetje_id)
);

-- ─── Mnenja (z moderacijo) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mnenja (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmetija_id       UUID NOT NULL REFERENCES public.kmetije(id) ON DELETE CASCADE,
  uporabnik_id     UUID REFERENCES public.profili(id),
  uporabnik_ime    TEXT NOT NULL,
  uporabnik_email  TEXT,
  ocena            INTEGER NOT NULL CHECK (ocena BETWEEN 1 AND 5),
  komentar         TEXT,
  status           TEXT NOT NULL DEFAULT 'cakanje' CHECK (status IN ('cakanje', 'odobreno', 'zavrnjeno')),
  datum            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Rezervacije (z overlap prevention) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rezervacije (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmetija_id      UUID NOT NULL REFERENCES public.kmetije(id) ON DELETE CASCADE,
  gost_id         UUID REFERENCES public.profili(id),
  gost_ime        TEXT NOT NULL,
  gost_email      TEXT NOT NULL,
  gost_telefon    TEXT,
  stevilo_oseb    INTEGER NOT NULL CHECK (stevilo_oseb > 0),
  datum_od        DATE NOT NULL,
  datum_do        DATE NOT NULL,
  skupaj_cena     NUMERIC(10,2),
  opombe          TEXT,
  status          TEXT NOT NULL DEFAULT 'cakanje'
                  CHECK (status IN ('cakanje','potrjena','zavrnjena','preklicana','zakljucena')),
  ical_uid        TEXT,
  ustvarjeno      TIMESTAMPTZ DEFAULT NOW(),
  posodobljeno    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT datumi_veljavni CHECK (datum_do > datum_od),
  -- KRITIČNO: preprečuje prekrivanje datumov na nivoju baze
  CONSTRAINT brez_prekrivanja EXCLUDE USING GIST (
    kmetija_id WITH =,
    daterange(datum_od, datum_do, '[)') WITH &&
  ) WHERE (status IN ('cakanje', 'potrjena'))
);

-- ─── iCal blokade (Airbnb/Booking.com) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ical_blokade (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmetija_id  UUID NOT NULL REFERENCES public.kmetije(id) ON DELETE CASCADE,
  datum_od    DATE NOT NULL,
  datum_do    DATE NOT NULL,
  vir         TEXT DEFAULT 'manual',
  ical_uid    TEXT,
  ustvarjena  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kmetija_id, ical_uid)
);

-- ─── Izdelki ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.izdelki (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmetija_id  UUID NOT NULL REFERENCES public.kmetije(id) ON DELETE CASCADE,
  ime         TEXT NOT NULL,
  opis        TEXT,
  cena        NUMERIC(10,2) NOT NULL,
  enota       TEXT DEFAULT 'kos',
  kategorija  TEXT,
  zaloga      INTEGER DEFAULT 0,
  na_voljo    BOOLEAN DEFAULT TRUE,
  slika_url   TEXT,
  ustvarjeno  TIMESTAMPTZ DEFAULT NOW(),
  posodobljeno TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.profili ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kmetije ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mnenja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rezervacije ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.izdelki ENABLE ROW LEVEL SECURITY;

-- Profili: vsak vidi samo sebe (admin vse)
CREATE POLICY "profil_lasten" ON public.profili FOR SELECT USING (id = auth.uid());
CREATE POLICY "profil_admin" ON public.profili FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
);

-- Kmetije: javne za branje, lastnik ureja svoje
CREATE POLICY "kmetije_javne" ON public.kmetije FOR SELECT USING (aktivna = TRUE);
CREATE POLICY "kmetije_lastnik_ureja" ON public.kmetije FOR ALL USING (lastnik_id = auth.uid());
CREATE POLICY "kmetije_admin" ON public.kmetije FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
);

-- Mnenja: javna samo odobrena, lastnik vidi svoja
CREATE POLICY "mnenja_odobrena" ON public.mnenja FOR SELECT USING (status = 'odobreno');
CREATE POLICY "mnenja_admin" ON public.mnenja FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
);

-- Rezervacije: gost vidi svoje, lastnik vidi rezervacije kmetije
CREATE POLICY "rezervacije_gost" ON public.rezervacije FOR SELECT USING (gost_id = auth.uid());
CREATE POLICY "rezervacije_lastnik" ON public.rezervacije FOR ALL USING (
  kmetija_id IN (SELECT id FROM public.kmetije WHERE lastnik_id = auth.uid())
);
CREATE POLICY "rezervacije_admin" ON public.rezervacije FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
);

-- ─── Aggregation funkcija za analitiko ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.analitika_kmetije(p_kmetija_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'skupaj_rezervacij', COUNT(*),
    'potrjene', COUNT(*) FILTER (WHERE status = 'potrjena'),
    'prihodki_skupaj', COALESCE(SUM(skupaj_cena) FILTER (WHERE status IN ('potrjena','zakljucena')), 0),
    'prihodki_ta_mesec', COALESCE(SUM(skupaj_cena) FILTER (
      WHERE status IN ('potrjena','zakljucena')
      AND date_trunc('month', ustvarjeno) = date_trunc('month', NOW())
    ), 0),
    'mesecni_prihodki', (
      SELECT jsonb_agg(m ORDER BY m->>'mesec')
      FROM (
        SELECT jsonb_build_object(
          'mesec', to_char(date_trunc('month', ustvarjeno), 'YYYY-MM'),
          'prihodki', COALESCE(SUM(skupaj_cena), 0),
          'rezervacij', COUNT(*)
        ) AS m
        FROM public.rezervacije
        WHERE kmetija_id = p_kmetija_id
          AND status IN ('potrjena','zakljucena')
          AND ustvarjeno > NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', ustvarjeno)
      ) sub
    )
  ) INTO result
  FROM public.rezervacije
  WHERE kmetija_id = p_kmetija_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
