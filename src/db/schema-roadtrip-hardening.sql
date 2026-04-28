-- =============================================================================
-- NaKmetiji.si — Road Trip Hardening Migration
-- 1. Explicit UNIQUE index on kmetije.slug (belt-and-suspenders)
-- 2. Ensure slug NOT NULL constraint is enforced
-- =============================================================================

-- The schema already has `slug VARCHAR(255) NOT NULL UNIQUE` but this index
-- provides explicit enforcement and faster lookups.
CREATE UNIQUE INDEX IF NOT EXISTS idx_kmetije_slug_unique 
ON public.kmetije (slug);

-- Same for dozivetja slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_dozivetja_slug_unique 
ON public.dozivetja (slug);
