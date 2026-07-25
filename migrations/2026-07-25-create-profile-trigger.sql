-- Migration: create function + trigger to auto-create `public.profiles` rows
-- Run this in Supabase SQL editor or via psql as an admin.

-- Create or replace the function that inserts a profiles row when a new auth.users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) THEN
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, NULL),
      NULL,
      NULL,
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create a trigger on auth.users to call the function after insert, if the trigger doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'auth_user_insert_create_profile'
      AND n.nspname = 'auth'
  ) THEN
    CREATE TRIGGER auth_user_insert_create_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();
  END IF;
END$$;

-- Optional: If you want to populate names from user_metadata, replace the INSERT above with:
-- INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
-- VALUES (
--   NEW.id,
--   COALESCE(NEW.email, NULL),
--   (NEW.user_metadata->>'first_name')::text,
--   (NEW.user_metadata->>'last_name')::text,
--   now(),
--   now()
-- );
