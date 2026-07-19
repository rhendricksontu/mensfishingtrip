-- ============================================================================
-- Migration 0027 — ride preference "arranged" ("My Ride is Already Set")
-- Adds a fourth ride_preference value for attendees who've already sorted out
-- their own ride. Who they're riding with is stored in the existing
-- preferred_driver free-text column. Safe to re-run.
-- NOTE: ALTER TYPE ... ADD VALUE must run outside a transaction block — do not
-- wrap this in begin/commit.
-- ============================================================================

alter type ride_preference add value if not exists 'arranged';
