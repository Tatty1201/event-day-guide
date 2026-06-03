-- Event Day Guide v0.1 Supabase schema
-- Apply from the Supabase SQL editor before enabling the admin notice route in production.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id text primary key,
  name text not null,
  short_name text not null,
  date_label text not null,
  venue text not null,
  survey_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  label text not null,
  color text not null,
  icon text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true
);

create table if not exists public.spots (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  category_id text not null references public.categories(id),
  name text not null,
  place text not null,
  description text not null,
  note text,
  x integer not null,
  y integer not null,
  keywords text[] not null default '{}',
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notices (
  id text primary key,
  event_id text references public.events(id) on delete cascade,
  cat text not null default 'other',
  title text not null,
  body text not null default '',
  time text not null,
  pinned boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published', 'hidden', 'deleted')),
  source text not null default 'manual',
  source_message_id text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notice_sources (
  id uuid primary key default gen_random_uuid(),
  event_id text references public.events(id) on delete cascade,
  kind text not null check (kind in ('email', 'zapier', 'manual')),
  label text not null,
  secret_hash text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  event_id text references public.events(id) on delete set null,
  session_id text not null,
  event_name text not null,
  sequence integer,
  previous_event text,
  path text not null default '/',
  payload jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create unique index if not exists notices_source_message_unique
  on public.notices (source, source_message_id)
  where source_message_id is not null;

create index if not exists notices_public_feed_idx
  on public.notices (pinned desc, created_at desc)
  where status = 'published';

create index if not exists event_logs_created_idx
  on public.event_logs (created_at desc);

create index if not exists event_logs_session_sequence_idx
  on public.event_logs (session_id, sequence);

create index if not exists event_logs_event_name_idx
  on public.event_logs (event_name, created_at desc);

alter table public.events enable row level security;
alter table public.categories enable row level security;
alter table public.spots enable row level security;
alter table public.notices enable row level security;
alter table public.notice_sources enable row level security;
alter table public.event_logs enable row level security;

drop policy if exists "public can read published events" on public.events;
create policy "public can read published events"
  on public.events for select
  using (status = 'published');

drop policy if exists "public can read visible categories" on public.categories;
create policy "public can read visible categories"
  on public.categories for select
  using (is_visible = true);

drop policy if exists "public can read visible spots" on public.spots;
create policy "public can read visible spots"
  on public.spots for select
  using (is_visible = true);

drop policy if exists "public can read published notices" on public.notices;
create policy "public can read published notices"
  on public.notices for select
  using (status = 'published');

drop policy if exists "service role can manage event logs" on public.event_logs;
create policy "service role can manage event logs"
  on public.event_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Inserts and updates are intentionally performed through Next.js route handlers
-- using the server-side webhook secret, not directly from public clients.
