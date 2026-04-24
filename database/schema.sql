-- ============================================================
-- VISIATIV CONNECT — Complete Database Schema
-- Run this entire file in: Supabase → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ============================================================
-- EVENTS
-- ============================================================
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  date        date,
  end_date    date,
  location    text,
  description text,
  logo_url    text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
-- TOPICS (for interest matching)
-- ============================================================
create table if not exists topics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text,
  icon        text,
  sort_order  integer default 0
);

-- ============================================================
-- ACCOUNT MANAGERS (Visiativ staff)
-- ============================================================
create table if not exists account_managers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null unique,
  phone       text,
  photo_url   text,
  linkedin_url text,
  bio         text,
  created_at  timestamptz default now()
);

-- ============================================================
-- ATTENDEES
-- ============================================================
create table if not exists attendees (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade unique,
  event_id            uuid references events(id),
  name                text not null default '',
  email               text not null,
  company             text default '',
  job_title           text default '',
  bio                 text default '',
  photo_url           text,
  linkedin_url        text,
  account_manager_id  uuid references account_managers(id),
  is_admin            boolean default false,
  is_visiativ_staff   boolean default false,
  profile_complete    boolean default false,
  gdpr_consent        boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ============================================================
-- SESSIONS (agenda items)
-- ============================================================
create table if not exists sessions (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references events(id) on delete cascade,
  title        text not null,
  description  text,
  speaker_name text,
  speaker_bio  text,
  speaker_photo_url text,
  start_time   timestamptz,
  end_time     timestamptz,
  room         text,
  topic_id     uuid references topics(id),
  content_url  text,
  content_filename text,
  is_published boolean default true,
  sort_order   integer default 0,
  created_at   timestamptz default now()
);

-- ============================================================
-- SESSION ATTENDANCE (check-ins → earn tickets)
-- ============================================================
create table if not exists session_attendance (
  id             uuid primary key default gen_random_uuid(),
  attendee_id    uuid references attendees(id) on delete cascade,
  session_id     uuid references sessions(id) on delete cascade,
  checked_in_at  timestamptz default now(),
  unique(attendee_id, session_id)
);

-- ============================================================
-- ATTENDEE INTERESTS (pre-event + "want more info" flag)
-- ============================================================
create table if not exists attendee_interests (
  id              uuid primary key default gen_random_uuid(),
  attendee_id     uuid references attendees(id) on delete cascade,
  topic_id        uuid references topics(id) on delete cascade,
  want_more_info  boolean default false,
  notes           text,
  is_public       boolean default true,
  created_at      timestamptz default now(),
  unique(attendee_id, topic_id)
);

-- ============================================================
-- CONNECTIONS (networking requests)
-- ============================================================
create table if not exists connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid references attendees(id) on delete cascade,
  target_id    uuid references attendees(id) on delete cascade,
  status       text default 'pending' check (status in ('pending','accepted','declined')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(requester_id, target_id)
);

-- ============================================================
-- MEETING REQUESTS
-- ============================================================
create table if not exists meeting_requests (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid references attendees(id) on delete cascade,
  target_id      uuid references attendees(id) on delete cascade,
  proposed_time  text,
  message        text,
  status         text default 'pending' check (status in ('pending','accepted','declined')),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ============================================================
-- MESSAGES (in-app chat)
-- ============================================================
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid references attendees(id) on delete cascade,
  recipient_id uuid references attendees(id) on delete cascade,
  content      text not null,
  is_read      boolean default false,
  created_at   timestamptz default now()
);

-- ============================================================
-- PRIZE DRAW TICKETS
-- ============================================================
create table if not exists draw_tickets (
  id           uuid primary key default gen_random_uuid(),
  attendee_id  uuid references attendees(id) on delete cascade,
  action       text not null,
  description  text,
  earned_at    timestamptz default now()
);

-- ============================================================
-- POST-EVENT SURVEY
-- ============================================================
create table if not exists surveys (
  id                   uuid primary key default gen_random_uuid(),
  attendee_id          uuid references attendees(id) on delete cascade,
  event_id             uuid references events(id),
  satisfaction_score   integer check (satisfaction_score between 1 and 5),
  highlights           text,
  improvements         text,
  follow_up_interest   boolean default false,
  follow_up_topics     text,
  submitted_at         timestamptz default now(),
  unique(attendee_id, event_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — controls who can see what
-- ============================================================

alter table events              enable row level security;
alter table topics               enable row level security;
alter table account_managers     enable row level security;
alter table attendees            enable row level security;
alter table sessions             enable row level security;
alter table session_attendance   enable row level security;
alter table attendee_interests   enable row level security;
alter table connections          enable row level security;
alter table meeting_requests     enable row level security;
alter table messages             enable row level security;
alter table draw_tickets         enable row level security;
alter table surveys              enable row level security;

-- Helper: get current attendee record
create or replace function current_attendee_id()
returns uuid language sql stable security definer as $$
  select id from attendees where user_id = auth.uid() limit 1;
$$;

-- Helper: is current user admin?
create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select coalesce((select is_admin from attendees where user_id = auth.uid() limit 1), false);
$$;

-- EVENTS: everyone logged in can read
create policy "events_read" on events for select to authenticated using (true);
create policy "events_admin_write" on events for all to authenticated using (is_admin());

-- TOPICS: everyone reads
create policy "topics_read" on topics for select to authenticated using (true);
create policy "topics_admin_write" on topics for all to authenticated using (is_admin());

-- ACCOUNT MANAGERS: everyone reads
create policy "am_read" on account_managers for select to authenticated using (true);
create policy "am_admin_write" on account_managers for all to authenticated using (is_admin());

-- ATTENDEES: everyone can see basic profiles; own row full access; admins full access
create policy "attendees_read" on attendees for select to authenticated using (true);
create policy "attendees_own_update" on attendees for update to authenticated using (user_id = auth.uid());
create policy "attendees_insert_own" on attendees for insert to authenticated with check (user_id = auth.uid());
create policy "attendees_admin" on attendees for all to authenticated using (is_admin());

-- SESSIONS: everyone reads published
create policy "sessions_read" on sessions for select to authenticated using (is_published = true);
create policy "sessions_admin_write" on sessions for all to authenticated using (is_admin());

-- SESSION ATTENDANCE: own rows; admins all
create policy "attendance_own" on session_attendance for all to authenticated using (attendee_id = current_attendee_id());
create policy "attendance_admin" on session_attendance for select to authenticated using (is_admin());

-- ATTENDEE INTERESTS: own rows; public interests readable by all; admins all
create policy "interests_own" on attendee_interests for all to authenticated using (attendee_id = current_attendee_id());
create policy "interests_public_read" on attendee_interests for select to authenticated using (is_public = true);
create policy "interests_admin" on attendee_interests for select to authenticated using (is_admin());

-- CONNECTIONS: see own connections
create policy "connections_own" on connections for all to authenticated
  using (requester_id = current_attendee_id() or target_id = current_attendee_id());

-- MEETING REQUESTS: see own
create policy "meetings_own" on meeting_requests for all to authenticated
  using (requester_id = current_attendee_id() or target_id = current_attendee_id());

-- MESSAGES: send and receive own messages
create policy "messages_own" on messages for all to authenticated
  using (sender_id = current_attendee_id() or recipient_id = current_attendee_id());
create policy "messages_insert" on messages for insert to authenticated
  with check (sender_id = current_attendee_id());

-- DRAW TICKETS: own; admins all
create policy "tickets_own" on draw_tickets for select to authenticated using (attendee_id = current_attendee_id());
create policy "tickets_insert_own" on draw_tickets for insert to authenticated with check (attendee_id = current_attendee_id());
create policy "tickets_admin" on draw_tickets for select to authenticated using (is_admin());

-- SURVEYS: own; admins all
create policy "surveys_own" on surveys for all to authenticated using (attendee_id = current_attendee_id());
create policy "surveys_admin" on surveys for select to authenticated using (is_admin());

-- ============================================================
-- SEED DATA — Default topics
-- ============================================================
insert into topics (name, category, icon, sort_order) values
  ('SolidWorks / CAD',         'Engineering',    '🔧', 1),
  ('PDM / PLM',                 'Engineering',    '📁', 2),
  ('Simulation & Analysis',     'Engineering',    '📊', 3),
  ('Electrical Design',         'Engineering',    '⚡', 4),
  ('Manufacturing / Production','Manufacturing',  '🏭', 5),
  ('3D Printing / AM',          'Manufacturing',  '🖨️', 6),
  ('Digital Twin',              'Innovation',     '🌐', 7),
  ('Industry 4.0 / IoT',        'Innovation',     '🔗', 8),
  ('AI & Automation',           'Innovation',     '🤖', 9),
  ('Cloud & Collaboration',     'Digital',        '☁️', 10),
  ('Training & Certification',  'Learning',       '🎓', 11),
  ('Licensing & Subscription',  'Commercial',     '📋', 12)
on conflict do nothing;
