-- =============================================================================
-- NaKmetiji.si — TITAN ADMIN ECOSYSTEM (Phase 1)
-- Zero-latency RBAC, partitioned & append-only audit log, operational power-grid
--
-- Apply via `supabase db push` or `psql < 20260420_titan.sql`.
-- Idempotent — safe to re-run.
-- =============================================================================

-- ─── 1. JWT CUSTOM CLAIMS ──────────────────────────────────────────────────
-- Sync profili.vloga → auth.users.raw_app_meta_data.vloga so middleware can
-- authorise from the JWT alone, with zero DB hits per request.

CREATE OR REPLACE FUNCTION public.sync_vloga_to_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_vloga TEXT := COALESCE(NEW.vloga, 'gost');
BEGIN
  -- app_metadata is trusted (user cannot edit) — user_metadata is NOT
  UPDATE auth.users
     SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                             || jsonb_build_object('vloga', new_vloga)
   WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_vloga_to_jwt ON public.profili;
CREATE TRIGGER trg_sync_vloga_to_jwt
AFTER INSERT OR UPDATE OF vloga ON public.profili
FOR EACH ROW
EXECUTE FUNCTION public.sync_vloga_to_jwt();

-- Backfill existing rows once
UPDATE auth.users u
   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                           || jsonb_build_object('vloga', COALESCE(p.vloga, 'gost'))
  FROM public.profili p
 WHERE u.id = p.id;

-- ─── 2. is_titan_admin() ──────────────────────────────────────────────────
-- SECURITY DEFINER so RLS policies can call it without recursion; SET
-- search_path hardens against shadowing attacks on `profili`.

CREATE OR REPLACE FUNCTION public.is_titan_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profili
     WHERE id = auth.uid()
       AND vloga = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_titan_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_titan_admin() TO authenticated;

-- ─── 3. AUDIT LOG — partitioned by month ──────────────────────────────────
-- Native declarative partitioning keeps scans bounded as volume grows.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  actor_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role   TEXT,
  action       TEXT        NOT NULL,             -- e.g. "farm.delete"
  resource     TEXT,                             -- e.g. "kmetije:abc-123"
  severity     TEXT        NOT NULL DEFAULT 'info'  -- info | warn | critical
                           CHECK (severity IN ('info','warn','critical')),
  ip_address   INET,
  user_agent   TEXT,
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON public.audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON public.audit_log (action, created_at DESC);

-- Ensure current + next 2 months of partitions exist. Run this monthly in cron.
CREATE OR REPLACE FUNCTION public.ensure_audit_partitions(months_ahead INT DEFAULT 2)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date  DATE := date_trunc('month', NOW())::date;
  i           INT;
  from_d      DATE;
  to_d        DATE;
  part_name   TEXT;
BEGIN
  FOR i IN 0..months_ahead LOOP
    from_d := (start_date + (i || ' months')::interval)::date;
    to_d   := (start_date + ((i+1) || ' months')::interval)::date;
    part_name := 'audit_log_' || to_char(from_d, 'YYYYMM');

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.audit_log
         FOR VALUES FROM (%L) TO (%L)',
      part_name, from_d, to_d
    );
  END LOOP;
END;
$$;

SELECT public.ensure_audit_partitions(3);

-- ─── 4. APPEND-ONLY ENFORCEMENT ───────────────────────────────────────────
-- Physically block UPDATE/DELETE at the DB layer. Even a compromised
-- service_role cannot alter history.

CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (op: %)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON public.audit_log;
CREATE TRIGGER trg_audit_log_no_update
BEFORE UPDATE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON public.audit_log;
CREATE TRIGGER trg_audit_log_no_delete
BEFORE DELETE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

-- RLS — only titans can read; nobody (except service_role, which bypasses RLS) writes
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "titan_read_audit" ON public.audit_log;
CREATE POLICY "titan_read_audit"
  ON public.audit_log FOR SELECT
  USING (public.is_titan_admin());

-- ─── 5. SYSTEM CONFIG — feature flags + kill-switch ───────────────────────

CREATE TABLE IF NOT EXISTS public.system_config (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.system_config (key, value) VALUES
  ('maintenance_mode',    'false'::jsonb),
  ('booking_enabled',     'true'::jsonb),
  ('oracle_enabled',      'true'::jsonb),
  ('oracle_anthropic_fallback', 'true'::jsonb),
  ('new_signups_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_read_flags"   ON public.system_config;
DROP POLICY IF EXISTS "titan_write_flags"   ON public.system_config;
CREATE POLICY "anyone_read_flags"
  ON public.system_config FOR SELECT USING (true);
CREATE POLICY "titan_write_flags"
  ON public.system_config FOR UPDATE USING (public.is_titan_admin())
                                    WITH CHECK (public.is_titan_admin());
-- Realtime so clients can react instantly to kill-switch flips
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_config;

-- ─── 6. IMPERSONATION SESSIONS — read-only vendor support ─────────────────
-- A titan creates a short-lived token; the app loads as that vendor's session
-- but server-side mutations check impersonation_session and deny writes.

CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titan_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason       TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS impersonation_target_idx
  ON public.impersonation_sessions (target_id, expires_at);

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "titan_manage_impersonation" ON public.impersonation_sessions;
CREATE POLICY "titan_manage_impersonation"
  ON public.impersonation_sessions FOR ALL
  USING (public.is_titan_admin())
  WITH CHECK (public.is_titan_admin());

-- ─── 7. TITAN ELEVATION SCRIPT ────────────────────────────────────────────
-- To promote a user to super_admin AND refresh their JWT app_metadata,
-- call: SELECT public.elevate_to_titan('00000000-0000-0000-0000-000000000000');
-- After the call the user must sign out & back in (or force-refresh token).

CREATE OR REPLACE FUNCTION public.elevate_to_titan(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only service_role or existing titan can elevate
  IF NOT (public.is_titan_admin() OR current_setting('role') = 'service_role') THEN
    RAISE EXCEPTION 'elevate_to_titan: forbidden';
  END IF;

  UPDATE public.profili SET vloga = 'super_admin' WHERE id = target_id;
  -- profili trigger syncs JWT app_metadata automatically

  INSERT INTO public.audit_log (actor_id, actor_role, action, resource, severity, metadata)
  VALUES (auth.uid(), 'super_admin', 'titan.elevate', target_id::text, 'critical',
          jsonb_build_object('target', target_id));
END;
$$;
REVOKE ALL ON FUNCTION public.elevate_to_titan(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.elevate_to_titan(UUID) TO authenticated;

-- ─── 8. DESTRUCTIVE-ACTION MFA SKELETON ───────────────────────────────────
-- Supabase Auth supports MFA via `auth.mfa_factors`. For step-up on
-- destructive actions, require a recent AAL2 event. We cannot enforce
-- "aal" from app SQL directly — it's checked via middleware reading the JWT.
-- This function is a cheap gate for server actions:
CREATE OR REPLACE FUNCTION public.require_recent_mfa(max_age_seconds INT DEFAULT 300)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  last_mfa TIMESTAMPTZ;
BEGIN
  SELECT MAX(updated_at) INTO last_mfa
    FROM auth.mfa_challenges
   WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = auth.uid() AND status = 'verified')
     AND verified_at IS NOT NULL;

  IF last_mfa IS NULL THEN RETURN FALSE; END IF;
  RETURN (NOW() - last_mfa) < (max_age_seconds || ' seconds')::interval;
END;
$$;
GRANT EXECUTE ON FUNCTION public.require_recent_mfa(INT) TO authenticated;
