-- =============================================================================
-- MIGRACIJA: KOLEDAR BUTIČNIH DOGODKOV
-- =============================================================================

CREATE TABLE public.dogodki (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    kmetija_id uuid NOT NULL REFERENCES public.kmetije(id) ON DELETE CASCADE,
    ime text NOT NULL,
    opis text NOT NULL,
    datum_od timestamp with time zone NOT NULL,
    datum_do timestamp with time zone NOT NULL,
    cena numeric,
    max_oseb integer,
    slika_url text,
    ustvarjeno timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT dogodki_pkey PRIMARY KEY (id)
);

-- RLS
ALTER TABLE public.dogodki ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vsi lahko vidijo dogodke"
    ON public.dogodki FOR SELECT
    USING (true);

CREATE POLICY "Lastniki lahko upravljajo svoje dogodke"
    ON public.dogodki FOR ALL
    USING (
        kmetija_id IN (
            SELECT id FROM public.kmetije WHERE lastnik_id = auth.uid()
        )
    );
