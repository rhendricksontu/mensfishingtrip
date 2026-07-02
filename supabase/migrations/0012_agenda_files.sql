-- ============================================================================
-- Migration 0012 — agenda file attachments
-- Run AFTER 0011. Safe to re-run.
-- Files themselves live in the "agenda-files" Storage bucket (public read);
-- this table records each attachment and which agenda item it belongs to.
-- ============================================================================

begin;

create table if not exists agenda_files (
  id              uuid primary key default gen_random_uuid(),
  agenda_item_id  uuid references agenda_items(id) on delete cascade,
  name            text not null,   -- original filename, for display
  path            text not null,   -- object path within the bucket
  created_at      timestamptz not null default now()
);

create index if not exists agenda_files_item_idx on agenda_files (agenda_item_id);

commit;
