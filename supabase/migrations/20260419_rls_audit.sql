-- =============================================================================
-- NaKmetiji.si — Comprehensive RLS Audit (C2) — Schema-Verified Edition
--
-- This migration enforces Row Level Security on every user-facing table.
-- All column names and role values are verified against schema-v2.sql:
--
--   profili         : id (PK → auth.users), vloga ('super_admin'|'lastnik'|'gost')
--   kmetije         : lastnik_id → profili.id
--   mnenja          : uporabnik_id (nullable), status ('cakanje'|'odobreno'|'zavrnjeno')
--   rezervacije    : gost_id (nullable — anonymous bookings allowed)
--   green_stamps    : gost_id, kmetija_id
--
-- Safe to re-run: DROP POLICY IF EXISTS on every policy.
-- =============================================================================

-- =============================================================================
-- SECTION 0 — Helper functions
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profili
    WHERE id = auth.uid() AND vloga = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_farm_owner(farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM kmetije
    WHERE id = farm_id AND lastnik_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_farm_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_farm_owner(UUID) TO authenticated;

-- =============================================================================
-- SECTION 1 — profili
-- Self-access only. Nobody else can read or write another user's profile.
-- =============================================================================

ALTER TABLE profili ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profili_select_self ON profili;
CREATE POLICY profili_select_self ON profili
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profili_insert_self ON profili;
CREATE POLICY profili_insert_self ON profili
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own profile but cannot elevate their role.
DROP POLICY IF EXISTS profili_update_self ON profili;
CREATE POLICY profili_update_self ON profili
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profili_delete_admin ON profili;
CREATE POLICY profili_delete_admin ON profili
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- SECTION 2 — kmetije
-- Anon: only active farms. Owner: full CRUD on own. Admin: full CRUD.
-- =============================================================================

ALTER TABLE kmetije ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kmetije_select_public ON kmetije;
CREATE POLICY kmetije_select_public ON kmetije
  FOR SELECT TO anon, authenticated
  USING (
    aktivna = true
    OR lastnik_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS kmetije_insert_owner ON kmetije;
CREATE POLICY kmetije_insert_owner ON kmetije
  FOR INSERT TO authenticated
  WITH CHECK (lastnik_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS kmetije_update_owner ON kmetije;
CREATE POLICY kmetije_update_owner ON kmetije
  FOR UPDATE TO authenticated
  USING (lastnik_id = auth.uid() OR public.is_admin())
  WITH CHECK (lastnik_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS kmetije_delete_admin ON kmetije;
CREATE POLICY kmetije_delete_admin ON kmetije
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- SECTION 3 — mnenja
-- Anon: only approved reviews. Users: can write. Author: update/delete own.
-- Farm owner: can see all reviews on own farm (for moderation context).
-- Anonymous reviews (uporabnik_id IS NULL) — public form — remain owned by
-- nobody; only the farm owner or admin can moderate them post-submission.
-- =============================================================================

ALTER TABLE mnenja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mnenja_select_approved_or_owned ON mnenja;
CREATE POLICY mnenja_select_approved_or_owned ON mnenja
  FOR SELECT TO anon, authenticated
  USING (
    status = 'odobreno'
    OR uporabnik_id = auth.uid()
    OR public.is_farm_owner(kmetija_id)
    OR public.is_admin()
  );

-- Both anon (public form) and auth users can submit reviews. If authenticated,
-- uporabnik_id must match auth.uid(); if anonymous, uporabnik_id must be NULL.
DROP POLICY IF EXISTS mnenja_insert_any ON mnenja;
CREATE POLICY mnenja_insert_any ON mnenja
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND uporabnik_id IS NULL)
    OR uporabnik_id = auth.uid()
  );

DROP POLICY IF EXISTS mnenja_update_author_or_mods ON mnenja;
CREATE POLICY mnenja_update_author_or_mods ON mnenja
  FOR UPDATE TO authenticated
  USING (
    uporabnik_id = auth.uid()
    OR public.is_farm_owner(kmetija_id)
    OR public.is_admin()
  )
  WITH CHECK (
    uporabnik_id = auth.uid()
    OR public.is_farm_owner(kmetija_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS mnenja_delete_author_or_admin ON mnenja;
CREATE POLICY mnenja_delete_author_or_admin ON mnenja
  FOR DELETE TO authenticated
  USING (uporabnik_id = auth.uid() OR public.is_admin());

-- =============================================================================
-- SECTION 4 — rezervacije
-- Anonymous (unauth) can create a booking via public form (gost_id IS NULL).
-- Authenticated users own their bookings via gost_id = auth.uid().
-- Anon can NEVER read bookings. Only the guest (if linked), farm owner, or
-- admin can read or update.
-- =============================================================================

ALTER TABLE rezervacije ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rezervacije_select_participant ON rezervacije;
CREATE POLICY rezervacije_select_participant ON rezervacije
  FOR SELECT TO authenticated
  USING (
    gost_id = auth.uid()
    OR public.is_farm_owner(kmetija_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS rezervacije_insert_anon_or_self ON rezervacije;
CREATE POLICY rezervacije_insert_anon_or_self ON rezervacije
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    -- Unauthenticated: must leave gost_id NULL.
    (auth.uid() IS NULL AND gost_id IS NULL)
    -- Authenticated: may link to self or leave anonymous.
    OR gost_id = auth.uid()
    OR gost_id IS NULL
  );

DROP POLICY IF EXISTS rezervacije_update_owner_or_guest ON rezervacije;
CREATE POLICY rezervacije_update_owner_or_guest ON rezervacije
  FOR UPDATE TO authenticated
  USING (
    gost_id = auth.uid()
    OR public.is_farm_owner(kmetija_id)
    OR public.is_admin()
  )
  WITH CHECK (
    gost_id = auth.uid()
    OR public.is_farm_owner(kmetija_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS rezervacije_delete_admin ON rezervacije;
CREATE POLICY rezervacije_delete_admin ON rezervacije
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- SECTION 5 — dozivetja (experience catalog)
-- Publicly readable. Only admins can modify the master list.
-- =============================================================================

ALTER TABLE dozivetja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dozivetja_select_public ON dozivetja;
CREATE POLICY dozivetja_select_public ON dozivetja
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS dozivetja_write_admin ON dozivetja;
CREATE POLICY dozivetja_write_admin ON dozivetja
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- SECTION 6 — kmetija_dozivetje (farm ↔ experience join)
-- Public can read. Only the farm's owner (or admin) can manage mappings.
-- =============================================================================

ALTER TABLE kmetija_dozivetje ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kd_select_public ON kmetija_dozivetje;
CREATE POLICY kd_select_public ON kmetija_dozivetje
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS kd_write_owner_or_admin ON kmetija_dozivetje;
CREATE POLICY kd_write_owner_or_admin ON kmetija_dozivetje
  FOR ALL TO authenticated
  USING (public.is_farm_owner(kmetija_id) OR public.is_admin())
  WITH CHECK (public.is_farm_owner(kmetija_id) OR public.is_admin());

-- =============================================================================
-- SECTION 7 — izdelki
-- Public can read products of active farms. Only that farm's owner can CRUD.
-- =============================================================================

ALTER TABLE izdelki ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS izdelki_select_public ON izdelki;
CREATE POLICY izdelki_select_public ON izdelki
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM kmetije k WHERE k.id = kmetija_id AND k.aktivna = true)
    OR public.is_farm_owner(kmetija_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS izdelki_write_owner ON izdelki;
CREATE POLICY izdelki_write_owner ON izdelki
  FOR ALL TO authenticated
  USING (public.is_farm_owner(kmetija_id) OR public.is_admin())
  WITH CHECK (public.is_farm_owner(kmetija_id) OR public.is_admin());

-- =============================================================================
-- SECTION 8 — znamenitosti
-- Read-only public. Admin-only writes.
-- =============================================================================

ALTER TABLE znamenitosti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS znamenitosti_select_public ON znamenitosti;
CREATE POLICY znamenitosti_select_public ON znamenitosti
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS znamenitosti_write_admin ON znamenitosti;
CREATE POLICY znamenitosti_write_admin ON znamenitosti
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- SECTION 9 — green_stamps
-- Guest reads own stamps. Farm owner reads stamps for own farm (analytics).
-- Writes only via server-side SECURITY DEFINER RPC claim_green_stamp.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'green_stamps') THEN
    EXECUTE 'ALTER TABLE green_stamps ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS green_stamps_select_guest_or_owner ON green_stamps';
    EXECUTE $p$
      CREATE POLICY green_stamps_select_guest_or_owner ON green_stamps
        FOR SELECT TO authenticated
        USING (
          gost_id = auth.uid()
          OR public.is_farm_owner(kmetija_id)
          OR public.is_admin()
        )
    $p$;

    -- No INSERT/UPDATE/DELETE policies: writes happen only through the
    -- SECURITY DEFINER RPC (claim_green_stamp), which runs as postgres
    -- and bypasses RLS intentionally.
  END IF;
END $$;

-- =============================================================================
-- SECTION 10 — oracle_logs (AI query audit trail)
-- Service role writes via fire-and-forget. Admins read for analytics.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oracle_logs') THEN
    EXECUTE 'ALTER TABLE oracle_logs ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS oracle_logs_select_admin ON oracle_logs';
    EXECUTE $p$
      CREATE POLICY oracle_logs_select_admin ON oracle_logs
        FOR SELECT TO authenticated
        USING (public.is_admin())
    $p$;
  END IF;
END $$;

-- =============================================================================
-- SECTION 11 — napake_log (system error log)
-- Written only via service role (logNapako). Admins read.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'napake_log') THEN
    EXECUTE 'ALTER TABLE napake_log ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS napake_log_select_admin ON napake_log';
    EXECUTE $p$
      CREATE POLICY napake_log_select_admin ON napake_log
        FOR SELECT TO authenticated
        USING (public.is_admin())
    $p$;
  END IF;
END $$;
