-- ============================================================================
-- Migration 0017 — fishing group meeting time
-- Run AFTER 0016. Safe to re-run.
-- Stored as a display string, e.g. "7:00 AM".
-- ============================================================================

begin;

alter table fishing_groups add column if not exists meet_time text;

commit;
