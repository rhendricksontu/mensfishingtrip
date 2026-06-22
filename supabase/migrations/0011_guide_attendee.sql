-- ============================================================================
-- Migration 0011 — link a fishing guide to a member (when they're on the RSVP)
-- Run AFTER 0010. Safe to re-run.
-- Lets a member-guide see who they're guiding on their My Fishing Trip page.
-- guide_name / guide_phone remain for non-member (professional) guides.
-- ============================================================================

begin;

alter table fishing_groups
  add column if not exists guide_attendee_id uuid references attendees(id) on delete set null;

commit;
