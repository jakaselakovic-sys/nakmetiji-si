-- =============================================================================
-- NaKmetiji.si — Fix Public RLS Policies
-- Poženi v Supabase SQL Editor: https://supabase.com/dashboard/project/nbopongqlewdlqxrfqsu/sql
-- =============================================================================

-- Dozivetja: javno branje (anonimni uporabniki vidijo dozivetja)
CREATE POLICY "dozivetja_javna" ON public.dozivetja
  FOR SELECT USING (true);

-- Izdelki: javno branje (anonimni uporabniki vidijo izdelke kmetij)
CREATE POLICY "izdelki_javni" ON public.izdelki
  FOR SELECT USING (true);

-- Verifikacija (preveri po zagonu)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('dozivetja', 'izdelki')
ORDER BY tablename, policyname;
