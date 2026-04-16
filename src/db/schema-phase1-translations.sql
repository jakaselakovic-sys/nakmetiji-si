-- =============================================================================
-- NaKmetiji.si — Phase 1 Magic Vendor Suite
-- SQL posodobitev za shranjevanje večjezičnih prevodov preko "Storyteller" AI orodja
-- =============================================================================

-- Dodamo nov stolpec prevodi tipa JSONB v glavno tabelo kmetije.
-- Struktura pričakovanega JSON objekta: 
-- { "en": "English desc", "de": "German desc", "it": "Italian desc" }
ALTER TABLE public.kmetije 
ADD COLUMN IF NOT EXISTS prevodi JSONB DEFAULT '{}';

-- Opcijsko: priprava na vpeljavo dinamične premium stopnje za kmetije
-- Če stolpec premium še ne obstaja:
-- ALTER TABLE public.kmetije ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT FALSE;


ALTER TABLE public.mnenja ADD COLUMN IF NOT EXISTS verified_explorer BOOLEAN DEFAULT false;


-- Undo Mehanizem za Magic Vendor Suite
ALTER TABLE public.kmetije ADD COLUMN IF NOT EXISTS prevodi_backup JSONB DEFAULT '{}';
