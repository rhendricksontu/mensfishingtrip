-- ============================================================================
-- Migration 0016 — fishing group meeting location
-- Run AFTER 0015. Safe to re-run.
-- `meet_location` is the address (for directions); `meet_location_name` is the
-- friendly place name. Chosen from the trip's agenda + cabin locations.
-- ============================================================================

begin;

alter table fishing_groups add column if not exists meet_location      text;
alter table fishing_groups add column if not exists meet_location_name text;

commit;
