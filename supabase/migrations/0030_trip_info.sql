-- ============================================================================
-- Migration 0030 — trip_info (editable global notes)
-- A single row (id = 1) for trip-wide notes an organizer can edit. First use:
-- "What to Bring", shown as an expandable note on My Trip. Safe to re-run.
-- ============================================================================

begin;

create table if not exists trip_info (
  id            int primary key default 1,
  what_to_bring text,
  updated_at    timestamptz not null default now()
);

insert into trip_info (id) values (1) on conflict (id) do nothing;

-- RLS on, no public policies — server-only access via the secret key.
alter table trip_info enable row level security;

-- Feed the data_version counter so the sync indicator notices changes.
drop trigger if exists bump_ver_trip_info on trip_info;
create trigger bump_ver_trip_info
  after insert or update or delete on trip_info
  for each statement execute function bump_data_version();

commit;
