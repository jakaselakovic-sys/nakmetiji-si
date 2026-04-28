-- =============================================================================
-- NaKmetiji.si — Jožetova Kronika
-- Weekly digest email: new farms + seasonal notes + proverb of the week.
-- Tables:
--   kronika_entries      — immutable weekly issues (auto-generated)
--   kronika_subscribers  — opt-in mailing list (double-opt-in later)
-- Only admin generates + sends; anyone can subscribe; nobody reads entries
-- except admins (each issue has a public share URL served by the app layer).
-- =============================================================================

-- ─── kronika_entries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kronika_entries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number  INT         NOT NULL,                    -- 1, 2, 3...
  slug          TEXT        NOT NULL UNIQUE,             -- "kronika-2026-w17"
  published_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  week_start    DATE        NOT NULL,
  week_end      DATE        NOT NULL,
  title         TEXT        NOT NULL,
  intro         TEXT        NOT NULL,
  new_farm_ids  UUID[]      NOT NULL DEFAULT '{}',
  proverb       TEXT        NOT NULL,
  proverb_register TEXT,
  body_md       TEXT        NOT NULL,                    -- rendered markdown
  sent_count    INT         NOT NULL DEFAULT 0,
  created_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK (week_end > week_start),
  CHECK (sent_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_kronika_published_at
  ON public.kronika_entries (published_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kronika_issue_number
  ON public.kronika_entries (issue_number);

ALTER TABLE public.kronika_entries ENABLE ROW LEVEL SECURITY;

-- Publicly readable — each issue has a shareable URL /kronika/[slug]
DROP POLICY IF EXISTS kronika_entries_public_read ON public.kronika_entries;
CREATE POLICY kronika_entries_public_read
  ON public.kronika_entries FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL);

-- Only admins can insert/update (generator runs via service role anyway)
DROP POLICY IF EXISTS kronika_entries_admin_write ON public.kronika_entries;
CREATE POLICY kronika_entries_admin_write
  ON public.kronika_entries FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── kronika_subscribers ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kronika_subscribers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  locale        TEXT        NOT NULL DEFAULT 'sl' CHECK (locale IN ('sl','en','de','it')),
  confirmed_at  TIMESTAMPTZ,
  confirm_token TEXT,
  unsubscribed_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address    INET,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_kronika_subs_confirmed
  ON public.kronika_subscribers (confirmed_at)
  WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;

ALTER TABLE public.kronika_subscribers ENABLE ROW LEVEL SECURITY;

-- Public can INSERT (signup) — email uniqueness handles double-submit;
-- confirmation happens via a token in an email link handled app-side.
DROP POLICY IF EXISTS kronika_subs_public_insert ON public.kronika_subscribers;
CREATE POLICY kronika_subs_public_insert
  ON public.kronika_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (
    -- Anon signups must leave user_id null; authed users may attach theirs
    (auth.uid() IS NULL AND user_id IS NULL)
    OR user_id = auth.uid()
  );

-- Subscribers can read/update their own row (for unsubscribe link flow) —
-- the public unsubscribe endpoint uses the service role + confirm_token.
-- Admins can read everything for analytics.
DROP POLICY IF EXISTS kronika_subs_self_read ON public.kronika_subscribers;
CREATE POLICY kronika_subs_self_read
  ON public.kronika_subscribers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS kronika_subs_admin_update ON public.kronika_subscribers;
CREATE POLICY kronika_subs_admin_update
  ON public.kronika_subscribers FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── helpers ───────────────────────────────────────────────────────────────
-- Next issue number — called by the generator in a transaction.
CREATE OR REPLACE FUNCTION public.kronika_next_issue_number()
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(issue_number), 0) + 1 FROM public.kronika_entries;
$$;
GRANT EXECUTE ON FUNCTION public.kronika_next_issue_number() TO authenticated;
