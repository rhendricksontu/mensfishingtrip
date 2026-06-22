-- ============================================================================
-- Migration 0009 — fish with a guide
-- Run AFTER 0008. Safe to re-run.
-- ============================================================================

begin;

alter table attendees
  add column if not exists fish_with_guide boolean not null default false;

commit;
