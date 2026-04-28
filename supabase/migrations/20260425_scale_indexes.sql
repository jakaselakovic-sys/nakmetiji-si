-- =============================================================================
-- NaKmetiji.si — Scale Indexes for 10k Farms
-- Target workload:
--   1. Oracle hot path: .eq('aktivna', true).eq('regija', X) — every AI query
--   2. Map marker fetch: bounding-box .gte/.lte on (lat, lng)
--   3. Haversine enrichment: scans all znamenitosti per farm — covered by
--      20260412 idx_znamenitosti_lat_lng but no spatial index yet
--   4. Oracle audit — oracle_logs queries by (regija, created_at)
-- Apply via `supabase db push`. Idempotent.
-- =============================================================================

-- ─── 1. Farm list hot path ─────────────────────────────────────────────────
-- Oracle route fires: SELECT ... FROM kmetije WHERE aktivna=true AND regija=X
-- Without a composite index, each Oracle call sequence-scans kmetije once
-- filter passes 100 rows. At 10k rows this becomes ~20ms per query.

CREATE INDEX IF NOT EXISTS idx_kmetije_aktivna_regija
  ON public.kmetije (aktivna, regija)
  WHERE aktivna = true;

-- ─── 2. Map bounding-box fetch ─────────────────────────────────────────────
-- MapPageClient does: .gte('lat', sw).lte('lat', ne).gte('lng', sw).lte('lng', ne)
-- A composite (lat, lng) helps when lat selectivity is high (north/south zoom).
-- For general 2D range, the proper tool is PostGIS gist — we don't require the
-- extension here, but leave a comment so the migration to gist is a one-liner
-- if/when PostGIS is enabled.

CREATE INDEX IF NOT EXISTS idx_kmetije_lat_lng
  ON public.kmetije (lat, lng)
  WHERE aktivna = true AND lat IS NOT NULL AND lng IS NOT NULL;

-- PostGIS upgrade path (commented — enable when extension is installed):
--   CREATE EXTENSION IF NOT EXISTS postgis;
--   ALTER TABLE public.kmetije ADD COLUMN geo GEOGRAPHY(Point, 4326)
--     GENERATED ALWAYS AS (ST_MakePoint(lng, lat)::geography) STORED;
--   CREATE INDEX idx_kmetije_geo_gist ON public.kmetije USING GIST (geo)
--     WHERE aktivna = true;

-- ─── 3. Ordering by rating within a region ─────────────────────────────────
-- Used by smart-fallback (.in('regija', neighbors).order('premium').order('ocena'))
-- and by homepage FeaturedFarms.

CREATE INDEX IF NOT EXISTS idx_kmetije_regija_premium_ocena
  ON public.kmetije (regija, premium DESC, ocena DESC NULLS LAST)
  WHERE aktivna = true;

-- ─── 4. Oracle query log analytics ─────────────────────────────────────────
-- Admins will want: queries per region per day, top vibes, conversion funnel.
-- Existing oracle_logs likely has only (created_at) — add the analytics combos.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'oracle_logs') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_oracle_logs_regija_created
               ON public.oracle_logs (regija, created_at DESC)
               WHERE regija IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_oracle_logs_created
               ON public.oracle_logs (created_at DESC)';
  END IF;
END $$;

-- ─── 5. Green stamps — user dashboard + farm analytics ─────────────────────
-- gost_id: "show my stamps" — covered by PK/unique already; farm analytics
-- wants kmetija_id + ustvarjeno for time-series.
-- (Column is `ustvarjeno`, Slovenian convention — see 20260412_znamenitosti_green_stamps.sql)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'green_stamps') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_green_stamps_kmetija_ustvarjeno
               ON public.green_stamps (kmetija_id, ustvarjeno DESC)';
  END IF;
END $$;

-- ─── 6. Rezervacije — owner dashboard hot path ─────────────────────────────
-- Owner opens /dashboard → fetch all bookings for their farm sorted by date.

CREATE INDEX IF NOT EXISTS idx_rezervacije_kmetija_datum
  ON public.rezervacije (kmetija_id, datum_od DESC);

-- ─── 7. Mnenja — approved reviews per farm ─────────────────────────────────
-- Public farm profile fetches .eq('status','odobreno').order('datum desc').
-- Column name is `datum` (not `created_at`) — see schema-v2.sql.

CREATE INDEX IF NOT EXISTS idx_mnenja_kmetija_status_datum
  ON public.mnenja (kmetija_id, status, datum DESC)
  WHERE status = 'odobreno';

-- ─── 8. Analysis helper — VACUUM + ANALYZE after bulk import ───────────────
-- Run manually after 10k-farm backfill:
--   VACUUM ANALYZE public.kmetije;
--   VACUUM ANALYZE public.oracle_logs;
-- (No SQL needed in migration itself — left as operator note.)
