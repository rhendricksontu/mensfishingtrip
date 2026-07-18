-- ============================================================================
-- Migration 0026 — drop attendees→auth.users foreign key
-- Deleting a login via the admin API failed with "Database error deleting user":
-- removing an auth.users row fires the ON DELETE SET NULL referential action on
-- public.attendees (and its data_version trigger), which the internal
-- supabase_auth_admin role can't run — so the delete errored, the auth user was
-- left orphaned, and the phone couldn't be reused. The app manages the user_id
-- link itself (sets it on RSVP, deletes the row on removal), so the DB-level FK
-- isn't needed. Drop it; the unique index on user_id stays. Safe to re-run.
-- ============================================================================

begin;

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.attendees'::regclass
    and contype = 'f'
    and confrelid = 'auth.users'::regclass
  limit 1;
  if cname is not null then
    execute format('alter table public.attendees drop constraint %I', cname);
  end if;
end $$;

commit;
