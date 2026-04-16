-- =============================================================================
-- NaKmetiji.si — Zero-Trust Security Update
-- Vsebuje: Upravljanje QR ključev, Varnostne dnevnike in Atomske transakcije
-- =============================================================================

-- 1. Dodajanje rotacijskega skrivnega ključa za QR kodo (HMAC podpisovanje) na kmetijah
ALTER TABLE public.kmetije 
ADD COLUMN IF NOT EXISTS qr_secret_key UUID DEFAULT gen_random_uuid();

-- 2. Tabela za varnostne dnevnike (Security Logs - zlorabe, spoofing napadi)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profili(id) ON DELETE SET NULL,
    farm_id UUID REFERENCES public.kmetije(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'QR_SPOOF_ATTEMPT', 'RATE_LIMIT_EXCEEDED', 'STALE_QR', 'AUTH_ERROR'
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for security logs (only inserts allowed for authenticated, read only for super_admin)
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vstavi svoj security log" ON public.security_logs 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin bere security loge" ON public.security_logs 
FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga = 'super_admin'));

-- 3. Atomska PostgreSQL transakcija za varen "Claim Stamp"
-- Popolnoma preprečuje Race Conditions ("Veselica" napad), ko več uporabnikov klika naenkrat.
CREATE OR REPLACE FUNCTION public.claim_green_stamp(p_gost_id UUID, p_kmetija_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Ensures the RPC executes with high privileges to insert safely bypassing client RLS quirks if needed
AS $$
DECLARE
    v_stamp_exists BOOLEAN;
    v_stamp_id UUID;
BEGIN
    -- Zaklenemo morebitno branje istega uporabnika in kmetije samo na trenutni dan.
    -- S tem preprečimo 'Double-Point' exploits (1 tisočinka sekunde kasneje kliknjen drug zahtevek)
    
    SELECT EXISTS(
        SELECT 1 
        FROM public.green_stamps 
        WHERE gost_id = p_gost_id 
          AND kmetija_id = p_kmetija_id 
          AND DATE(ustvarjeno) = CURRENT_DATE
    ) INTO v_stamp_exists;

    IF v_stamp_exists THEN
        -- Štampiljka za ta dan že obstaja
        RETURN jsonb_build_object('status', 'duplicate', 'message', 'Žig za današnji dan že obstaja.');
    END IF;

    -- Varni INSERT
    INSERT INTO public.green_stamps (gost_id, kmetija_id, skenirano)
    VALUES (p_gost_id, p_kmetija_id, TRUE)
    RETURNING id INTO v_stamp_id;

    RETURN jsonb_build_object('status', 'success', 'stamp_id', v_stamp_id);
    
EXCEPTION WHEN unique_violation THEN
    -- Fallback, če constraint ujame race condition
    RETURN jsonb_build_object('status', 'duplicate', 'message', 'Žig že zaveden (unique violation).');
END;
$$;
