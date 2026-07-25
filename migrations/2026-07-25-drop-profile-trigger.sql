-- Revert migration: drop trigger and function that created profiles on auth.users insert
-- Run this in Supabase SQL editor or via psql as an admin.

-- Drop trigger if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'auth_user_insert_create_profile'
      AND n.nspname = 'auth'
  ) THEN
    EXECUTE 'DROP TRIGGER auth_user_insert_create_profile ON auth.users';
  END IF;
END
$$;

-- Drop function if exists
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- Note: This removes the automated creation of rows in public.profiles when a new auth.users row is created.
-- If you prefer to keep the migration files but not run them, you can also remove or rename the migration file: 
-- migrations/2026-07-25-create-profile-trigger.sql
