-- Event Day Guide: migrate an existing simple notices table to v0.1 operations.
-- Use this if the Supabase project already has public.notices from the prototype.

alter table public.notices
  add column if not exists event_id text,
  add column if not exists status text not null default 'published',
  add column if not exists source text not null default 'manual',
  add column if not exists source_message_id text,
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notices_status_check'
      and conrelid = 'public.notices'::regclass
  ) then
    alter table public.notices
      add constraint notices_status_check
      check (status in ('draft', 'published', 'hidden', 'deleted'));
  end if;
end $$;

create unique index if not exists notices_source_message_unique
  on public.notices (source, source_message_id)
  where source_message_id is not null;

create index if not exists notices_public_feed_idx
  on public.notices (pinned desc, created_at desc)
  where status = 'published';

alter table public.notices enable row level security;

drop policy if exists "public can read published notices" on public.notices;
create policy "public can read published notices"
  on public.notices for select
  using (status = 'published');

-- Existing rows remain visible by default through status='published'.
-- Inserts and updates should go through Next.js route handlers with service role key.

create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  session_id text not null,
  event_name text not null,
  sequence integer,
  previous_event text,
  path text not null default '/',
  payload jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists event_logs_created_idx
  on public.event_logs (created_at desc);

create index if not exists event_logs_session_sequence_idx
  on public.event_logs (session_id, sequence);

create index if not exists event_logs_event_name_idx
  on public.event_logs (event_name, created_at desc);

alter table public.event_logs enable row level security;

drop policy if exists "service role can manage event logs" on public.event_logs;
create policy "service role can manage event logs"
  on public.event_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
