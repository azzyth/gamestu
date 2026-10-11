-- Phase 2: goals, grade outcomes, exams, integrations

-- === goals ===
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_ratio numeric(4,1) check (target_ratio is null or target_ratio > 0),
  target_study_hours numeric(4,1) check (target_study_hours is null or target_study_hours > 0),
  active boolean not null default true,
  active_from date not null default current_date,
  created_at timestamptz not null default now()
);
create unique index goals_one_active_per_user on public.goals (user_id) where active;

-- === grade_outcomes (self-reported; ML training data) ===
create table public.grade_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  term text not null,
  subject text not null,
  grade text not null,
  grade_trend text not null check (grade_trend in ('improved', 'stable', 'declined')),
  self_reported boolean not null default true,
  created_at timestamptz not null default now()
);
create index grade_outcomes_user_idx on public.grade_outcomes (user_id, created_at desc);

-- === exams (for exam-proximity analytics) ===
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  exam_date date not null,
  created_at timestamptz not null default now()
);

-- === integrations ===
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('steam', 'google_calendar')),
  data jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- === row level security ===
alter table public.goals enable row level security;
alter table public.grade_outcomes enable row level security;
alter table public.exams enable row level security;
alter table public.integrations enable row level security;

create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own grade outcomes" on public.grade_outcomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own exams" on public.exams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own integrations" on public.integrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
