-- ============================================================================
-- Migration 0029 — cabin check-in details
-- Free-text check-in instructions per cabin, shown as an expandable
-- "View Check-in Details for <Cabin>" on the Locations tab and under the
-- Friday "Arrive & Check In" agenda item. Safe to re-run.
-- ============================================================================

alter table cabins add column if not exists checkin_details text;
