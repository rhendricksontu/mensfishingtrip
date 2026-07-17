-- ============================================================================
-- Migration 0021 — add the show_volunteers visibility flag
-- Controls whether attendees see their Volunteering card on My Trip.
-- Safe to re-run.
-- ============================================================================

begin;

insert into settings (key, value) values
  ('show_volunteers', false)
on conflict (key) do nothing;

commit;
