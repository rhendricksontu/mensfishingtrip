-- ============================================================================
-- Migration 0014 — agenda item location name (separate from address)
-- Run AFTER 0013. Safe to re-run.
-- `location` holds the street address (used for directions); `location_name`
-- is the friendly place name shown as the label.
-- ============================================================================

begin;

alter table agenda_items add column if not exists location_name text;

commit;
