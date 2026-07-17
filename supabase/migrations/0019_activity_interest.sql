-- ============================================================================
-- Migration 0019 — optional activity interests
-- Adds a checked-activity list plus a free-text "other". Safe to re-run.
-- ============================================================================

begin;

alter table attendees
  add column if not exists activities text[] not null default '{}',
  add column if not exists activity_other text;

commit;
