-- =============================================================================
-- NaKmetiji.si — Add UNIQUE constraint on kmetije.slug
--
-- Prevents two farms from having the same slug (race condition during
-- simultaneous submissions). The slugify() function already appends
-- a random suffix, so collisions are extremely rare — this is a safety net.
--
-- Also adds an index on slug for faster lookups (used on every farm page load).
-- =============================================================================

-- Create unique index (idempotent — IF NOT EXISTS prevents duplicate errors)
CREATE UNIQUE INDEX IF NOT EXISTS idx_kmetije_slug_unique ON kmetije (slug);

-- Add explicit constraint for clearer error messages
ALTER TABLE kmetije
  ADD CONSTRAINT kmetije_slug_unique UNIQUE USING INDEX idx_kmetije_slug_unique;
