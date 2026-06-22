-- ============================================================================
-- Migration 0008 — fishing guide phone
-- Run AFTER 0007. Safe to re-run.
-- ============================================================================

begin;

alter table fishing_groups
  add column if not exists guide_phone text;

commit;
