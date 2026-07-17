-- ============================================================================
-- Migration 0022 — cabins as event locations
-- A cabin can be the location for the breakfasts and night services. Agenda
-- items carry a stable event_key so a cabin's address can drive their location.
-- Safe to re-run.
-- ============================================================================

begin;

alter table agenda_items add column if not exists event_key text;
alter table cabins
  add column if not exists event_locations text[] not null default '{}';

-- Tag the standard events so a cabin can be assigned as their location.
update agenda_items set event_key = 'friday_service'
  where event_key is null and trip_day = 'friday'   and title ilike '%service%';
update agenda_items set event_key = 'saturday_service'
  where event_key is null and trip_day = 'saturday' and title ilike '%service%';
update agenda_items set event_key = 'saturday_breakfast'
  where event_key is null and trip_day = 'saturday' and title ilike '%breakfast%';
update agenda_items set event_key = 'sunday_breakfast'
  where event_key is null and trip_day = 'sunday'   and title ilike '%breakfast%';

commit;
