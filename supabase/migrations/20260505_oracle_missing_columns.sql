-- =============================================================================
-- NaKmetiji.si — Oracle: missing kmetije columns + oracle_logs table
-- Fixes: cena_noc, max_gostov (used by Oracle SELECT & atomic booking),
--        oracle_logs (used by POST /api/oracle for query audit trail).
-- =============================================================================

-- ─── 1. kmetije: price + capacity columns ────────────────────────────────────
-- These columns are selected by FARM_SELECT_FIELDS in the Oracle route and
-- referenced by the atomic booking stored procedure. Without them, the Supabase
-- query returns an error and the Oracle shows "no farms found".

ALTER TABLE public.kmetije
  ADD COLUMN IF NOT EXISTS cena_noc   DECIMAL(8, 2) CHECK (cena_noc >= 0),
  ADD COLUMN IF NOT EXISTS max_gostov INTEGER       CHECK (max_gostov >= 1);

CREATE INDEX IF NOT EXISTS idx_kmetije_cena_noc
  ON public.kmetije (cena_noc)
  WHERE cena_noc IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kmetije_max_gostov
  ON public.kmetije (max_gostov)
  WHERE max_gostov IS NOT NULL;

-- ─── 2. oracle_logs: AI query audit trail ────────────────────────────────────
-- Created here because: 20260419_rls_audit.sql and 20260425_scale_indexes.sql
-- reference this table (IF EXISTS guards) but never create it.

CREATE TABLE IF NOT EXISTS public.oracle_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  query       TEXT        NOT NULL,
  locale      TEXT,
  vibes       TEXT[]      DEFAULT '{}',
  regija      TEXT,
  ip          TEXT,
  ustvarjeno  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Super-admin read; service-role writes bypass RLS
ALTER TABLE public.oracle_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS oracle_logs_select_admin ON public.oracle_logs;
CREATE POLICY oracle_logs_select_admin ON public.oracle_logs
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
  );

-- Indexes referenced in 20260425_scale_indexes.sql
CREATE INDEX IF NOT EXISTS idx_oracle_logs_regija_created
  ON public.oracle_logs (regija, ustvarjeno DESC)
  WHERE regija IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_oracle_logs_created
  ON public.oracle_logs (ustvarjeno DESC);
