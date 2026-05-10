-- =============================================================================
-- EaZi Platform — Fix signup trigger
-- =============================================================================
-- Root cause: handle_new_user() was blocking every signup via two separate
-- failure modes:
--
--   1. The `phone TEXT UNIQUE` constraint on public.users meant that if any
--      previous test account used the same phone number, the INSERT threw a
--      unique-violation and Supabase Auth rolled back the entire auth.users
--      insert, returning HTTP 500 "Database error saving new user".
--
--   2. public.wallets has RLS enabled with no INSERT policy.  In Supabase
--      projects where postgres does not have BYPASSRLS, the SECURITY DEFINER
--      trigger (owned by postgres) is still subject to RLS and the INSERT
--      into wallets fails.
--
-- Fixes applied:
--   a) Drop the UNIQUE constraint on users.phone.
--   b) Replace handle_new_user() with a version that uses ON CONFLICT … DO NOTHING
--      on both inserts (idempotent; also guards against duplicate trigger invocations).
--   c) Add wallets INSERT policy so the trigger works regardless of the
--      postgres BYPASSRLS setting.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- a) Drop the phone UNIQUE constraint
-- -----------------------------------------------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_key;

-- -----------------------------------------------------------------------------
-- b) Replace handle_new_user with resilient ON CONFLICT version
-- -----------------------------------------------------------------------------
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

  v_status := CASE WHEN v_role = 'provider' THEN 'pending_verification'::public.user_status
                   ELSE 'active'::public.user_status END;

  INSERT INTO public.users (
    id, name, email, role, status,
    phone, bio, address
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), 'User'),
    NEW.email,
    v_role,
    v_status,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'bio'),   ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'address'),'')
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

-- -----------------------------------------------------------------------------
-- c) Add wallets INSERT policy (belt-and-suspenders for NOBYPASSRLS configs)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;

CREATE POLICY "wallets_insert_own" ON public.wallets
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IS NULL   -- trigger context: no JWT yet
  );

-- Grant service_role explicit insert permission as fallback
GRANT INSERT ON public.wallets TO service_role;
GRANT INSERT ON public.users   TO service_role;
