-- =============================================================================
-- EaZi Platform — Create Supabase Storage buckets
-- =============================================================================
-- The service-gallery bucket stores provider service photos.  Files are stored
-- under a per-provider prefix:  {provider_id}/{timestamp}-{random}.{ext}
-- The bucket is public so gallery images can be served without a signed URL.
-- =============================================================================

-- Create the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-gallery',
  'service-gallery',
  true,
  5242880,  -- 5 MB per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public gallery images on service listings)
DROP POLICY IF EXISTS "service_gallery_public_read" ON storage.objects;
CREATE POLICY "service_gallery_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-gallery');

-- Allow authenticated users to upload only into their own provider folder
-- File path structure: {provider_id}/{filename}
DROP POLICY IF EXISTS "service_gallery_provider_upload" ON storage.objects;
CREATE POLICY "service_gallery_provider_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-gallery'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow providers to update (replace) their own files
DROP POLICY IF EXISTS "service_gallery_provider_update" ON storage.objects;
CREATE POLICY "service_gallery_provider_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'service-gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow providers to delete their own files
DROP POLICY IF EXISTS "service_gallery_provider_delete" ON storage.objects;
CREATE POLICY "service_gallery_provider_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'service-gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
