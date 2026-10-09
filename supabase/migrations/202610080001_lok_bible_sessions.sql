-- Apply to the existing LokBook Supabase project after reviewing its migrations.
-- This app shares auth.users identities and keeps schedules on the device.
create table if not exists public.lok_bible_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  goal_seconds integer not null check (goal_seconds between 60 and 43200),
  active_seconds integer not null check (active_seconds >= 0),
  translation text not null check (translation in ('web', 'kjv')),
  completed boolean not null,
  created_at timestamptz not null default now(),
  check (finished_at >= started_at)
);

create index if not exists lok_bible_sessions_user_finished_idx
  on public.lok_bible_sessions (user_id, finished_at desc);

alter table public.lok_bible_sessions enable row level security;

create policy "lok_bible_sessions_select_own"
  on public.lok_bible_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lok_bible_sessions_insert_own"
  on public.lok_bible_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "lok_bible_sessions_update_own"
  on public.lok_bible_sessions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "lok_bible_sessions_delete_own"
  on public.lok_bible_sessions for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.lok_bible_sessions to authenticated;
