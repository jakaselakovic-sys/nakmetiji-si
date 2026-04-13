-- =============================================================================
-- NaKmetiji.si — Premium Subscriptions + Reward Codes
-- Migration: 20260413_premium_rewards
-- Run after: 20260413_nagrade.sql
-- =============================================================================

-- ── 1. premium_until on kmetije ──────────────────────────────────────────────
-- Tracks when a premium subscription expires. NULL = not premium.
ALTER TABLE public.kmetije
  ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;

-- Index for cron job that auto-expires premium
CREATE INDEX IF NOT EXISTS idx_kmetije_premium_until
  ON public.kmetije (premium_until)
  WHERE premium_until IS NOT NULL;

-- ── 2. reward_code on nagrade ────────────────────────────────────────────────
-- Human-readable unique code shown to the user after a successful claim.
ALTER TABLE public.nagrade
  ADD COLUMN IF NOT EXISTS reward_code TEXT UNIQUE;

-- ── 3. premium_narocnine — subscription history ───────────────────────────────
-- Each row = one subscription period. Enables future audits + refunds.
CREATE TABLE IF NOT EXISTS public.premium_narocnine (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  kmetija_id   UUID         NOT NULL REFERENCES public.kmetije(id) ON DELETE CASCADE,
  user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan         TEXT         NOT NULL DEFAULT 'mesecna'
                            CHECK (plan IN ('mesecna', 'letna', 'promo')),
  zacetek      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  konec        TIMESTAMPTZ  NOT NULL,
  aktiven      BOOLEAN      NOT NULL DEFAULT true,
  cena_eur     NUMERIC(8,2),
  ustvarjeno   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_narocnine_kmetija ON public.premium_narocnine (kmetija_id);
CREATE INDEX IF NOT EXISTS idx_narocnine_user    ON public.premium_narocnine (user_id);
CREATE INDEX IF NOT EXISTS idx_narocnine_konec   ON public.premium_narocnine (konec) WHERE aktiven = true;

ALTER TABLE public.premium_narocnine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "narocnine_select_own" ON public.premium_narocnine
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "narocnine_admin_all" ON public.premium_narocnine
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
  );

-- ── 4. Cron helper: auto-expire premium farms ─────────────────────────────────
-- Call this from /api/cron/cleanup-bookings or a dedicated cron.
-- Updates kmetije.premium = false where premium_until has passed.
-- Safe to run multiple times (idempotent).
CREATE OR REPLACE FUNCTION public.expire_premium_farms()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.kmetije
  SET premium = false, premium_until = NULL, posodobljeno = NOW()
  WHERE premium = true
    AND premium_until IS NOT NULL
    AND premium_until < NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
