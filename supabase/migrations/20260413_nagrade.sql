-- =============================================================================
-- NaKmetiji.si — Automated Rewards (nagrade)
-- Migration: 20260413_nagrade
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.nagrade (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_name   TEXT         NOT NULL,
  status       TEXT         NOT NULL DEFAULT 'caka'
                            CHECK (status IN ('caka','odobreno','zavrnjeno')),
  opomba       TEXT,                          -- admin note
  ustvarjeno   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  posodobljeno TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- One pending/approved claim per level per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_nagrade_user_level_active
  ON public.nagrade (user_id, level_name)
  WHERE status IN ('caka', 'odobreno');

CREATE INDEX IF NOT EXISTS idx_nagrade_user_id ON public.nagrade (user_id);
CREATE INDEX IF NOT EXISTS idx_nagrade_status  ON public.nagrade (status);

ALTER TABLE public.nagrade ENABLE ROW LEVEL SECURITY;

-- User can read own claims
CREATE POLICY "nagrade_select_own" ON public.nagrade
  FOR SELECT USING (auth.uid() = user_id);

-- User can insert own claims
CREATE POLICY "nagrade_insert_own" ON public.nagrade
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can manage all claims
CREATE POLICY "nagrade_admin_all" ON public.nagrade
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
  );
