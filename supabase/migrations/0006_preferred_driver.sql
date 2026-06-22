-- ============================================================================
-- Migration 0006 — preferred driver (free text)
-- Run AFTER 0005. Safe to re-run.
-- ============================================================================

begin;

alter table attendees
  add column if not exists preferred_driver text;

commit;
