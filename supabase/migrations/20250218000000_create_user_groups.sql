-- Persist expense-splitting groups per user (groups, members, expenses, payments as JSON).
-- Run this in the Supabase SQL Editor or via Supabase CLI.

create table if not exists public.user_groups (
  user_id uuid not null references auth.users (id) on delete cascade,
  groups jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

alter table public.user_groups enable row level security;

-- Users can only read and write their own row.
create policy "Users can read own user_groups"
  on public.user_groups for select
  using (auth.uid() = user_id);

create policy "Users can insert own user_groups"
  on public.user_groups for insert
  with check (auth.uid() = user_id);

create policy "Users can update own user_groups"
  on public.user_groups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own user_groups"
  on public.user_groups for delete
  using (auth.uid() = user_id);

comment on table public.user_groups is 'Per-user persisted groups for the expense splitting app (groups, members, expenses, payments stored as JSON).';
