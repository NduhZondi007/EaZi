-- =============================================================================
-- EaZi Platform — Legacy SQL Editor script (migrations 002 → 004)
-- =============================================================================
-- Migrations 002–004 were applied manually via the Supabase SQL Editor before
-- the project was connected to the Supabase CLI.
--
-- Migration 005 onwards use `supabase db push` via the CLI.
-- To sync the CLI migration history after a fresh clone run:
--   supabase migration repair --status reverted 001
--   supabase migration repair --status applied 002
--   supabase migration repair --status applied 003
--   supabase migration repair --status applied 004
--   supabase db push
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 002 — Fix signup trigger
-- ─────────────────────────────────────────────────────────────────────────────
-- Root causes fixed:
--   1. phone TEXT UNIQUE caused unique-violation when a test phone was reused,
--      rolling back the entire auth.users insert with HTTP 500.
--   2. public.wallets had no INSERT RLS policy, so the SECURITY DEFINER trigger
--      failed to create the wallet row in projects where postgres has NOBYPASSRLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- a) Drop the phone UNIQUE constraint (replaced by per-role index in 003 below)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_key;

-- b) Replace handle_new_user with resilient ON CONFLICT version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role   public.user_role;
  v_status public.user_status;
BEGIN
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'client';
  END;
  IF v_role IS NULL THEN v_role := 'client'; END IF;

  v_status := CASE
    WHEN v_role = 'provider' THEN 'pending_verification'::public.user_status
    ELSE 'active'::public.user_status
  END;

  INSERT INTO public.users (
    id, name, email, role, status,
    phone, bio, address
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), 'User'),
    NEW.email,
    v_role,
    v_status,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'),   ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'bio'),     ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'address'), '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_role = 'admin' THEN
    INSERT INTO public.admins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- c) Add wallets INSERT policy (belt-and-suspenders for NOBYPASSRLS configs)
DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;
CREATE POLICY "wallets_insert_own" ON public.wallets
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IS NULL   -- trigger context: no JWT in flight yet
  );

-- Grant service_role explicit insert permission as fallback
GRANT INSERT ON public.wallets TO service_role;
GRANT INSERT ON public.users   TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 003 — Unique email / phone per role (dual-profile support)
-- ─────────────────────────────────────────────────────────────────────────────
-- One physical person can hold both a client and a provider profile.
-- Replace simple UNIQUE constraints with per-role composite unique indexes so
-- the same email/phone can appear once as 'client' and once as 'provider',
-- but never twice within the same role.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop old global unique constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_phone_key;

-- Email: unique per role
CREATE UNIQUE INDEX IF NOT EXISTS users_email_role_unique
  ON public.users (email, role);

-- Phone: unique per role, NULLs excluded
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_role_unique
  ON public.users (phone, role)
  WHERE phone IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 004 — Create service-gallery Storage bucket + RLS policies
-- ─────────────────────────────────────────────────────────────────────────────
-- Provider service photos are stored under {provider_id}/{filename}.
-- Bucket is public so images are served without signed URLs.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-gallery',
  'service-gallery',
  true,
  5242880,  -- 5 MB per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "service_gallery_public_read" ON storage.objects;
CREATE POLICY "service_gallery_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-gallery');

-- Providers upload to their own folder only
DROP POLICY IF EXISTS "service_gallery_provider_upload" ON storage.objects;
CREATE POLICY "service_gallery_provider_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-gallery'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Providers can replace their own files
DROP POLICY IF EXISTS "service_gallery_provider_update" ON storage.objects;
CREATE POLICY "service_gallery_provider_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'service-gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Providers can delete their own files
DROP POLICY IF EXISTS "service_gallery_provider_delete" ON storage.objects;
CREATE POLICY "service_gallery_provider_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'service-gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
