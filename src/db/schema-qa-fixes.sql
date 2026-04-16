-- =============================================================================
-- NaKmetiji.si — E2E Security QA Fixes
-- Rešuje "Race Condition" pri deljenju Green Passport žigov.
-- =============================================================================

-- S tem UNIKATNIM INDEKSOM absolutno preprečimo "Veselica Constraint" napako.
-- Ker DATE() casting iz TIMESTAMPTZ ni "immutable" (odvisen je od trenutne časovne cone),
-- moramo uporabiti fiksno časovno cono (UTC), ki je sistemsko immutable.

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_stamps_daily 
ON public.green_stamps (gost_id, kmetija_id, (CAST(ustvarjeno AT TIME ZONE 'UTC' AS DATE)));

-- Opomba: Posledično bo zdaj naša funkcija claim_green_stamp v `schema-zero-trust.sql`
-- ZAGOTOVO ujela izjemo "unique_violation", ne glede na to, koliko zahtevkov pride v isti milisekundi.
