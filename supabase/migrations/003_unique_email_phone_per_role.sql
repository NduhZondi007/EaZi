-- =============================================================================
-- EaZi Platform — Unique email/phone per role (dual-profile support)
-- =============================================================================
-- A single physical person can hold both a 'client' (service seeker) and a
-- 'provider' (service provider) profile.  That means two rows in public.users
-- that share the same email and phone are valid — but only when each row has a
-- different role.
--
-- We replace the simple UNIQUE column constraints with per-role unique indexes:
--
--   UNIQUE(email, role)          — two rows with the same email are allowed
--                                  only if they have different roles.
--   UNIQUE(phone, role) partial  — same rule for phone; NULL phones are
--                                  excluded from the index to allow multiple
--                                  users to have no phone on file.
-- =============================================================================

-- Drop the existing global unique constraints (they may have been created as
-- named constraints or as implicit indexes from the column definition).
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Also drop any leftover unique indexes by name (defensive).
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_phone_key;

-- Email: unique per role
CREATE UNIQUE INDEX IF NOT EXISTS users_email_role_unique
  ON public.users (email, role);

-- Phone: unique per role, only when phone is not null
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_role_unique
  ON public.users (phone, role)
  WHERE phone IS NOT NULL;
