-- =============================================================================
-- NaKmetiji.si — Supabase / PostgreSQL Database Schema
-- Platforma za odkrivanje turističnih kmetij v Sloveniji
-- =============================================================================

-- ─── Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUM: Statistične regije Slovenije ──────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE regija_enum AS ENUM (
    'gorenjska',
    'primorska',
    'stajerska',
    'dolenjska',
    'koroska',
    'savinjska',
    'pomurska',
    'notranjska',
    'zasavska',
    'posavska',
    'jugovzhodna_slovenija',
    'osrednjeslovenska'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: Kategorije izdelkov ──────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE izdelek_kategorija_enum AS ENUM (
    'mlecni_izdelki',
    'mesni_izdelki',
    'sadje_zelenjava',
    'med_cebelji_izdelki',
    'vino_pijace',
    'pekovski_izdelki',
    'olja_kis',
    'domaca_kosmerika',
    'ostalo'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: Status rezervacije ───────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE rezervacija_status_enum AS ENUM (
    'cakanje',
    'potrjena',
    'zavrnjena',
    'preklicana',
    'zakljucena'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Tabela: dozivetja (Experience categories) ──────────────────────────────

CREATE TABLE IF NOT EXISTS dozivetja (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ime         VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  ikona       VARCHAR(50)  NOT NULL,  -- lucide-react icon name
  opis        TEXT,
  vrstni_red  INTEGER NOT NULL DEFAULT 0,

  ustvarjeno  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posodobljeno TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: kmetije (Farm listings) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kmetije (
  -- Identiteta
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                VARCHAR(255) NOT NULL UNIQUE,

  -- Vsebina
  ime                 VARCHAR(255) NOT NULL,
  kratki_opis         VARCHAR(200),   -- tagline za kartice
  opis                TEXT NOT NULL,

  -- Lokacija
  regija              regija_enum NOT NULL,
  naslov              VARCHAR(500),
  obcina              VARCHAR(255),
  postna_stevilka     VARCHAR(10),
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,

  -- Mediji
  naslovna_slika      TEXT NOT NULL,
  slike               TEXT[] DEFAULT '{}',
  video_url           TEXT,

  -- Kontakt (JSONB za fleksibilnost)
  kontaktni_podatki   JSONB DEFAULT '{}'::jsonb,

  -- Ocene & Status
  ocena               DECIMAL(2, 1) CHECK (ocena >= 1.0 AND ocena <= 5.0),
  stevilo_ocen        INTEGER NOT NULL DEFAULT 0,
  premium             BOOLEAN NOT NULL DEFAULT FALSE,
  aktivna             BOOLEAN NOT NULL DEFAULT TRUE,

  -- Metadata
  lastnik_id          UUID,
  ustvarjeno          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posodobljeno        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: kmetija_dozivetje (Many-to-Many) ──────────────────────────────

CREATE TABLE IF NOT EXISTS kmetija_dozivetje (
  kmetija_id    UUID NOT NULL REFERENCES kmetije(id) ON DELETE CASCADE,
  dozivetje_id  UUID NOT NULL REFERENCES dozivetja(id) ON DELETE CASCADE,

  PRIMARY KEY (kmetija_id, dozivetje_id)
);

-- ─── Tabela: mnenja (Reviews / Testimonials) ───────────────────────────────

CREATE TABLE IF NOT EXISTS mnenja (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kmetija_id    UUID NOT NULL REFERENCES kmetije(id) ON DELETE CASCADE,

  uporabnik_ime   VARCHAR(100) NOT NULL,
  uporabnik_email VARCHAR(255),

  ocena         INTEGER NOT NULL CHECK (ocena >= 1 AND ocena <= 5),
  komentar      TEXT,
  odobreno      BOOLEAN NOT NULL DEFAULT FALSE,

  datum         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: izdelki (Products / Kmečki izdelki) ───────────────────────────

CREATE TABLE IF NOT EXISTS izdelki (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kmetija_id    UUID NOT NULL REFERENCES kmetije(id) ON DELETE CASCADE,

  -- Vsebina
  ime           VARCHAR(200) NOT NULL,
  opis          TEXT,
  kategorija    izdelek_kategorija_enum NOT NULL DEFAULT 'ostalo',

  -- Cena & zaloga
  cena          DECIMAL(8, 2) NOT NULL CHECK (cena >= 0),
  enota         VARCHAR(30) NOT NULL DEFAULT 'kos',  -- kg, liter, kos, kozarec...
  zaloga        INTEGER NOT NULL DEFAULT 0 CHECK (zaloga >= 0),
  na_voljo      BOOLEAN NOT NULL DEFAULT TRUE,

  -- Mediji
  slika_url     TEXT,

  -- Metadata
  ustvarjeno    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posodobljeno  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: rezervacije (Bookings) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rezervacije (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kmetija_id    UUID NOT NULL REFERENCES kmetije(id) ON DELETE CASCADE,

  -- Gost
  gost_ime      VARCHAR(150) NOT NULL,
  gost_email    VARCHAR(255) NOT NULL,
  gost_telefon  VARCHAR(30),
  stevilo_oseb  INTEGER NOT NULL DEFAULT 1 CHECK (stevilo_oseb >= 1),

  -- Datumi
  datum_od      DATE NOT NULL,
  datum_do      DATE NOT NULL,
  CHECK (datum_do >= datum_od),

  -- Vsebina
  opombe        TEXT,
  status        rezervacija_status_enum NOT NULL DEFAULT 'cakanje',

  -- Metadata
  ustvarjeno    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posodobljeno  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEKSI
-- =============================================================================

-- Kmetije
CREATE INDEX IF NOT EXISTS idx_kmetije_slug        ON kmetije (slug);
CREATE INDEX IF NOT EXISTS idx_kmetije_regija      ON kmetije (regija);
CREATE INDEX IF NOT EXISTS idx_kmetije_premium     ON kmetije (premium) WHERE premium = TRUE;
CREATE INDEX IF NOT EXISTS idx_kmetije_ocena       ON kmetije (ocena DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_kmetije_aktivna     ON kmetije (aktivna) WHERE aktivna = TRUE;
CREATE INDEX IF NOT EXISTS idx_kmetije_koordinate  ON kmetije (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_kmetije_search ON kmetije USING GIN (
  to_tsvector('simple', ime || ' ' || COALESCE(opis, '') || ' ' || COALESCE(kratki_opis, ''))
);

-- Doživetja
CREATE INDEX IF NOT EXISTS idx_dozivetja_slug ON dozivetja (slug);

-- Many-to-many
CREATE INDEX IF NOT EXISTS idx_kd_kmetija   ON kmetija_dozivetje (kmetija_id);
CREATE INDEX IF NOT EXISTS idx_kd_dozivetje ON kmetija_dozivetje (dozivetje_id);

-- Mnenja
CREATE INDEX IF NOT EXISTS idx_mnenja_kmetija  ON mnenja (kmetija_id);
CREATE INDEX IF NOT EXISTS idx_mnenja_odobreno ON mnenja (odobreno) WHERE odobreno = TRUE;
CREATE INDEX IF NOT EXISTS idx_mnenja_datum    ON mnenja (datum DESC);

-- Izdelki
CREATE INDEX IF NOT EXISTS idx_izdelki_kmetija    ON izdelki (kmetija_id);
CREATE INDEX IF NOT EXISTS idx_izdelki_kategorija ON izdelki (kategorija);
CREATE INDEX IF NOT EXISTS idx_izdelki_na_voljo   ON izdelki (na_voljo) WHERE na_voljo = TRUE;
CREATE INDEX IF NOT EXISTS idx_izdelki_cena       ON izdelki (cena);

-- Rezervacije
CREATE INDEX IF NOT EXISTS idx_rezervacije_kmetija ON rezervacije (kmetija_id);
CREATE INDEX IF NOT EXISTS idx_rezervacije_status  ON rezervacije (status);
CREATE INDEX IF NOT EXISTS idx_rezervacije_datum   ON rezervacije (datum_od, datum_do);
CREATE INDEX IF NOT EXISTS idx_rezervacije_email   ON rezervacije (gost_email);

-- =============================================================================
-- TRIGGERJI
-- =============================================================================

-- Auto-update posodobljeno timestamp
CREATE OR REPLACE FUNCTION posodobi_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.posodobljeno = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_kmetije_posodobljeno
  BEFORE UPDATE ON kmetije
  FOR EACH ROW
  EXECUTE FUNCTION posodobi_timestamp();

CREATE OR REPLACE TRIGGER trg_dozivetja_posodobljeno
  BEFORE UPDATE ON dozivetja
  FOR EACH ROW
  EXECUTE FUNCTION posodobi_timestamp();

CREATE OR REPLACE TRIGGER trg_izdelki_posodobljeno
  BEFORE UPDATE ON izdelki
  FOR EACH ROW
  EXECUTE FUNCTION posodobi_timestamp();

CREATE OR REPLACE TRIGGER trg_rezervacije_posodobljeno
  BEFORE UPDATE ON rezervacije
  FOR EACH ROW
  EXECUTE FUNCTION posodobi_timestamp();

-- Auto-recalculate ocena on kmetije when mnenja changes
CREATE OR REPLACE FUNCTION preracunaj_oceno()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE kmetije
  SET
    ocena = (
      SELECT ROUND(AVG(ocena)::numeric, 1)
      FROM mnenja
      WHERE kmetija_id = COALESCE(NEW.kmetija_id, OLD.kmetija_id)
        AND odobreno = TRUE
    ),
    stevilo_ocen = (
      SELECT COUNT(*)
      FROM mnenja
      WHERE kmetija_id = COALESCE(NEW.kmetija_id, OLD.kmetija_id)
        AND odobreno = TRUE
    )
  WHERE id = COALESCE(NEW.kmetija_id, OLD.kmetija_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_mnenja_ocena
  AFTER INSERT OR UPDATE OR DELETE ON mnenja
  FOR EACH ROW
  EXECUTE FUNCTION preracunaj_oceno();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE kmetije ENABLE ROW LEVEL SECURITY;
ALTER TABLE dozivetja ENABLE ROW LEVEL SECURITY;
ALTER TABLE kmetija_dozivetje ENABLE ROW LEVEL SECURITY;
ALTER TABLE mnenja ENABLE ROW LEVEL SECURITY;
ALTER TABLE izdelki ENABLE ROW LEVEL SECURITY;
ALTER TABLE rezervacije ENABLE ROW LEVEL SECURITY;

-- Javno branje za vse aktivne kmetije
CREATE POLICY "Javno branje kmetij" ON kmetije
  FOR SELECT USING (aktivna = TRUE);

-- Javno branje doživetij
CREATE POLICY "Javno branje dozivetij" ON dozivetja
  FOR SELECT USING (TRUE);

-- Javno branje povezav
CREATE POLICY "Javno branje povezav" ON kmetija_dozivetje
  FOR SELECT USING (TRUE);

-- Javno branje odobrenih mnenj
CREATE POLICY "Javno branje mnenj" ON mnenja
  FOR SELECT USING (odobreno = TRUE);

-- Javno oddajanje mnenj
CREATE POLICY "Javno oddajanje mnenj" ON mnenja
  FOR INSERT WITH CHECK (TRUE);

-- Javno branje izdelkov, ki so na voljo
CREATE POLICY "Javno branje izdelkov" ON izdelki
  FOR SELECT USING (na_voljo = TRUE);

-- Javno ustvarjanje rezervacij
CREATE POLICY "Javno ustvarjanje rezervacij" ON rezervacije
  FOR INSERT WITH CHECK (TRUE);

-- Rezervacije ne smejo biti javno berljive. Ta osnovna shema nima stolpcev
-- gost_id/lastnik_id za varno participantsko RLS politiko; produkcijska
-- politika je definirana v migraciji 20260419_rls_audit.sql.
CREATE POLICY "Brez javnega branja rezervacij" ON rezervacije
  FOR SELECT USING (FALSE);
