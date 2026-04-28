-- =============================================================================
-- NaKmetiji.si — PostGIS Geospatial Foundation (opt-in)
-- Adds geography columns + GIST indices to kmetije + znamenitosti so that
-- proximity queries use mathematically precise great-circle distance instead
-- of the in-app Haversine. ST_DWithin is index-accelerated; the Haversine
-- map() in the app layer is O(N) over all rows.
--
-- SAFETY: this migration is fully idempotent and has THREE fallback layers:
--   1. CREATE EXTENSION IF NOT EXISTS postgis  — safe on Supabase Pro+;
--      Free tier may reject. The migration then exits cleanly with a NOTICE
--      and the application keeps using Haversine.
--   2. Generated columns are STORED — populated automatically when lat/lng
--      change. No app-layer write is ever needed.
--   3. The nearby_verified_landmarks() function checks for postgis presence
--      before running ST_DWithin and falls back to a numeric bbox heuristic.
-- =============================================================================

-- ─── 1. Try to enable PostGIS ──────────────────────────────────────────────
-- On Supabase, postgis must be enabled either via dashboard (Database →
-- Extensions) or via this CREATE EXTENSION call. The IF NOT EXISTS guard
-- makes the migration safe to re-run. If the role lacks privilege, the
-- statement raises NOTICE; we catch it via DO block.

DO $$
BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'postgis';
  IF NOT FOUND THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS postgis;
      RAISE NOTICE 'PostGIS enabled.';
    EXCEPTION WHEN insufficient_privilege OR feature_not_supported THEN
      RAISE WARNING 'PostGIS could not be enabled — falling back to Haversine. Enable PostGIS via the Supabase dashboard if you need spatial indices.';
      RETURN;
    END;
  END IF;
END $$;

-- Bail early if PostGIS still not present (so the rest of the migration is a no-op).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE NOTICE 'PostGIS not available — skipping spatial columns. App falls back to Haversine.';
    RETURN;
  END IF;

  -- ─── 2. kmetije.geog ────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kmetije' AND column_name = 'geog'
  ) THEN
    EXECUTE $sql$
      ALTER TABLE public.kmetije
        ADD COLUMN geog GEOGRAPHY(POINT, 4326)
        GENERATED ALWAYS AS (
          CASE
            WHEN lat IS NOT NULL AND lng IS NOT NULL
            THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
            ELSE NULL
          END
        ) STORED
    $sql$;
  END IF;

  -- GIST index for ST_DWithin / ST_Distance queries
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_kmetije_geog_gist
             ON public.kmetije USING GIST (geog)
             WHERE aktivna = true AND geog IS NOT NULL';

  -- ─── 3. znamenitosti.geog ───────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'znamenitosti' AND column_name = 'geog'
  ) THEN
    EXECUTE $sql$
      ALTER TABLE public.znamenitosti
        ADD COLUMN geog GEOGRAPHY(POINT, 4326)
        GENERATED ALWAYS AS (
          CASE
            WHEN lat IS NOT NULL AND lng IS NOT NULL
            THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
            ELSE NULL
          END
        ) STORED
    $sql$;
  END IF;

  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_znamenitosti_geog_gist
             ON public.znamenitosti USING GIST (geog)
             WHERE geog IS NOT NULL';

  -- ─── 4. Verification status column on znamenitosti ──────────────────────
  -- The grounding audit writes its findings here so the UI/API can prefer
  -- "verified" entries. New rows default to "unverified".
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'znamenitosti' AND column_name = 'verification_status'
  ) THEN
    EXECUTE $sql$
      ALTER TABLE public.znamenitosti
        ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified'
          CHECK (verification_status IN ('unverified','verified','flagged','removed')),
        ADD COLUMN verification_source TEXT,
        ADD COLUMN verification_distance_m INT,
        ADD COLUMN verified_at TIMESTAMPTZ
    $sql$;
  END IF;

  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_znamenitosti_verified
             ON public.znamenitosti (verification_status)';
END $$;

-- ─── 5. nearby_verified_landmarks() — RPC for the app ─────────────────────
-- The app calls this with (farm_lat, farm_lng, radius_m, only_verified=true)
-- and gets back an ordered list of landmarks. Wraps both PostGIS and a
-- numeric-bbox fallback so the same SQL works regardless.

CREATE OR REPLACE FUNCTION public.nearby_verified_landmarks(
  farm_lat DOUBLE PRECISION,
  farm_lng DOUBLE PRECISION,
  radius_m INT DEFAULT 30000,
  only_verified BOOLEAN DEFAULT FALSE,
  max_results INT DEFAULT 5
)
RETURNS TABLE (
  ime TEXT,
  kategorija TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  opis TEXT,
  zanimivost TEXT,
  distance_m DOUBLE PRECISION,
  verification_status TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Use PostGIS path if available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RETURN QUERY
      SELECT
        z.ime,
        z.kategorija,
        z.lat::DOUBLE PRECISION,
        z.lng::DOUBLE PRECISION,
        z.opis,
        z.zanimivost,
        ST_Distance(
          z.geog,
          ST_SetSRID(ST_MakePoint(farm_lng, farm_lat), 4326)::geography
        ) AS distance_m,
        z.verification_status
      FROM public.znamenitosti z
      WHERE z.geog IS NOT NULL
        AND z.verification_status <> 'removed'
        AND (NOT only_verified OR z.verification_status = 'verified')
        AND ST_DWithin(
          z.geog,
          ST_SetSRID(ST_MakePoint(farm_lng, farm_lat), 4326)::geography,
          radius_m
        )
      ORDER BY distance_m ASC
      LIMIT max_results;
    RETURN;
  END IF;

  -- ── Haversine-bbox fallback (no PostGIS) ──
  -- Cheap pre-filter by lat/lng bbox (~radius_m / 111000), then exact distance.
  DECLARE
    bbox_deg DOUBLE PRECISION := radius_m / 111000.0 + 0.05;
  BEGIN
    RETURN QUERY
      SELECT
        z.ime,
        z.kategorija,
        z.lat::DOUBLE PRECISION,
        z.lng::DOUBLE PRECISION,
        z.opis,
        z.zanimivost,
        2 * 6371000 * ASIN(SQRT(
          POWER(SIN(RADIANS((z.lat - farm_lat) / 2)), 2) +
          COS(RADIANS(farm_lat)) * COS(RADIANS(z.lat)) *
          POWER(SIN(RADIANS((z.lng - farm_lng) / 2)), 2)
        )) AS distance_m,
        COALESCE(z.verification_status, 'unverified') AS verification_status
      FROM public.znamenitosti z
      WHERE z.lat IS NOT NULL
        AND z.lng IS NOT NULL
        AND COALESCE(z.verification_status, 'unverified') <> 'removed'
        AND (NOT only_verified OR COALESCE(z.verification_status, 'unverified') = 'verified')
        AND z.lat BETWEEN farm_lat - bbox_deg AND farm_lat + bbox_deg
        AND z.lng BETWEEN farm_lng - bbox_deg AND farm_lng + bbox_deg
      ORDER BY distance_m ASC
      LIMIT max_results;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_verified_landmarks(
  DOUBLE PRECISION, DOUBLE PRECISION, INT, BOOLEAN, INT
) TO anon, authenticated;
