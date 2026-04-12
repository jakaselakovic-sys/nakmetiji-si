-- =============================================================================
-- NaKmetiji.si — AI & Green Passport Migration
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- =============================================================================
-- Sections:
--   1. Extensions
--   2. pgvector — Semantic Farm Embeddings
--   3. Green Passport — Gamification Schema
--   4. Multilingual GIN Indexing
--   5. Revenue Tracking — Commissions & Payouts
--   6. Triggers — Passport stamp + auto-commission on booking confirm
--   7. RLS — Iron-clad Row Level Security
--   8. Helper Functions — Semantic search
-- =============================================================================


-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;       -- pgvector: semantic embeddings
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- trigram search for translations
CREATE EXTENSION IF NOT EXISTS unaccent;     -- accent-insensitive Slovenian search


-- ============================================================================
-- 2. PGVECTOR — Semantic Farm Embeddings
-- ============================================================================
-- Strategy: "Denormalized for Performance"
--   • Store embedding directly on kmetije (no JOIN needed for vector search)
--   • HNSW index for sub-millisecond ANN search at 10k+ farms
--   • vibe_tags[] for categorical filtering BEFORE vector scan (pre-filter trick)
-- ============================================================================

ALTER TABLE kmetije
  ADD COLUMN IF NOT EXISTS embedding      vector(1536),   -- OpenAI text-embedding-3-small
  ADD COLUMN IF NOT EXISTS vibe_tags      text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_opis        text,           -- AI-generated marketing blurb
  ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;

-- HNSW index — best for read-heavy workloads (NaKmetiji: ~95% reads)
-- m=16: good quality/speed tradeoff up to ~100k vectors
-- ef_construction=64: build quality (higher = more accurate, slower to build)
CREATE INDEX IF NOT EXISTS idx_kmetije_embedding_hnsw
  ON kmetije USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index on vibe_tags for pre-filtering before vector scan
-- e.g.: WHERE 'rusticna' = ANY(vibe_tags) ORDER BY embedding <=> $1
CREATE INDEX IF NOT EXISTS idx_kmetije_vibe_tags_gin
  ON kmetije USING gin (vibe_tags);

-- Full-text search on Slovenian farm descriptions (existing table, new index)
CREATE INDEX IF NOT EXISTS idx_kmetije_fts_sl
  ON kmetije USING gin (
    to_tsvector('simple', coalesce(ime, '') || ' ' || coalesce(opis, '') || ' ' || coalesce(kratki_opis, ''))
  );

COMMENT ON COLUMN kmetije.embedding IS
  'OpenAI text-embedding-3-small (1536-dim) of: ime + opis + vibe_tags. Updated by Edge Function on farm save.';
COMMENT ON COLUMN kmetije.vibe_tags IS
  'Categorical vibe labels: rusticna, moderna, tiha, druzinska, romantična, pustolovska, eko, luksuzna';


-- ============================================================================
-- 3. GREEN PASSPORT SYSTEM
-- ============================================================================
-- Gamification: users collect "žigi" (stamps) by visiting farms in each region.
-- A confirmed booking triggers a DB trigger → awards stamp + XP → levels up user.
-- ============================================================================

-- Extend profili with XP/gamification columns
ALTER TABLE profili
  ADD COLUMN IF NOT EXISTS xp_tocke            int         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nivo                int         NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS potni_list_aktiven  boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS skupaj_obiskov      int         NOT NULL DEFAULT 0;

-- Regions that can be "stamped" in the Green Passport
-- (Separate from kmetije.regija enum — passport regions can be thematic)
CREATE TABLE IF NOT EXISTS potni_list_regije (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        UNIQUE NOT NULL,
  ime             text        NOT NULL,
  opis            text,
  emoji           text,
  barva_hex       text        NOT NULL DEFAULT '#2D5A27',   -- stamp ink color
  zahteva_regija  text        NOT NULL,   -- matches regija_enum value in kmetije
  xp_nagrada      int         NOT NULL DEFAULT 50,
  ustvarjeno      timestamptz NOT NULL DEFAULT now()
);

-- Pre-populate all 12 Slovenian regions
INSERT INTO potni_list_regije (slug, ime, opis, emoji, barva_hex, zahteva_regija, xp_nagrada)
VALUES
  ('gorenjska',           'Gorenjska',             'Julijske Alpe, Triglav, planšarije',           '🏔️', '#1a3a6b', 'gorenjska',            75),
  ('primorska',           'Primorska',             'Sredozemska klima, vino, morje',                '🌊', '#1565c0', 'primorska',            75),
  ('stajerska',           'Štajerska',             'Vinska cesta, Pohorje, terme',                  '🍷', '#6a1a00', 'stajerska',            50),
  ('dolenjska',           'Dolenjska',             'Dolina Krke, grad Bogenšperk',                  '🏰', '#4a5c2a', 'dolenjska',            50),
  ('koroska',             'Koroška',               'Rudarsko izročilo, gozdovi, planine',           '⛏️', '#3c2a1a', 'koroska',              50),
  ('savinjska',           'Savinjska',             'Hmeljarstvo, Logarska dolina, Celje',           '🌿', '#2d5a27', 'savinjska',            50),
  ('pomurska',            'Pomurska',              'Ravnica, bučno olje, terme Moravci',            '🌻', '#c17f00', 'pomurska',             50),
  ('notranjska',          'Notranjska',            'Cerkniško jezero, jame, gozd',                  '🦢', '#1a4a3a', 'notranjska',           50),
  ('zasavska',            'Zasavska',              'Trbovlje, Hrastnik, industrijska dediščina',    '⚙️', '#2a2a2a', 'zasavska',             40),
  ('posavska',            'Posavska',              'Reka Sava, Brežice, vinogradništvo',            '🏞️', '#1a5a2a', 'posavska',             40),
  ('jugovzhodna_slovenija','Jugovzhodna Slovenija', 'Bela krajina, Kočevski rog, Kolpa',            '🌲', '#3a5a1a', 'jugovzhodna_slovenija', 60),
  ('osrednjeslovenska',   'Osrednjeslovenska',     'Ljubljana, Ljubljansko barje, Kamnik',          '🏙️', '#1a3050', 'osrednjeslovenska',    40)
ON CONFLICT (slug) DO NOTHING;

-- Badge catalog — flexible condition system via JSONB
DO $$ BEGIN
  CREATE TYPE znacka_tip AS ENUM ('regija', 'dosezek', 'sezonska', 'posebna');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS znacke (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        UNIQUE NOT NULL,
  ime         text        NOT NULL,
  opis        text,
  ikona_url   text,
  tip         znacka_tip  NOT NULL DEFAULT 'dosezek',
  -- Flexible condition (checked in trigger):
  --   {"min_obiskov": 5}
  --   {"vse_regije": true}
  --   {"regija": "gorenjska", "min_obiskov": 1}
  pogoj_json  jsonb       NOT NULL DEFAULT '{}',
  xp_vrednost int         NOT NULL DEFAULT 10,
  ustvarjeno  timestamptz NOT NULL DEFAULT now()
);

-- Seed starter badges
INSERT INTO znacke (slug, ime, opis, tip, pogoj_json, xp_vrednost)
VALUES
  ('prvi_obisk',       'Prvič na kmetiji',    'Opravil/-a prvo rezervacijo',          'dosezek', '{"min_obiskov": 1}',  10),
  ('raziskovalec',     'Raziskovalec',        '5 različnih kmetij',                   'dosezek', '{"min_obiskov": 5}',  25),
  ('veteran',          'Veteran kmetij',      '10 obiskov na kmetijah',               'dosezek', '{"min_obiskov": 10}', 50),
  ('popotnik',         'Zeleni popotnik',     'Vse 12 regij obiskano',                'dosezek', '{"vse_regije": true}', 200),
  ('gorenjski_zigi',   'Žig Gorenjske',       'Obiskal/-a kmetijo v Gorenjski',       'regija',  '{"regija": "gorenjska"}', 75),
  ('primorski_zigi',   'Žig Primorske',       'Obiskal/-a kmetijo v Primorski',       'regija',  '{"regija": "primorska"}', 75)
ON CONFLICT (slug) DO NOTHING;

-- Earned stamps — one row per user per region (UNIQUE enforced)
CREATE TABLE IF NOT EXISTS potni_list_zigi (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profil_id        uuid        NOT NULL REFERENCES profili(id)             ON DELETE CASCADE,
  regija_id        uuid        NOT NULL REFERENCES potni_list_regije(id)   ON DELETE CASCADE,
  kmetija_id       uuid        NOT NULL REFERENCES kmetije(id)             ON DELETE CASCADE,
  rezervacija_id   uuid        REFERENCES rezervacije(id)                  ON DELETE SET NULL,
  datum_prisluzeno timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profil_id, regija_id)   -- one stamp per region per user
);

CREATE INDEX IF NOT EXISTS idx_potni_list_zigi_profil ON potni_list_zigi (profil_id);

-- Earned achievements — one row per user per badge (UNIQUE enforced)
CREATE TABLE IF NOT EXISTS uporabnik_dosezki (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profil_id      uuid        NOT NULL REFERENCES profili(id)    ON DELETE CASCADE,
  znacka_id      uuid        NOT NULL REFERENCES znacke(id)     ON DELETE CASCADE,
  rezervacija_id uuid        REFERENCES rezervacije(id)         ON DELETE SET NULL,
  prisluzeno     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profil_id, znacka_id)
);

CREATE INDEX IF NOT EXISTS idx_uporabnik_dosezki_profil ON uporabnik_dosezki (profil_id);


-- ============================================================================
-- 4. MULTILINGUAL TRANSLATIONS (GIN Indexing)
-- ============================================================================
-- Strategy: EAV-style translation table
--   • One row per (table, row_id, lang, field)
--   • GIN index on FTS vector for multi-language search
--   • Trigram GIN index for partial/fuzzy matching
--   • Composite index for fast language-specific lookups
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE jezik_enum AS ENUM ('sl', 'en', 'de', 'it');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS prevodi (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela       text        NOT NULL,        -- 'kmetije' | 'dozivetja' | 'izdelki'
  vrstica_id   uuid        NOT NULL,
  jezik        jezik_enum  NOT NULL,
  polje        text        NOT NULL,        -- 'ime' | 'opis' | 'kratki_opis'
  vsebina      text        NOT NULL,
  ai_prevod    boolean     NOT NULL DEFAULT true,
  ustvarjeno   timestamptz NOT NULL DEFAULT now(),
  posodobljeno timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tabela, vrstica_id, jezik, polje)
);

-- Primary FTS index — searches across ALL languages simultaneously
-- 'simple' dictionary: no stemming (safe for SL/DE/IT proper nouns)
CREATE INDEX IF NOT EXISTS idx_prevodi_fts
  ON prevodi USING gin (
    to_tsvector('simple', vsebina)
  );

-- Trigram index — typo-tolerant / partial-word search
-- e.g.: "Gorenj" matches "Gorenjska"
CREATE INDEX IF NOT EXISTS idx_prevodi_trgm
  ON prevodi USING gin (vsebina gin_trgm_ops);

-- Composite: fast lookup by language (e.g.: all DE translations of farms)
CREATE INDEX IF NOT EXISTS idx_prevodi_tabela_jezik_polje
  ON prevodi (tabela, jezik, polje);

-- Index for reverse lookup: given row ID, find all its translations
CREATE INDEX IF NOT EXISTS idx_prevodi_vrstica
  ON prevodi (vrstica_id, jezik);

COMMENT ON TABLE prevodi IS
  'AI + human translations for kmetije/dozivetja/izdelki. ai_prevod=true → auto-generated, needs human review.';


-- ============================================================================
-- 5. REVENUE TRACKING
-- ============================================================================
-- Strategy: immutable append-only ledger
--   • Triggers auto-create commission row when booking is confirmed
--   • No UPDATE allowed on transactions (except admin status change)
--   • Stripe IDs stored for reconciliation
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE transakcija_tip AS ENUM ('komisija', 'izplacilo', 'ai_agencija', 'vracilo', 'premium_narocnina');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transakcija_status AS ENUM ('cakanje', 'obdelana', 'neuspesna', 'vrnjena');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS transakcije (
  id                  uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  rezervacija_id      uuid                 REFERENCES rezervacije(id) ON DELETE SET NULL,
  lastnik_id          uuid                 REFERENCES profili(id)     ON DELETE SET NULL,
  tip                 transakcija_tip      NOT NULL,
  bruto_znesek        numeric(10, 2)       NOT NULL CHECK (bruto_znesek >= 0),
  komisija_odstotek   numeric(5, 2)        NOT NULL DEFAULT 12.00,
  komisija_znesek     numeric(10, 2)       NOT NULL CHECK (komisija_znesek >= 0),
  neto_znesek         numeric(10, 2)       NOT NULL CHECK (neto_znesek >= 0),
  status              transakcija_status   NOT NULL DEFAULT 'cakanje',
  stripe_payment_id   text,
  stripe_transfer_id  text,
  opombe              text,
  ustvarjeno          timestamptz          NOT NULL DEFAULT now(),
  obdelano            timestamptz,
  -- Integrity: commission + net = gross
  CONSTRAINT komisija_kontrola CHECK (
    ABS(bruto_znesek - komisija_znesek - neto_znesek) < 0.01
  )
);

-- Finance dashboard: vendor sees own transactions sorted by date
CREATE INDEX IF NOT EXISTS idx_transakcije_lastnik_datum
  ON transakcije (lastnik_id, ustvarjeno DESC);

-- Admin reconciliation: filter by status
CREATE INDEX IF NOT EXISTS idx_transakcije_status_datum
  ON transakcije (status, ustvarjeno DESC);

-- Join from reservation → transaction
CREATE INDEX IF NOT EXISTS idx_transakcije_rezervacija
  ON transakcije (rezervacija_id);

COMMENT ON TABLE transakcije IS
  'Append-only financial ledger. komisija rows are auto-created by trigger on booking confirmation.';

COMMENT ON COLUMN transakcije.tip IS
  'tip=ai_agencija: monthly fee for AI features (semantic search, auto-translation, vibe tagging). Billed separately.';


-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- ─── 6a. Green Passport: award stamp + XP when booking is confirmed ──────────

CREATE OR REPLACE FUNCTION fn_potni_list_ob_potrditvi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profil_id      uuid;
  v_kmetija_regija text;
  v_regija_row     RECORD;
  v_ze_ima_zig     boolean;
  v_znacka         RECORD;
  v_skupaj_obiskov bigint;
  v_vse_regije     bigint;
BEGIN
  -- Only fire when status changes TO 'potrjena'
  IF NEW.status <> 'potrjena' OR OLD.status = 'potrjena' THEN
    RETURN NEW;
  END IF;

  -- Resolve registered user by email (bookings can be made without login)
  SELECT id INTO v_profil_id
  FROM profili
  WHERE email = NEW.gost_email
  LIMIT 1;

  IF v_profil_id IS NULL THEN
    RETURN NEW;  -- anonymous guest, no passport
  END IF;

  -- Increment visit counter (denormalized for performance)
  UPDATE profili
  SET skupaj_obiskov = skupaj_obiskov + 1
  WHERE id = v_profil_id;

  -- Get confirmed visit count for badge checks
  SELECT COUNT(*) INTO v_skupaj_obiskov
  FROM rezervacije
  WHERE gost_email = NEW.gost_email
    AND status IN ('potrjena', 'zakljucena');

  -- Get farm's region
  SELECT regija::text INTO v_kmetija_regija
  FROM kmetije WHERE id = NEW.kmetija_id;

  -- ── Award region passport stamp ──
  SELECT * INTO v_regija_row
  FROM potni_list_regije
  WHERE zahteva_regija = v_kmetija_regija
  LIMIT 1;

  IF v_regija_row.id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM potni_list_zigi
      WHERE profil_id = v_profil_id AND regija_id = v_regija_row.id
    ) INTO v_ze_ima_zig;

    IF NOT v_ze_ima_zig THEN
      INSERT INTO potni_list_zigi (profil_id, regija_id, kmetija_id, rezervacija_id)
      VALUES (v_profil_id, v_regija_row.id, NEW.kmetija_id, NEW.id);

      UPDATE profili
      SET xp_tocke = xp_tocke + v_regija_row.xp_nagrada
      WHERE id = v_profil_id;
    END IF;
  END IF;

  -- ── Check and award milestone badges ──
  FOR v_znacka IN
    SELECT z.*
    FROM znacke z
    WHERE NOT EXISTS (
      SELECT 1 FROM uporabnik_dosezki ud
      WHERE ud.profil_id = v_profil_id AND ud.znacka_id = z.id
    )
    ORDER BY (z.pogoj_json->>'min_obiskov')::int NULLS LAST
  LOOP
    -- Visit count badge
    IF (v_znacka.pogoj_json->>'min_obiskov') IS NOT NULL THEN
      IF v_skupaj_obiskov >= (v_znacka.pogoj_json->>'min_obiskov')::int THEN
        INSERT INTO uporabnik_dosezki (profil_id, znacka_id, rezervacija_id)
        VALUES (v_profil_id, v_znacka.id, NEW.id)
        ON CONFLICT DO NOTHING;

        UPDATE profili SET xp_tocke = xp_tocke + v_znacka.xp_vrednost
        WHERE id = v_profil_id;
      END IF;
    END IF;

    -- "All 12 regions" badge
    IF (v_znacka.pogoj_json->>'vse_regije')::boolean IS TRUE THEN
      SELECT COUNT(DISTINCT regija_id) INTO v_vse_regije
      FROM potni_list_zigi WHERE profil_id = v_profil_id;

      IF v_vse_regije >= 12 THEN
        INSERT INTO uporabnik_dosezki (profil_id, znacka_id, rezervacija_id)
        VALUES (v_profil_id, v_znacka.id, NEW.id)
        ON CONFLICT DO NOTHING;

        UPDATE profili SET xp_tocke = xp_tocke + v_znacka.xp_vrednost
        WHERE id = v_profil_id;
      END IF;
    END IF;
  END LOOP;

  -- ── Level up (every 100 XP = 1 level, min level 1) ──
  UPDATE profili
  SET nivo = GREATEST(1, FLOOR(xp_tocke / 100) + 1)
  WHERE id = v_profil_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trig_potni_list ON rezervacije;
CREATE TRIGGER trig_potni_list
  AFTER UPDATE ON rezervacije
  FOR EACH ROW
  EXECUTE FUNCTION fn_potni_list_ob_potrditvi();


-- ─── 6b. Revenue: auto-create commission row on booking confirmation ──────────

CREATE OR REPLACE FUNCTION fn_komisija_ob_potrditvi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lastnik_id    uuid;
  v_komisija      numeric(10, 2);
  v_neto          numeric(10, 2);
BEGIN
  IF NEW.status <> 'potrjena' OR OLD.status = 'potrjena' THEN
    RETURN NEW;
  END IF;

  SELECT lastnik_id INTO v_lastnik_id
  FROM kmetije WHERE id = NEW.kmetija_id;

  v_komisija := ROUND(COALESCE(NEW.skupaj_cena, 0) * 0.12, 2);
  v_neto     := COALESCE(NEW.skupaj_cena, 0) - v_komisija;

  INSERT INTO transakcije (
    rezervacija_id, lastnik_id, tip,
    bruto_znesek, komisija_odstotek, komisija_znesek, neto_znesek,
    status
  ) VALUES (
    NEW.id, v_lastnik_id, 'komisija',
    COALESCE(NEW.skupaj_cena, 0), 12.00, v_komisija, v_neto,
    'cakanje'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trig_komisija ON rezervacije;
CREATE TRIGGER trig_komisija
  AFTER UPDATE ON rezervacije
  FOR EACH ROW
  EXECUTE FUNCTION fn_komisija_ob_potrditvi();


-- ─── 6c. Auto-update posodobljeno on prevodi ─────────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_posodobljeno()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.posodobljeno = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trig_prevodi_posodobljeno ON prevodi;
CREATE TRIGGER trig_prevodi_posodobljeno
  BEFORE UPDATE ON prevodi
  FOR EACH ROW EXECUTE FUNCTION fn_set_posodobljeno();


-- ============================================================================
-- 7. ROW LEVEL SECURITY — Iron-Clad Policies
-- ============================================================================
-- Principle: deny by default, explicit allow per role.
-- auth.uid() is always checked against the DB — never trust client input.
-- ============================================================================

-- ─── kmetije ─────────────────────────────────────────────────────────────────

ALTER TABLE kmetije ENABLE ROW LEVEL SECURITY;

-- Public: read any active farm (powers the listing page)
CREATE POLICY "kmetije__public_read_active"
  ON kmetije FOR SELECT
  USING (aktivna = true);

-- Owner: read own farms (including inactive — to manage their listing)
CREATE POLICY "kmetije__owner_read_own"
  ON kmetije FOR SELECT
  USING (lastnik_id = auth.uid());

-- Owner: insert — lastnik_id MUST match auth.uid(), and user must have 'lastnik' role
CREATE POLICY "kmetije__owner_insert"
  ON kmetije FOR INSERT
  WITH CHECK (
    lastnik_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profili
      WHERE id = auth.uid()
        AND vloga IN ('lastnik', 'super_admin')
    )
  );

-- Owner: update only their own farm; cannot change lastnik_id to someone else
CREATE POLICY "kmetije__owner_update"
  ON kmetije FOR UPDATE
  USING  (lastnik_id = auth.uid())
  WITH CHECK (lastnik_id = auth.uid());

-- Admin: full access to all farms (bypass all above)
CREATE POLICY "kmetije__admin_all"
  ON kmetije FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin')
  );

-- No DELETE policy → nobody can hard-delete farms (use aktivna = false)


-- ─── izdelki ─────────────────────────────────────────────────────────────────

ALTER TABLE izdelki ENABLE ROW LEVEL SECURITY;

-- Public: read products from active farms only
CREATE POLICY "izdelki__public_read_active"
  ON izdelki FOR SELECT
  USING (
    na_voljo = true
    AND EXISTS (SELECT 1 FROM kmetije k WHERE k.id = kmetija_id AND k.aktivna = true)
  );

-- Owner: full CRUD on their farm's products
-- (Subquery verifies ownership against DB, NOT client-supplied data)
CREATE POLICY "izdelki__owner_crud"
  ON izdelki FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM kmetije k
      WHERE k.id = kmetija_id AND k.lastnik_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kmetije k
      WHERE k.id = kmetija_id AND k.lastnik_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "izdelki__admin_all"
  ON izdelki FOR ALL
  USING (EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin'));


-- ─── rezervacije ─────────────────────────────────────────────────────────────

ALTER TABLE rezervacije ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT a booking (no login required to book)
-- Business logic validation is done in server action
CREATE POLICY "rezervacije__public_insert"
  ON rezervacije FOR INSERT
  WITH CHECK (true);

-- Owner: read all bookings for their farms
CREATE POLICY "rezervacije__owner_read"
  ON rezervacije FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kmetije k
      WHERE k.id = kmetija_id AND k.lastnik_id = auth.uid()
    )
  );

-- Owner: update booking status (confirm/reject) for their farms only
CREATE POLICY "rezervacije__owner_update_status"
  ON rezervacije FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM kmetije k
      WHERE k.id = kmetija_id AND k.lastnik_id = auth.uid()
    )
  );

-- Guest: read their own bookings by matching email to profile
CREATE POLICY "rezervacije__guest_read_own"
  ON rezervacije FOR SELECT
  USING (
    gost_email = (SELECT email FROM profili WHERE id = auth.uid())
  );

-- Admin: full access
CREATE POLICY "rezervacije__admin_all"
  ON rezervacije FOR ALL
  USING (EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin'));


-- ─── mnenja (reviews) ────────────────────────────────────────────────────────

ALTER TABLE mnenja ENABLE ROW LEVEL SECURITY;

-- Public: read only approved reviews
CREATE POLICY "mnenja__public_read_approved"
  ON mnenja FOR SELECT
  USING (status = 'odobreno');

-- Anyone can submit a review (server action sets status = 'cakanje')
CREATE POLICY "mnenja__public_insert_pending"
  ON mnenja FOR INSERT
  WITH CHECK (status = 'cakanje');

-- Owner: can read all reviews on their farm (to anticipate moderation)
-- Cannot UPDATE/DELETE — prevents suppressing negative reviews
CREATE POLICY "mnenja__owner_read_own_farm"
  ON mnenja FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kmetije k
      WHERE k.id = kmetija_id AND k.lastnik_id = auth.uid()
    )
  );

-- Admin: full moderation access
CREATE POLICY "mnenja__admin_all"
  ON mnenja FOR ALL
  USING (EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin'));


-- ─── prevodi (translations) ──────────────────────────────────────────────────

ALTER TABLE prevodi ENABLE ROW LEVEL SECURITY;

-- Public: read all translations (needed for multilingual UI)
CREATE POLICY "prevodi__public_read"
  ON prevodi FOR SELECT USING (true);

-- Admin + Edge Functions (service_role): write translations
CREATE POLICY "prevodi__admin_write"
  ON prevodi FOR ALL
  USING (EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin'));


-- ─── transakcije (revenue) ───────────────────────────────────────────────────

ALTER TABLE transakcije ENABLE ROW LEVEL SECURITY;

-- Owner: read their own payout/commission records
CREATE POLICY "transakcije__owner_read"
  ON transakcije FOR SELECT
  USING (lastnik_id = auth.uid());

-- No INSERT/UPDATE from client — only triggers and admin
CREATE POLICY "transakcije__admin_all"
  ON transakcije FOR ALL
  USING (EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin'));


-- ─── potni_list_zigi (passport stamps) ───────────────────────────────────────

ALTER TABLE potni_list_zigi ENABLE ROW LEVEL SECURITY;

-- User sees only their own stamps
CREATE POLICY "zigi__owner_read"
  ON potni_list_zigi FOR SELECT
  USING (profil_id = auth.uid());

-- Stamps are created only by triggers (SECURITY DEFINER) — no client INSERT
CREATE POLICY "zigi__admin_all"
  ON potni_list_zigi FOR ALL
  USING (EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin'));


-- ─── uporabnik_dosezki (achievements) ────────────────────────────────────────

ALTER TABLE uporabnik_dosezki ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dosezki__owner_read"
  ON uporabnik_dosezki FOR SELECT
  USING (profil_id = auth.uid());

CREATE POLICY "dosezki__admin_all"
  ON uporabnik_dosezki FOR ALL
  USING (EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin'));

-- Public: read badge catalog (needed for passport UI)
ALTER TABLE znacke ENABLE ROW LEVEL SECURITY;
CREATE POLICY "znacke__public_read" ON znacke FOR SELECT USING (true);
CREATE POLICY "znacke__admin_all"   ON znacke FOR ALL
  USING (EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin'));

ALTER TABLE potni_list_regije ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pl_regije__public_read" ON potni_list_regije FOR SELECT USING (true);
CREATE POLICY "pl_regije__admin_all"   ON potni_list_regije FOR ALL
  USING (EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin'));


-- ============================================================================
-- 8. HELPER FUNCTIONS — Semantic Search
-- ============================================================================

-- Cosine similarity search (ANN via HNSW index)
-- Usage: SELECT * FROM poisci_kmetije_po_vibu('{...}'::vector, 0.75, 10);
CREATE OR REPLACE FUNCTION poisci_kmetije_po_vibu(
  iskalni_vektor  vector(1536),
  prag_podobnosti float    DEFAULT 0.72,
  max_rezultatov  int      DEFAULT 10,
  filter_vibe     text     DEFAULT NULL    -- optional: 'rusticna', 'moderna', etc.
)
RETURNS TABLE (
  id          uuid,
  ime         text,
  slug        text,
  regija      text,
  podobnost   float,
  vibe_tags   text[]
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.ime,
    k.slug,
    k.regija::text,
    (1 - (k.embedding <=> iskalni_vektor))::float AS podobnost,
    k.vibe_tags
  FROM kmetije k
  WHERE
    k.aktivna = true
    AND k.embedding IS NOT NULL
    AND (filter_vibe IS NULL OR filter_vibe = ANY(k.vibe_tags))
    AND (1 - (k.embedding <=> iskalni_vektor)) >= prag_podobnosti
  ORDER BY k.embedding <=> iskalni_vektor   -- HNSW index used here
  LIMIT max_rezultatov;
END;
$$;

COMMENT ON FUNCTION poisci_kmetije_po_vibu IS
  'ANN cosine similarity search on kmetije.embedding (HNSW). Pass OpenAI embedding of user query. Optional vibe pre-filter reduces scan set.';


-- Multilingual search across all translations
CREATE OR REPLACE FUNCTION poisci_prevode(
  iskanje text,
  jezik   jezik_enum  DEFAULT 'sl',
  tabela  text        DEFAULT 'kmetije',
  limit_  int         DEFAULT 20
)
RETURNS TABLE (
  vrstica_id  uuid,
  polje       text,
  vsebina     text,
  rank        float
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.vrstica_id,
    p.polje,
    p.vsebina,
    ts_rank(to_tsvector('simple', unaccent(p.vsebina)),
            plainto_tsquery('simple', unaccent(iskanje)))::float AS rank
  FROM prevodi p
  WHERE
    p.tabela = poisci_prevode.tabela
    AND p.jezik = poisci_prevode.jezik
    AND to_tsvector('simple', unaccent(p.vsebina))
        @@ plainto_tsquery('simple', unaccent(iskanje))
  ORDER BY rank DESC
  LIMIT limit_;
END;
$$;
