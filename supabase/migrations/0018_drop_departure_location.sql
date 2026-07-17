-- ============================================================================
-- Migration 0018 — drop the preferred departure/return location column
-- Reverses 0005. The app no longer collects or displays this. Safe to re-run.
-- ============================================================================

begin;

alter table attendees
  drop column if exists departure_location;

commit;
