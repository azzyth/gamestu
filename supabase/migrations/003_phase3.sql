-- Phase 3: parent/advisor sharing

-- === shared_views ===
-- The share page (/share/[token]) is public and reads via the service role,
-- so no SELECT policy is granted to authenticated users beyond the owner.
create table public.shared_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  viewer_email text,
  token text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.shared_views enable row level security;

-- Owner can list and revoke their shares.
create policy "own shared views" on public.shared_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
