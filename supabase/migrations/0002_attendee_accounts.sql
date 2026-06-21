-- ============================================================================
-- Migration 0002 — attendee accounts
-- Links each RSVP to a Supabase Auth user so attendees can log in (with their
-- cell phone + password) and see/edit their own info and assignments.
-- Run AFTER schema.sql. Safe to re-run.
-- ============================================================================

begin;

alter table attendees
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists attendees_user_id_uniq
  on attendees (user_id)
  where user_id is not null;

commit;
