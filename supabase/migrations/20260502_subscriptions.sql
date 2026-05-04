-- =============================================================================
-- NaKmetiji.si — Subscription Tiers & Search Ranking
-- Run this migration in Supabase SQL Editor.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.tier_rank(p_tier text)
RETURNS smallint
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'titan_elite' THEN 3
    WHEN 'posesek' THEN 2
    WHEN 'avtenticnost' THEN 1
    ELSE 0
  END
$$;

CREATE OR REPLACE FUNCTION public.tier_video_discount(p_tier text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'titan_elite' THEN 0.10
    WHEN 'posesek' THEN 0.05
    WHEN 'avtenticnost' THEN 0.025
    ELSE 0.00
  END
$$;

-- 1. Add tier columns to kmetije (paket + tier_rang for fast ordering)
ALTER TABLE kmetije
  ADD COLUMN IF NOT EXISTS paket TEXT NOT NULL DEFAULT 'korenine',
  ADD COLUMN IF NOT EXISTS tier_rang SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE kmetije
  DROP CONSTRAINT IF EXISTS kmetije_paket_check;

ALTER TABLE kmetije
  ADD CONSTRAINT kmetije_paket_check
  CHECK (paket IN ('korenine', 'avtenticnost', 'posesek', 'titan_elite'));

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kmetija_id          UUID        NOT NULL REFERENCES kmetije(id) ON DELETE CASCADE,
  tier                TEXT        NOT NULL DEFAULT 'korenine',
  video_discount_rate FLOAT       NOT NULL DEFAULT 0.0,
  is_priority_search  BOOLEAN     NOT NULL DEFAULT false,
  active_until        TIMESTAMPTZ,
  ustvarjeno          TIMESTAMPTZ NOT NULL DEFAULT now(),
  posodobljeno        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kmetija_id),
  CONSTRAINT sub_tier_check     CHECK (tier IN ('korenine', 'avtenticnost', 'posesek', 'titan_elite')),
  CONSTRAINT sub_discount_check CHECK (video_discount_rate >= 0.0 AND video_discount_rate <= 0.10)
);

-- 3. RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lastnik_read_own" ON subscriptions;
CREATE POLICY "lastnik_read_own" ON subscriptions
  FOR SELECT USING (
    kmetija_id IN (SELECT id FROM kmetije WHERE lastnik_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_all" ON subscriptions;
CREATE POLICY "admin_all" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profili WHERE id = auth.uid() AND vloga = 'super_admin')
  );

-- 4. Function: set_subscription — atomically updates subscriptions + kmetije.paket/tier_rang
CREATE OR REPLACE FUNCTION set_subscription(
  p_kmetija_id UUID,
  p_tier       TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount FLOAT;
  v_rang     SMALLINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profili
    WHERE id = auth.uid() AND vloga = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_tier NOT IN ('korenine', 'avtenticnost', 'posesek', 'titan_elite') THEN
    RAISE EXCEPTION 'invalid tier: %', p_tier;
  END IF;

  -- Map tier through canonical SQL helpers.
  v_discount := public.tier_video_discount(p_tier);
  v_rang := public.tier_rank(p_tier);

  -- Upsert subscription record
  INSERT INTO subscriptions (kmetija_id, tier, video_discount_rate, is_priority_search, posodobljeno)
  VALUES (
    p_kmetija_id,
    p_tier,
    v_discount,
    (p_tier IN ('posesek', 'titan_elite')),
    now()
  )
  ON CONFLICT (kmetija_id) DO UPDATE SET
    tier                = EXCLUDED.tier,
    video_discount_rate = EXCLUDED.video_discount_rate,
    is_priority_search  = EXCLUDED.is_priority_search,
    posodobljeno        = now();

  -- Denormalise onto kmetije for fast ORDER BY
  UPDATE kmetije
  SET paket     = p_tier,
      tier_rang = v_rang
  WHERE id = p_kmetija_id;
END;
$$;

REVOKE ALL ON FUNCTION set_subscription(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_subscription(UUID, TEXT) TO authenticated;

-- 5. Performance index for tier-ranked search
DROP INDEX IF EXISTS idx_kmetije_tier_search;
CREATE INDEX idx_kmetije_tier_search
  ON kmetije (tier_rang DESC, ocena DESC NULLS LAST)
  WHERE aktivna = true;
