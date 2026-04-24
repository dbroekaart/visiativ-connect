-- ============================================================
--  Visiativ Connect — Supabase Migration
--  Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- 1. Add venue & social fields to the events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS wifi_network     TEXT,
  ADD COLUMN IF NOT EXISTS wifi_password    TEXT,
  ADD COLUMN IF NOT EXISTS parking_info     TEXT,
  ADD COLUMN IF NOT EXISTS floor_plan_url   TEXT,
  ADD COLUMN IF NOT EXISTS social_hashtag   TEXT DEFAULT '#Visiativmycadday2026';

-- 2. Add unique constraint on attendee email (fixes upload duplicates)
ALTER TABLE attendees
  ADD CONSTRAINT IF NOT EXISTS attendees_email_unique UNIQUE (email);

-- Done! Go to Admin → Event Settings in the app to fill in WiFi/parking details.
