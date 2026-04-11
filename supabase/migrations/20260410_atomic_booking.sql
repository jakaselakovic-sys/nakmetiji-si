-- =============================================================================
-- NaKmetiji.si — Atomic Booking Engine
-- Migration: 20260410_atomic_booking
--
-- Implements fail-safe, race-condition-proof booking via:
--   1. Exclusion constraint on daterange to prevent double-bookings at DB level
--   2. atomic_rezerviraj() PL/pgSQL function that serializes concurrent attempts
--      using SELECT...FOR UPDATE on the farm row as the lock point
--   3. skupaj_cena + upn_referenca columns on rezervacije
--   4. cron_preklic_zastarelih() function for automated 48h cleanup
-- =============================================================================

-- ── 0. Prerequisites ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ── 1. Schema additions to rezervacije ───────────────────────────────────────

-- skupaj_cena: total booking cost (already may exist — add only if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rezervacije' AND column_name = 'skupaj_cena'
  ) THEN
    ALTER TABLE rezervacije ADD COLUMN skupaj_cena numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- upn_referenca: generated SI payment reference, set on approval
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rezervacije' AND column_name = 'upn_referenca'
  ) THEN
    ALTER TABLE rezervacije ADD COLUMN upn_referenca text;
  END IF;
END $$;

-- ── 2. Exclusion constraint — DB-level last line of defense ──────────────────
-- Prevents any two confirmed/pending bookings from overlapping on the same farm.
-- Uses daterange with GiST index for O(log n) overlap checks.
-- Error code 23P01 is returned on violation.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rezervacije_no_overlap'
  ) THEN
    ALTER TABLE rezervacije
      ADD CONSTRAINT rezervacije_no_overlap
      EXCLUDE USING gist (
        kmetija_id WITH =,
        daterange(datum_od, datum_do, '[)') WITH &&
      )
      WHERE (status IN ('cakanje', 'potrjena'));
  END IF;
END $$;

-- ── 3. Atomic booking function ────────────────────────────────────────────────
--
-- Strategy: Lock the farm row (FOR UPDATE) to serialize concurrent booking
-- attempts for the same farm. Under the lock, the overlap check is authoritative.
-- Concurrent callers wait at the SELECT FOR UPDATE; they re-check after acquiring.
--
-- Returns: jsonb { ok, id?, napaka?, code? }

CREATE OR REPLACE FUNCTION atomic_rezerviraj(
  p_kmetija_id    uuid,
  p_datum_od      date,
  p_datum_do      date,
  p_gost_ime      text,
  p_gost_email    text,
  p_gost_telefon  text    DEFAULT NULL,
  p_stevilo_oseb  integer DEFAULT 1,
  p_opombe        text    DEFAULT NULL,
  p_skupaj_cena   numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_gostov    integer;
  v_aktivna       boolean;
  v_konflikt_id   uuid;
  v_rez_id        uuid;
BEGIN
  -- Validate date range
  IF p_datum_od >= p_datum_do THEN
    RETURN jsonb_build_object(
      'ok', false,
      'napaka', 'Datum odhoda mora biti po datumu prihoda.',
      'code', 'INVALID_DATES'
    );
  END IF;

  IF p_datum_od < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'ok', false,
      'napaka', 'Datumi v preteklosti niso dovoljeni.',
      'code', 'PAST_DATES'
    );
  END IF;

  -- ── Acquire exclusive lock on the farm row ──────────────────────────────
  -- This is the serialization point: only one concurrent booking attempt
  -- per farm proceeds at a time. Others wait here until we COMMIT/ROLLBACK.
  SELECT max_gostov, aktivna
    INTO v_max_gostov, v_aktivna
    FROM kmetije
   WHERE id = p_kmetija_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'napaka', 'Kmetija ne obstaja.',
      'code', 'NOT_FOUND'
    );
  END IF;

  IF NOT v_aktivna THEN
    RETURN jsonb_build_object(
      'ok', false,
      'napaka', 'Kmetija trenutno ne sprejema rezervacij.',
      'code', 'FARM_INACTIVE'
    );
  END IF;

  -- ── Capacity check ───────────────────────────────────────────────────────
  IF v_max_gostov IS NOT NULL AND p_stevilo_oseb > v_max_gostov THEN
    RETURN jsonb_build_object(
      'ok', false,
      'napaka', format('Največje število gostov je %s.', v_max_gostov),
      'code', 'OVER_CAPACITY'
    );
  END IF;

  -- ── Overlap check (authoritative under the farm lock) ───────────────────
  -- daterange '[)' = inclusive start, exclusive end (standard for night stays)
  SELECT id
    INTO v_konflikt_id
    FROM rezervacije
   WHERE kmetija_id = p_kmetija_id
     AND status IN ('cakanje', 'potrjena')
     AND daterange(datum_od, datum_do, '[)') && daterange(p_datum_od, p_datum_do, '[)')
   LIMIT 1;

  IF v_konflikt_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'napaka', 'Izbrani termini so zasedeni. Prosimo izberite druge datume.',
      'code', 'DATE_CONFLICT'
    );
  END IF;

  -- ── Insert reservation ───────────────────────────────────────────────────
  INSERT INTO rezervacije (
    kmetija_id, datum_od, datum_do,
    gost_ime, gost_email, gost_telefon,
    stevilo_oseb, opombe, skupaj_cena, status
  ) VALUES (
    p_kmetija_id, p_datum_od, p_datum_do,
    p_gost_ime, p_gost_email, p_gost_telefon,
    p_stevilo_oseb, p_opombe, p_skupaj_cena, 'cakanje'
  )
  RETURNING id INTO v_rez_id;

  RETURN jsonb_build_object('ok', true, 'id', v_rez_id);

EXCEPTION
  -- Exclusion constraint violation (concurrent transaction slipped through)
  WHEN exclusion_violation THEN
    RETURN jsonb_build_object(
      'ok', false,
      'napaka', 'Termini so bili ravnokar zasedeni. Poskusite znova.',
      'code', 'RACE_CONDITION'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'napaka', 'Interna napaka pri rezervaciji.',
      'code', 'INTERNAL',
      'detail', SQLERRM
    );
END;
$$;

-- Grant execute to authenticated users and service role
GRANT EXECUTE ON FUNCTION atomic_rezerviraj TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_rezerviraj TO service_role;

-- ── 4. Cron cleanup function — cancel stale pending bookings ──────────────────
--
-- Called by the Vercel cron job every 6 hours.
-- Cancels bookings that have been in 'cakanje' for more than 48 hours
-- and whose check-in date hasn't passed yet.
-- Returns the number of bookings cancelled.

CREATE OR REPLACE FUNCTION cron_preklic_zastarelih()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preklicane integer;
  v_ids        uuid[];
BEGIN
  -- Collect IDs of stale pending bookings
  SELECT array_agg(id)
    INTO v_ids
    FROM rezervacije
   WHERE status = 'cakanje'
     AND ustvarjeno < NOW() - INTERVAL '48 hours'
     AND datum_od > CURRENT_DATE; -- don't cancel bookings that already started

  IF v_ids IS NULL OR array_length(v_ids, 1) = 0 THEN
    RETURN jsonb_build_object('ok', true, 'preklicane', 0);
  END IF;

  UPDATE rezervacije
     SET status = 'preklicana',
         posodobljeno = NOW()
   WHERE id = ANY(v_ids);

  GET DIAGNOSTICS v_preklicane = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'preklicane', v_preklicane,
    'ids', to_jsonb(v_ids)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION cron_preklic_zastarelih TO service_role;

-- ── 5. RLS policies for new columns ──────────────────────────────────────────
-- upn_referenca is visible to the booking guest and the farm owner only.
-- (Assumes existing RLS is already set up on rezervacije)

-- ── 6. Index for cron query performance ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rezervacije_cakanje_staro
  ON rezervacije (ustvarjeno)
  WHERE status = 'cakanje';

-- ── 7. GiST index for fast overlap queries ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rezervacije_daterange_gist
  ON rezervacije USING gist (
    kmetija_id,
    daterange(datum_od, datum_do, '[)')
  )
  WHERE status IN ('cakanje', 'potrjena');
