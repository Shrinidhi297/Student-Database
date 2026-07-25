-- ============================================================
-- Setup: Students Table + RLS Policies (Supabase Auth Only)
-- ============================================================

-- 1. Create the students table if it doesn't exist
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  year text,
  status text not null default 'active' check (status in ('active', 'inactive', 'graduated')),
  enrollment_date date not null,
  gpa numeric(4,2),
  notes text,
  usn text,
  department text,
  semester integer,
  attendance numeric(5,2),
  marks numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable RLS
alter table public.students enable row level security;

-- 3. Drop any existing policies
do $$
declare
  rec record;
begin
  for rec in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('students')
  loop
    execute format('drop policy if exists %I on %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  end loop;
end
$$;

-- 4. Create RLS policies (standard Supabase uid())
create policy "Students are viewable by owner" on public.students
  for select using (auth.uid() = user_id);

create policy "Students are insertable by owner" on public.students
  for insert with check (auth.uid() = user_id);

create policy "Students are updatable by owner" on public.students
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Students are deletable by owner" on public.students
  for delete using (auth.uid() = user_id);

-- 5. Enable realtime for live updates
alter publication supabase_realtime add table public.students;
