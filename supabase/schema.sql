-- ============================================================================
-- Men's Fishing Trip database schema
-- Run this in Supabase: SQL Editor -> New query -> paste ALL of it -> Run.
-- Designed to run in a single pass and to be safe to re-run.
-- Wrapped in a transaction: it's all-or-nothing, so a failure leaves nothing
-- half-applied. Re-run the whole file after fixing any issue.
-- ============================================================================

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (created only if they don't already exist)
-- ---------------------------------------------------------------------------
do $enums$
begin
  if not exists (select 1 from pg_type where typname = 'ride_preference') then
    create type ride_preference as enum ('driving', 'riding', 'either');
  end if;
  if not exists (select 1 from pg_type where typname = 'fishing_session') then
    create type fishing_session as enum ('saturday_morning', 'saturday_afternoon');
  end if;
  if not exists (select 1 from pg_type where typname = 'signup_role') then
    create type signup_role as enum ('breakfast_cook', 'coffee_maker', 'guide_lunch');
  end if;
  if not exists (select 1 from pg_type where typname = 'ride_direction') then
    create type ride_direction as enum ('to_trip', 'from_trip');
  end if;
end
$enums$;

-- ---------------------------------------------------------------------------
-- Cabins
-- ---------------------------------------------------------------------------
create table if not exists cabins (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,                 -- legacy free-text address (fallback)
  address1    text,
  address2    text,
  city        text,
  state       text,
  zip         text,
  capacity    int  not null default 0,
  notes       text,
  sort_order  int  not null default 0,
  event_locations text[] not null default '{}', -- events this cabin is the location for
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Fishing groups (each belongs to a Saturday session and has a guide)
-- ---------------------------------------------------------------------------
create table if not exists fishing_groups (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  session           fishing_session not null,
  guide_name        text,
  guide_phone       text,
  guide_attendee_id uuid, -- set when the guide is an RSVP'd member (FK added after attendees)
  capacity          int  not null default 0,
  meet_location      text,          -- where the group meets (address)
  meet_location_name text,          -- friendly name for the meeting spot
  meet_time          text,          -- when the group meets, e.g. "7:00 AM"
  notes             text,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Attendees (the RSVP record)
-- ---------------------------------------------------------------------------
create table if not exists attendees (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references auth.users(id) on delete set null, -- linked login account
  role                     text not null default 'member' check (role in ('member', 'admin')),
  name                     text not null,
  phone                    text not null,
  emergency_contact_name   text not null,
  emergency_contact_phone  text not null,

  ride_preference          ride_preference not null default 'either',
  departure_time           text,                 -- e.g. "Friday Morning (8am-12pm)"
  preferred_driver         text,                 -- free-text: who they'd like to ride with
  activities               text[] not null default '{}', -- optional interests (biking/golfing/hiking)
  activity_other           text,                 -- free-text "other" activity interest
  willing_to_drive         boolean not null default false,
  seat_capacity            int not null default 0, -- passenger seats available (excludes driver)
  needs_ride               boolean not null default false, -- wants to be partnered with a driver
  fish_with_guide          boolean not null default false, -- wants to fish with a guide

  -- admin-managed assignments
  cabin_id                 uuid references cabins(id) on delete set null,
  is_cabin_host            boolean not null default false,
  fishing_group_id         uuid references fishing_groups(id) on delete set null,
  assigned_session         fishing_session,

  -- admin-only payment tracking
  paid                     boolean not null default false,
  paid_at                  timestamptz,
  payment_note             text,

  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists attendees_phone_idx on attendees (phone);
create index if not exists attendees_cabin_idx on attendees (cabin_id);
create index if not exists attendees_group_idx on attendees (fishing_group_id);
create unique index if not exists attendees_name_phone_uniq
  on attendees (lower(name), regexp_replace(phone, '\D', '', 'g'));
create unique index if not exists attendees_user_id_uniq
  on attendees (user_id) where user_id is not null;

-- fishing_groups.guide_attendee_id -> attendees(id). Added here because
-- fishing_groups is created before attendees exists.
do $guide_fk$
begin
  if not exists (select 1 from pg_constraint where conname = 'fishing_groups_guide_attendee_fk') then
    alter table fishing_groups
      add constraint fishing_groups_guide_attendee_fk
      foreign key (guide_attendee_id) references attendees(id) on delete set null;
  end if;
end
$guide_fk$;

-- ---------------------------------------------------------------------------
-- Signups (breakfast cook / coffee maker), scoped to a day
-- ---------------------------------------------------------------------------
create table if not exists signups (
  id           uuid primary key default gen_random_uuid(),
  role         signup_role not null,
  trip_day     text not null,        -- 'saturday' | 'sunday'
  quantity     int not null default 1, -- # of guide lunches (for guide_lunch role)
  attendee_id  uuid references attendees(id) on delete cascade,
  name         text not null,        -- denormalized for easy display
  created_at   timestamptz not null default now()
);
create index if not exists signups_role_day_idx on signups (role, trip_day);

-- One leader per signup instance (role + day).
create table if not exists signup_leaders (
  role         signup_role not null,
  trip_day     text not null,
  attendee_id  uuid references attendees(id) on delete cascade,
  primary key (role, trip_day)
);
-- Read in the layout on every request (nav gating for leaders).
create index if not exists signup_leaders_attendee_idx on signup_leaders (attendee_id);

-- ---------------------------------------------------------------------------
-- Rides (admin ride tracking): a driver carries 0+ passengers in a direction
-- ---------------------------------------------------------------------------
create table if not exists rides (
  id             uuid primary key default gen_random_uuid(),
  driver_id      uuid references attendees(id) on delete cascade,
  direction      ride_direction not null,
  depart_time    text,   -- when they leave
  arrive_time    text,   -- when they arrive
  notes          text,
  created_at     timestamptz not null default now()
);

create table if not exists ride_passengers (
  ride_id       uuid references rides(id) on delete cascade,
  attendee_id   uuid references attendees(id) on delete cascade,
  primary key (ride_id, attendee_id)
);
-- Read on My Trip to find a member's ride (PK only covers ride_id-first lookups).
create index if not exists ride_passengers_attendee_idx on ride_passengers (attendee_id);

-- ---------------------------------------------------------------------------
-- Agenda items
-- ---------------------------------------------------------------------------
create table if not exists agenda_items (
  id           uuid primary key default gen_random_uuid(),
  trip_day     text not null,        -- 'friday' | 'saturday' | 'sunday'
  start_time   text,                 -- display string e.g. "7:30 AM"
  sort_order   int not null default 0,
  title         text not null,
  description   text,
  location      text,                -- street address (for directions)
  location_name text,                -- friendly place name (label)
  notes         text,                -- inline notes/lyrics text
  event_key     text,                -- stable key a cabin can be the location for
  created_at    timestamptz not null default now()
);
create index if not exists agenda_day_idx on agenda_items (trip_day, sort_order);

-- Agenda file attachments (files live in the "agenda-files" Storage bucket).
create table if not exists agenda_files (
  id              uuid primary key default gen_random_uuid(),
  agenda_item_id  uuid references agenda_items(id) on delete cascade,
  name            text not null,
  path            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists agenda_files_item_idx on agenda_files (agenda_item_id);

-- ---------------------------------------------------------------------------
-- Important locations
-- ---------------------------------------------------------------------------
create table if not exists locations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,                 -- e.g. "Cabin", "Dinner", "River", "Gas"
  address      text,
  map_url      text,
  notes        text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Admins allowlist (membership = can use the admin dashboard)
-- ---------------------------------------------------------------------------
create table if not exists admins (
  email       text primary key,
  name        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Organizer-controlled visibility flags (e.g. reveal cabin/fishing/ride cards)
-- ---------------------------------------------------------------------------
create table if not exists settings (
  key         text primary key,
  value       boolean not null default false,
  updated_at  timestamptz not null default now()
);

insert into settings (key, value) values
  ('show_cabins', false),
  ('show_fishing', false),
  ('show_rides', false),
  ('show_volunteers', false)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- updated_at trigger for attendees
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $set_updated_at$
begin
  new.updated_at = now();
  return new;
end;
$set_updated_at$;

drop trigger if exists attendees_set_updated_at on attendees;
create trigger attendees_set_updated_at
  before update on attendees
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- All app access goes through the server using the SECRET API key, which
-- BYPASSES RLS. We enable RLS with NO permissive policies so that the
-- publishable (browser) key cannot read or write these tables directly. This
-- keeps phone numbers, emergency contacts, and payment status private.
-- ---------------------------------------------------------------------------
alter table cabins          enable row level security;
alter table fishing_groups  enable row level security;
alter table attendees       enable row level security;
alter table signups         enable row level security;
alter table rides           enable row level security;
alter table ride_passengers enable row level security;
alter table agenda_items    enable row level security;
alter table locations       enable row level security;
alter table admins          enable row level security;
alter table settings        enable row level security;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Cabins (rename/adjust capacities to match your real cabins)
insert into cabins (name, capacity, sort_order)
select v.name, v.capacity, v.sort_order
from (values
  ('Cabin 1', 10, 1),
  ('Cabin 2', 10, 2),
  ('Cabin 3', 10, 3),
  ('Cabin 4', 10, 4)
) as v(name, capacity, sort_order)
where not exists (select 1 from cabins);

-- Fishing groups (one example per session; add more in the admin UI)
insert into fishing_groups (name, session, guide_name, capacity)
select v.name, v.session, v.guide_name, v.capacity
from (values
  ('Morning Group A', 'saturday_morning'::fishing_session, 'TBD', 4),
  ('Afternoon Group A', 'saturday_afternoon'::fishing_session, 'TBD', 4)
) as v(name, session, guide_name, capacity)
where not exists (select 1 from fishing_groups);

-- Agenda
insert into agenda_items (trip_day, start_time, sort_order, title, description, location)
select v.trip_day, v.start_time, v.sort_order, v.title, v.description, v.location
from (values
  ('friday',   '3:00 PM',  10, 'Arrive & Check In', 'Find your cabin, check in with your host, settle in.', null::text),
  ('friday',   '6:00 PM',  20, 'Group Dinner', 'Dinner together at Hochatown Saloon.', 'Hochatown Saloon · 28 Old Hochatown Rd, Broken Bow, OK 74728'),
  ('friday',   '8:00 PM',  30, 'Friday Night Speaker', 'Guest speaker for the evening.', null),
  ('saturday', '6:00 AM',  10, 'Coffee & Breakfast', 'Breakfast cooks & coffee makers, thank you!', 'Cabins'),
  ('saturday', '7:30 AM',  20, 'Morning Fishing Session', 'Morning groups meet and depart with guides.', 'Beavers Bend Fly Shop & Professional Guide Service · 545 Beavers Bend Rd, Broken Bow, OK 74728'),
  ('saturday', '12:00 PM', 30, 'Afternoon Fishing Session', 'Afternoon groups meet and depart with guides.', 'Beavers Bend Fly Shop & Professional Guide Service · 545 Beavers Bend Rd, Broken Bow, OK 74728'),
  ('saturday', '6:00 PM',  40, 'Group Dinner', 'Dinner together at Mountain Fork Brewery.', 'Mountain Fork Brewery · 89 N Lukfata Trl Rd, Broken Bow, OK 74728'),
  ('saturday', '8:00 PM',  50, 'Saturday Night Speaker', 'Guest speaker for the evening.', null),
  ('sunday',   '6:00 AM',   5, 'Coffee & Breakfast', 'Breakfast cooks & coffee makers, thank you!', 'Cabins'),
  ('sunday',   '7:30 AM',  10, 'Sermon on the River', 'Worship and a word before we head home.', 'Mountain Fork Park · Beavers Bend Rd, Broken Bow, OK 74728 @34.142247,-94.694397'),
  ('sunday',   '9:00 AM',  20, 'Pack Up & Depart', 'Clean cabins, load up, and travel safe.', 'Cabins')
) as v(trip_day, start_time, sort_order, title, description, location)
where not exists (select 1 from agenda_items);

-- Tag the standard events so a cabin can be set as their location (Cabins tab).
update agenda_items set event_key = 'friday_service'
  where event_key is null and trip_day = 'friday'   and start_time = '8:00 PM';
update agenda_items set event_key = 'saturday_service'
  where event_key is null and trip_day = 'saturday' and start_time = '8:00 PM';
update agenda_items set event_key = 'saturday_breakfast'
  where event_key is null and trip_day = 'saturday' and title ilike '%breakfast%';
update agenda_items set event_key = 'sunday_breakfast'
  where event_key is null and trip_day = 'sunday'   and title ilike '%breakfast%';

-- Locations (fill in real addresses / map links in the admin UI or here)
insert into locations (name, category, address, notes, sort_order)
select v.name, v.category, v.address, v.notes, v.sort_order
from (values
  ('Friday Dinner at Hochatown Saloon', 'Dinner', '28 Old Hochatown Rd, Broken Bow, OK 74728', 'Friday 6:00 PM', 20),
  ('Saturday Dinner at Mountain Fork Brewery', 'Dinner', '89 N Lukfata Trl Rd, Broken Bow, OK 74728', 'Saturday 6:00 PM', 30),
  ('Beavers Bend Fly Shop & Professional Guide Service', 'Fishing', '545 Beavers Bend Rd, Broken Bow, OK 74728', 'Fishing sessions meet here.', 35),
  ('Sermon on the River at Mountain Fork Park', 'River', 'Beavers Bend Rd, Broken Bow, OK 74728 @34.142247,-94.694397', 'Sunday 7:30 AM sermon on the river.', 40)
) as v(name, category, address, notes, sort_order)
where not exists (select 1 from locations);

-- IMPORTANT: add your admin email(s) here so you can use the admin dashboard.
-- Already added for ryan.l.hendrickson@gmail.com below, edit/add as needed.
insert into admins (email, name)
values ('ryan.l.hendrickson@gmail.com', 'Ryan Hendrickson')
on conflict (email) do nothing;

commit;
