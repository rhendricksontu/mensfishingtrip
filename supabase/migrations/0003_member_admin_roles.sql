-- ============================================================================
-- Migration 0003 — member/admin roles
-- Everyone who RSVPs is a 'member'. Promote trusted organizers to 'admin'
-- (they can then reach the dashboard with their normal phone login).
-- Run AFTER 0002. Safe to re-run.
-- ============================================================================

begin;

alter table attendees
  add column if not exists role text not null default 'member';

do $roles$
begin
  if not exists (select 1 from pg_constraint where conname = 'attendees_role_check') then
    alter table attendees
      add constraint attendees_role_check check (role in ('member', 'admin'));
  end if;
end
$roles$;

commit;
