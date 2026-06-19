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

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  grade_level text,
  status student_status not null default 'active',
  enrollment_date date not null default current_date,
  gpa numeric(3,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.students enable row level security;

-- Clerk-authenticated clients should write their Clerk user id into user_id.
-- If you need server-enforced isolation, add a backend that mints Supabase-compatible JWTs or proxies writes.
