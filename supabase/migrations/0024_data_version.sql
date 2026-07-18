-- ============================================================================
-- Migration 0024 — data version counter for cheap "out of sync" detection
-- A single row bumped by a trigger on every change to the watched tables. The
-- app polls a tiny endpoint for this number instead of re-fetching whole pages;
-- when it moves, the client knows there's something new to sync. Safe to re-run.
-- ============================================================================

begin;

create table if not exists data_version (
  id      int primary key default 1,
  version bigint not null default 0
);
insert into data_version (id, version) values (1, 0) on conflict (id) do nothing;

create or replace function bump_data_version()
returns trigger
language plpgsql
as $bump$
begin
  update data_version set version = version + 1 where id = 1;
  return null;
end;
$bump$;

-- Statement-level trigger on each table that feeds the app's displayed data.
do $triggers$
declare
  t text;
begin
  foreach t in array array[
    'attendees', 'cabins', 'fishing_groups', 'rides', 'ride_passengers',
    'signups', 'signup_leaders', 'agenda_items', 'agenda_files', 'settings'
  ]
  loop
    execute format('drop trigger if exists %I on %I', 'bump_ver_' || t, t);
    execute format(
      'create trigger %I after insert or update or delete on %I for each statement execute function bump_data_version()',
      'bump_ver_' || t, t
    );
  end loop;
end
$triggers$;

commit;
