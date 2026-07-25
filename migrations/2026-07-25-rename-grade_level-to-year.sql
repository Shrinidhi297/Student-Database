-- Migration: Rename column `grade_level` to `year` on `students` table
-- Safe: checks for existence before renaming to avoid errors.
-- Run this in Supabase SQL editor or via psql.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'students'
      AND column_name = 'grade_level'
  ) THEN
    ALTER TABLE public.students RENAME COLUMN grade_level TO year;
  END IF;
END
$$;

-- NOTE:
-- 1) This preserves existing `grade_level` data by renaming the column in-place.
-- 2) Review any RLS policies, views, triggers, or functions that reference `grade_level` and update them as needed.
-- 3) To apply immediately from command line (psql):
--    psql "postgresql://<user>:<pass>@<host>:5432/<db>" -f 2026-07-25-rename-grade_level-to-year.sql
