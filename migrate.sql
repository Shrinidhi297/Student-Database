ALTER TABLE public.students ALTER COLUMN gpa TYPE numeric(4,2);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS usn text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS semester integer;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS attendance numeric(5,2);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS marks numeric(5,2);
