-- =============================================================================
-- NaKmetiji.si — Supabase Storage Setup
-- Poženi v Supabase SQL Editor
-- =============================================================================

-- 1. Ustvari javni bucket "slike"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'slike',
  'slike',
  true,                                    -- javno branje brez auth
  5242880,                                 -- max 5MB na datoteko
  ARRAY['image/jpeg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/avif'];

-- 2. RLS Policies za storage.objects

-- Javno branje — vsi lahko vidijo slike
CREATE POLICY "slike_javno_branje"
ON storage.objects FOR SELECT
USING (bucket_id = 'slike');

-- Nalaganje — samo prijavljeni lastniki
CREATE POLICY "slike_lastnik_naloži"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'slike'
  AND auth.uid() IS NOT NULL
  AND (
    -- Pot mora biti v mapi kmetije ki jo lastnik poseduje
    -- ali v mapi z lastnikovim user ID
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.kmetije
      WHERE id::text = (storage.foldername(name))[2]
        AND lastnik_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profili
      WHERE id = auth.uid() AND vloga = 'super_admin'
    )
  )
);

-- Brisanje — samo lastnik ali admin
CREATE POLICY "slike_lastnik_briše"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'slike'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.kmetije
      WHERE id::text = (storage.foldername(name))[2]
        AND lastnik_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profili
      WHERE id = auth.uid() AND vloga = 'super_admin'
    )
  )
);
