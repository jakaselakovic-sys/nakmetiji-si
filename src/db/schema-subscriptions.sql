-- =============================================================================
-- NaKmetiji.si — Subscription Tiers Migration
-- Phase 1: Full 4-tier system (Korenine → Avtentičnost → Pospešek → Titan Elite)
-- =============================================================================

-- ─── 1. ENUM: Naročniški paketi ─────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE kmetija_paket_enum AS ENUM (
    'korenine',        -- Free tier (tier_rang = 0)
    'avtenticnost',    -- €12/month  (tier_rang = 1)
    'posesek',         -- €29/month  (tier_rang = 2)
    'titan_elite'      -- €49/month  (tier_rang = 3)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Add columns to kmetije ──────────────────────────────────────────────

-- Replace old VARCHAR paket column with proper enum + computed tier_rang
ALTER TABLE public.kmetije
  ADD COLUMN IF NOT EXISTS paket kmetija_paket_enum NOT NULL DEFAULT 'korenine';

-- tier_rang is a computed column for ORDER BY (0–3 mapping)
ALTER TABLE public.kmetije
  ADD COLUMN IF NOT EXISTS tier_rang SMALLINT NOT NULL DEFAULT 0;

-- Migrate old data: premium=true → posesek (tier 2), premium=false → korenine
UPDATE public.kmetije SET paket = 'posesek', tier_rang = 2 WHERE premium = true AND paket = 'korenine';
UPDATE public.kmetije SET paket = 'korenine', tier_rang = 0 WHERE premium = false AND paket = 'korenine';

-- Index for fast tier-based sorting
CREATE INDEX IF NOT EXISTS idx_kmetije_tier_rang ON public.kmetije (tier_rang DESC);
CREATE INDEX IF NOT EXISTS idx_kmetije_paket ON public.kmetije (paket);

-- ─── 3. Subscriptions table ─────────────────────────────────────────────────
-- Admin-managed for now (no Stripe). Records who has what tier and until when.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kmetija_id        UUID NOT NULL REFERENCES public.kmetije(id) ON DELETE CASCADE,
  tier              kmetija_paket_enum NOT NULL DEFAULT 'korenine',
  video_discount_rate DECIMAL(4,3) NOT NULL DEFAULT 0.000,  -- 0.000 – 0.100
  is_priority_search  BOOLEAN NOT NULL DEFAULT FALSE,
  active_until      TIMESTAMPTZ,  -- NULL = indefinite (free tier)
  created_by        UUID,         -- admin who set it
  notes             TEXT,         -- admin notes

  ustvarjeno        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posodobljeno      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (kmetija_id)  -- one subscription per farm
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners can read their own subscription. Public search uses denormalized
-- kmetije.paket/tier_rang, not raw subscription rows.
CREATE POLICY "Javno branje naročnin" ON public.subscriptions
  FOR SELECT USING (
    kmetija_id IN (SELECT id FROM public.kmetije WHERE lastnik_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
  );

-- Trigger to sync tier_rang on kmetije when subscription changes
CREATE OR REPLACE FUNCTION sync_tier_rang()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.kmetije
  SET
    tier_rang = CASE NEW.tier
      WHEN 'korenine'      THEN 0
      WHEN 'avtenticnost'  THEN 1
      WHEN 'posesek'       THEN 2
      WHEN 'titan_elite'   THEN 3
      ELSE 0
    END,
    paket = NEW.tier,
    premium = (NEW.tier IN ('posesek', 'titan_elite'))
  WHERE id = NEW.kmetija_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_tier_rang
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_tier_rang();

-- Auto-update posodobljeno
CREATE OR REPLACE TRIGGER trg_subscriptions_posodobljeno
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION posodobi_timestamp();

-- ─── 4. Index for subscription lookup ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_subscriptions_kmetija ON public.subscriptions (kmetija_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON public.subscriptions (tier);
