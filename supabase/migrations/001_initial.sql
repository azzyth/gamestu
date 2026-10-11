-- Phase 1: MVP core loop (profiles, daily logs, risk snapshots, alerts, push, weekly summaries)

create extension if not exists pgcrypto;

-- === profiles ===
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  weekly_summary_email boolean not null default true,
  benchmarking_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- === daily_logs ===
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  game_hours numeric(4,1) not null default 0 check (game_hours >= 0 and game_hours <= 24),
  study_hours numeric(4,1) not null default 0 check (study_hours >= 0 and study_hours <= 24),
  source text not null default 'manual' check (source in ('manual', 'google_calendar', 'steam')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);
create index daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);

-- === risk_snapshots ===
create table public.risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  risk_level text not null check (risk_level in ('low', 'moderate', 'high')),
  ratio numeric,
  trend_slope numeric,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

-- === alerts ===
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index alerts_user_idx on public.alerts (user_id, created_at desc);

-- === push_subscriptions ===
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz not null default now()
);

-- === weekly_summaries ===
create table public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  avg_ratio numeric,
  prev_avg_ratio numeric,
  game_hours numeric not null default 0,
  study_hours numeric not null default 0,
  summary text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- === updated_at trigger for daily_logs ===
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger daily_logs_touch before update on public.daily_logs
for each row execute function public.touch_updated_at();

-- === row level security ===
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.risk_snapshots enable row level security;
alter table public.alerts enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.weekly_summaries enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own daily logs" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own risk snapshots" on public.risk_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own alerts" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own weekly summaries" on public.weekly_summaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- === auto-create profile on signup ===
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
