-- ============================================================================
-- Migration 0025 — coffee orders
-- Attendees order a coffee for Saturday/Sunday with a pickup time; organizers
-- work the queue on the Coffee tab and mark each "ready"; the attendee then
-- confirms pickup, which clears it from the queue. One order per attendee/day.
-- Safe to re-run.
-- ============================================================================

begin;

create table if not exists coffee_orders (
  id          uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references attendees(id) on delete cascade,
  day         text not null check (day in ('saturday', 'sunday')),
  drink       text not null,
  pickup_time text not null,          -- display label, e.g. '6:15 AM'
  status      text not null default 'pending' check (status in ('pending', 'ready', 'picked_up')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One live order per attendee per day (re-ordering upserts this row).
create unique index if not exists coffee_orders_attendee_day
  on coffee_orders (attendee_id, day);

-- Queue reads filter out picked-up orders and sort by day.
create index if not exists coffee_orders_status_day
  on coffee_orders (status, day);

-- RLS on with no public policies — server-only access via the secret key.
alter table coffee_orders enable row level security;

-- Feed the data_version counter so the app's sync indicator notices changes
-- (e.g. an order being marked ready).
drop trigger if exists bump_ver_coffee_orders on coffee_orders;
create trigger bump_ver_coffee_orders
  after insert or update or delete on coffee_orders
  for each statement execute function bump_data_version();

commit;
