-- ============================================================================
-- Migration 0015 — a leader per signup instance (role + day)
-- Run AFTER 0014. Safe to re-run.
-- One leader per (role, trip_day): e.g. Saturday Breakfast Cooks leader.
-- ============================================================================

begin;

create table if not exists signup_leaders (
  role         signup_role not null,
  trip_day     text not null,
  attendee_id  uuid references attendees(id) on delete cascade,
  primary key (role, trip_day)
);

commit;
