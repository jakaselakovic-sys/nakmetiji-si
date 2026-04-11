-- =============================================================================
-- NaKmetiji.si — Green Passport Ecosystem
-- Dodatne tabele za gamifikacijo in B2C viralnost
-- Poženi v Supabase SQL Editor
-- =============================================================================

-- ─── Green Badges (Značke za kmetije) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.green_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ime         TEXT NOT NULL,
  opis        TEXT,
  ikona       TEXT, -- Ime Lucide ikone, npr. 'Leaf', 'Award'
  stopnja     INTEGER DEFAULT 1, -- Zahtevnost: 1 (osnovno) do 3 (prestizno)
  ustvarjeno  TIMESTAMPTZ DEFAULT NOW()
);

-- Kmetija pridobi določeno značko (Admin/Sistem dodeli)
CREATE TABLE IF NOT EXISTS public.kmetija_green_badges (
  kmetija_id  UUID REFERENCES public.kmetije(id) ON DELETE CASCADE,
  badge_id    UUID REFERENCES public.green_badges(id) ON DELETE CASCADE,
  dodeljeno   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (kmetija_id, badge_id)
);


-- ─── Green Stamps (Gosti zbirajo štampiljke za bivanje) ────────────────────────
CREATE TABLE IF NOT EXISTS public.green_stamps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gost_id         UUID REFERENCES public.profili(id) ON DELETE CASCADE,
  kmetija_id      UUID REFERENCES public.kmetije(id) ON DELETE CASCADE,
  rezervacija_id  UUID REFERENCES public.rezervacije(id) ON DELETE SET NULL, -- Opcionalna povezava do konkretnega bivanja
  ustvarjeno      TIMESTAMPTZ DEFAULT NOW(),
  skenirano       BOOLEAN DEFAULT TRUE,
  -- Gost dobi samo eno štampiljko na določeni kmetiji na dan (za preprečevanje zlorab)
  UNIQUE (gost_id, kmetija_id, DATE(ustvarjeno))
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE public.green_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kmetija_green_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_stamps ENABLE ROW LEVEL SECURITY;

-- Badges (Javno branje)
CREATE POLICY "green_badges_javno" ON public.green_badges FOR SELECT USING (true);
CREATE POLICY "kmetija_green_badges_javno" ON public.kmetija_green_badges FOR SELECT USING (true);

-- Stamps (Gost vidi samo svoje)
CREATE POLICY "green_stamps_gost" ON public.green_stamps FOR SELECT USING (gost_id = auth.uid());

-- Admin pravice
CREATE POLICY "green_admin_vse" ON public.green_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
);
CREATE POLICY "green_stamps_admin" ON public.green_stamps FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin')
);
