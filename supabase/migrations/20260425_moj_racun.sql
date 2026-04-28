-- =============================================================================
-- NaKmetiji.si — My Account tables
-- Adds guest-side state for the /moj-racun dashboard:
--   uporabnik_wishlist     — saved farms (per user)
--   uporabnik_roadtripi    — saved roadtrip plans (JSON snapshot)
-- Both RLS-scoped to owner; service role bypasses for admin analytics.
-- =============================================================================

-- ─── uporabnik_wishlist ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.uporabnik_wishlist (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kmetija_id  UUID NOT NULL REFERENCES public.kmetije(id) ON DELETE CASCADE,
  note        TEXT,
  ustvarjeno  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kmetija_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user
  ON public.uporabnik_wishlist (user_id, ustvarjeno DESC);

ALTER TABLE public.uporabnik_wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wishlist_self ON public.uporabnik_wishlist;
CREATE POLICY wishlist_self ON public.uporabnik_wishlist
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── uporabnik_roadtripi ───────────────────────────────────────────────────
-- Stores the Itinerary JSON produced by planRoadTrip() so the user can return
-- to it later. `plan` column holds the full JSON (stops, regions, total_km).
CREATE TABLE IF NOT EXISTS public.uporabnik_roadtripi (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  naslov       TEXT NOT NULL,
  regije       TEXT[] NOT NULL DEFAULT '{}',
  days         INT,
  plan         JSONB NOT NULL,
  share_slug   TEXT UNIQUE,
  ustvarjeno   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posodobljeno TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadtripi_user
  ON public.uporabnik_roadtripi (user_id, ustvarjeno DESC);

ALTER TABLE public.uporabnik_roadtripi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadtripi_self ON public.uporabnik_roadtripi;
CREATE POLICY roadtripi_self ON public.uporabnik_roadtripi
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Shared roadtrips are readable by anyone who knows the share_slug (public URL).
DROP POLICY IF EXISTS roadtripi_public_shared ON public.uporabnik_roadtripi;
CREATE POLICY roadtripi_public_shared ON public.uporabnik_roadtripi
  FOR SELECT TO anon, authenticated
  USING (share_slug IS NOT NULL);

-- Admin read for moderation
DROP POLICY IF EXISTS roadtripi_admin_read ON public.uporabnik_roadtripi;
CREATE POLICY roadtripi_admin_read ON public.uporabnik_roadtripi
  FOR SELECT TO authenticated
  USING (public.is_admin());
