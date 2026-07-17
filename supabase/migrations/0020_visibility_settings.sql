-- ============================================================================
-- Migration 0020 — organizer-controlled visibility settings
-- A simple key/value flag table. Controls whether attendees see their cabin,
-- fishing, and ride cards on the My Fishing Trip page. Safe to re-run.
-- ============================================================================

begin;

create table if not exists settings (
  key        text primary key,
  value      boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Server-only, like every other table: RLS on, no public policies.
alter table settings enable row level security;

-- Default hidden: organizers reveal each card deliberately when ready.
insert into settings (key, value) values
  ('show_cabins', false),
  ('show_fishing', false),
  ('show_rides', false)
on conflict (key) do nothing;

commit;
