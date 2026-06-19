-- Original schema
do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'student_status'
  ) then
    create type student_status as enum ('active', 'inactive', 'graduated');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profiles enable row level security;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  grade_level text,
  status student_status not null default 'active',
  enrollment_date date not null default current_date,
  gpa numeric(4,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.students enable row level security;

-- Migration: Add columns for AI search feature
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'students' and column_name = 'usn') then
    alter table public.students add column usn text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'students' and column_name = 'department') then
    alter table public.students add column department text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'students' and column_name = 'semester') then
    alter table public.students add column semester integer;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'students' and column_name = 'attendance') then
    alter table public.students add column attendance numeric(5,2);
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'students' and column_name = 'marks') then
    alter table public.students add column marks numeric(5,2);
  end if;
end
$$;

-- RLS policies for original columns (idempotent)
create policy if not exists "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy if not exists "Profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy if not exists "Profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists "Students are viewable by owner" on public.students
  for select using (auth.uid() = user_id);

create policy if not exists "Students are insertable by owner" on public.students
  for insert with check (auth.uid() = user_id);

create policy if not exists "Students are updatable by owner" on public.students
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "Students are deletable by owner" on public.students
  for delete using (auth.uid() = user_id);
