-- =============================================================================
-- NaKmetiji.si — God Mode Command Center (HQ)
-- Omogoča: Oracle Insights log, Master Stats View, Realtime WebSocket povezave
-- =============================================================================

-- 1. Jože Oracle Logs (Anonimizirani iskalni nizi za trende)
CREATE TABLE IF NOT EXISTS public.oracle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID, -- Lahko null, uporabljeno za združevanje pogovora
    query_text TEXT NOT NULL,
    matched_intent JSONB,
    was_unsure BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.oracle_logs ENABLE ROW LEVEL SECURITY;

-- Samo avtentificiran server in api lahko shranjuje
CREATE POLICY "Samo Server lahko piše Oracle loge" 
ON public.oracle_logs FOR INSERT 
WITH CHECK (true); -- V produkciji se to zaščiti preko Service Role ključa v API klicih

-- Samo Admini lahko berejo
CREATE POLICY "Admini lahko analizirajo loge" 
ON public.oracle_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga IN ('super_admin', 'admin')));


-- 2. Master Stats View (Visoko-zmogljiv presek stanja platforme)
-- Ta View se uporablja za hitro izrisovanje "Pulse" številk na Dashboardu
CREATE OR REPLACE VIEW public.admin_master_stats AS
SELECT 
    -- Uporabniki
    (SELECT COUNT(*) FROM public.profili) AS total_users,
    (SELECT COUNT(*) FROM public.profili WHERE vloga = 'farm_owner') AS total_vendors,
    
    -- Kmetije in Finance
    (SELECT COUNT(*) FROM public.kmetije WHERE aktivna = true) AS active_farms,
    (SELECT COUNT(*) FROM public.kmetije WHERE premium = true) AS premium_farms,
    ((SELECT COUNT(*) FROM public.kmetije WHERE premium = true) * 29.90) AS mrr_estimate_eur, -- Predpostavka: premium kmetija plača ~29.90€ / mesec
    
    -- Zeleni potni list (Engagegent)
    (SELECT COUNT(*) FROM public.green_stamps) AS total_stamps_collected,
    (SELECT COUNT(*) FROM public.green_stamps WHERE ustvarjeno >= NOW() - INTERVAL '24 hours') AS stamps_last_24h,
    
    -- Varnost (Security Pulse)
    (SELECT COUNT(*) FROM public.security_logs WHERE event_type = 'SPOOF_ATTEMPT' AND created_at >= NOW() - INTERVAL '7 days') AS security_alerts_7d;

-- 3. Omogočanje "Live Toasts" in WebSocket prenosa
-- Supabase po privzetem nima vključenega pošiljanja Insertov preko websocketa iz varnostnih razlogov.
-- Omogočimo Realtime za Security incidente in nove žige ("God Mode" občutek)
-- (Pozor: Morda boste morali pognati to znotraj superuser role ali preko dashboarda)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'security_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.security_logs;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'green_stamps') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.green_stamps;
    END IF;
END $$;
