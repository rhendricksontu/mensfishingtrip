-- ============================================================================
-- Migration 0007 — cabin address
-- Run AFTER 0006. Safe to re-run.
-- ============================================================================

begin;

alter table cabins
  add column if not exists address text;

commit;
