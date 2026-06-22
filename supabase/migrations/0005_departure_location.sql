-- ============================================================================
-- Migration 0005 — preferred departure/return location
-- Run AFTER 0004. Safe to re-run.
-- ============================================================================

begin;

alter table attendees
  add column if not exists departure_location text;

commit;
