-- ============================================================================
-- Migration 0004 — guide sack-lunch signups
-- Adds a 'guide_lunch' signup role and a quantity (how many guide lunches a
-- volunteer will make). Run AFTER 0003. Safe to re-run.
-- NOTE: not wrapped in a transaction on purpose — ALTER TYPE ... ADD VALUE
-- is happiest run on its own.
-- ============================================================================

alter type signup_role add value if not exists 'guide_lunch';

alter table signups
  add column if not exists quantity int not null default 1;
