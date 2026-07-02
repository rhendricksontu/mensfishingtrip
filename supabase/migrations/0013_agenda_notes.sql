-- ============================================================================
-- Migration 0013 — agenda item notes (inline text)
-- Run AFTER 0012. Safe to re-run.
-- ============================================================================

begin;

alter table agenda_items add column if not exists notes text;

commit;
