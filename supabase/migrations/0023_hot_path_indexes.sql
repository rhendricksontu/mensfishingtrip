-- ============================================================================
-- Migration 0023 — indexes for per-request hot paths
-- signup_leaders.attendee_id: read in the layout on every request (nav gating).
-- ride_passengers.attendee_id: read on My Trip to find a member's ride.
-- Safe to re-run.
-- ============================================================================

begin;

create index if not exists signup_leaders_attendee_idx on signup_leaders (attendee_id);
create index if not exists ride_passengers_attendee_idx on ride_passengers (attendee_id);

commit;
