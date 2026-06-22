-- ============================================================================
-- Migration 0010 — structured cabin address
-- Run AFTER 0009. Safe to re-run.
-- Splits the cabin address into proper parts. The legacy `address` column is
-- kept as a fallback for any previously entered values.
-- ============================================================================

begin;

alter table cabins add column if not exists address1 text;
alter table cabins add column if not exists address2 text;
alter table cabins add column if not exists city    text;
alter table cabins add column if not exists state   text;
alter table cabins add column if not exists zip     text;

commit;
