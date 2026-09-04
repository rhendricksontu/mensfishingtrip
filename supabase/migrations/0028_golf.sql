-- ============================================================================
-- Migration 0028 — golf event
-- A single golf outing an assigned leader organizes: they set the title, start
-- time, location, address, and notes, which show on My Trip for anyone who
-- picked "Golfing" as an activity interest. One row (id = 1). Safe to re-run.
-- ============================================================================

begin;

create table if not exists golf (
  id            int primary key default 1,
  leader_id     uuid references attendees(id) on delete set null,
  title         text,
  start_time    text,          -- 24h "HH:MM"; displayed as 12h
  location      text,          -- street address (for the map link)
  location_name text,          -- place name
  notes         text,
  updated_at    timestamptz not null default now()
);

insert into golf (id) values (1) on conflict (id) do nothing;

-- RLS on, no public policies — server-only access via the secret key.
alter table golf enable row level security;

-- Feed the data_version counter so the sync indicator notices golf changes.
drop trigger if exists bump_ver_golf on golf;
create trigger bump_ver_golf
  after insert or update or delete on golf
  for each statement execute function bump_data_version();

commit;
