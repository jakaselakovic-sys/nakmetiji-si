-- 3-Tier Monetization System (Free, Basic, Premium)
ALTER TABLE public.kmetije ADD COLUMN IF NOT EXISTS paket VARCHAR(20) DEFAULT 'free' CHECK (paket IN ('free', 'basic', 'premium'));

-- Migriramo staro "premium = true" v "paket = 'premium'"
UPDATE public.kmetije SET paket = 'premium' WHERE premium = true;
UPDATE public.kmetije SET paket = 'free' WHERE premium = false OR premium IS NULL;

-- Nastavimo indeks za hitro sortiranje glede na prioriteto paketa
-- Ureditev: premium (1), basic (2), free (3) - lahko nastavimo po abecedi nazaj ali ustvarimo funkcijo za custom sort
