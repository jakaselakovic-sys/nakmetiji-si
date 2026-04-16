-- =============================================================================
-- NaKmetiji.si — Content Engine (CMS) Schema
-- Podpora za Novice, Blog in Integracije (Jože AI)
-- =============================================================================

-- 1. Zgodbe (Osrednja tabela za blog in novice)
CREATE TYPE public.content_type AS ENUM ('news', 'blog');
CREATE TYPE public.content_category AS ENUM ('nasveti', 'recepti', 'dogodki', 'intervjuji', 'splosno');
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS public.zgodbe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content_html TEXT NOT NULL,
    content_json JSONB, -- Za lažje urejanje in rekonstrukcijo v Tiptap
    author_id UUID REFERENCES public.profili(id) ON DELETE SET NULL,
    
    type public.content_type DEFAULT 'blog',
    category public.content_category DEFAULT 'splosno',
    status public.content_status DEFAULT 'draft',
    
    -- Pametno povezovanje (Clenjenje)
    related_farm_id UUID REFERENCES public.kmetije(id) ON DELETE SET NULL,
    
    -- SEO iz Jožeta
    metadata JSONB DEFAULT '{}'::jsonb, -- vsebuje: meta_description, focus_keywords, og_caption
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Index za hitrejše SEO resolves in queryje "Preberi Tudi"
CREATE INDEX IF NOT EXISTS zgodbe_slug_idx ON public.zgodbe(slug);
CREATE INDEX IF NOT EXISTS zgodbe_farm_idx ON public.zgodbe(related_farm_id);
CREATE INDEX IF NOT EXISTS zgodbe_status_idx ON public.zgodbe(status) WHERE status = 'published';

-- 2. Junction tabela za Znamenitosti (Cross-promotion)
CREATE TABLE IF NOT EXISTS public.zgodba_znamenitosti (
    zgodba_id UUID REFERENCES public.zgodbe(id) ON DELETE CASCADE,
    znamenitost_id UUID REFERENCES public.znamenitosti(id) ON DELETE CASCADE,
    PRIMARY KEY (zgodba_id, znamenitost_id)
);

-- 3. Varnost (Row Level Security)
ALTER TABLE public.zgodbe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zgodba_znamenitosti ENABLE ROW LEVEL SECURITY;

-- Obiskovalci lahko berejo samo objavljene vsebine
CREATE POLICY "Public Read Published Stories" 
ON public.zgodbe FOR SELECT 
USING (status = 'published');

CREATE POLICY "Public Read Story Landmarks" 
ON public.zgodba_znamenitosti FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.zgodbe WHERE id = zgodba_id AND status = 'published')
);

-- Admin ekipa (ali urednik) ima vse pravice
CREATE POLICY "Admin Full Access Stories" 
ON public.zgodbe FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga IN ('super_admin', 'admin')));

CREATE POLICY "Admin Full Access Landmarks" 
ON public.zgodba_znamenitosti FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga IN ('super_admin', 'admin')));

-- 4. Storage Bucket za CMS Slike (cms-media)
-- POZOR: Potrebno je omogočiti pg_graphql/storage preko dashboarda, 
-- v standardni Supabase namestitvi to kreiramo takole:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cms-media', 'cms-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public CMS images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'cms-media');

CREATE POLICY "Admin CMS uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'cms-media' AND 
    EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga IN ('super_admin', 'admin'))
);

CREATE POLICY "Admin CMS delete" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'cms-media' AND 
    EXISTS (SELECT 1 FROM public.profili WHERE id = auth.uid() AND vloga IN ('super_admin', 'admin'))
);
