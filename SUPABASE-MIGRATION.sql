-- ============================================================
--  Visiativ Connect — Supabase Migration
--  Run this in your Supabase SQL Editor (supabase.com -> SQL Editor)
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

-- Done! Go to Admin -> Event Settings in the app to fill in WiFi/parking details.


-- ============================================================
-- 3. Reset function -- verwijdert ALLE auth-gebruikers
--    Alleen aanroepbaar door een ingelogde admin via de app.
--    SECURITY DEFINER = draait met superuser-rechten.
-- ============================================================
create or replace function admin_delete_all_auth_users()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  -- Controleer of de aanroeper admin is
  if not (select is_admin from attendees where user_id = auth.uid() limit 1) then
    raise exception 'Toegang geweigerd: alleen admins kunnen dit uitvoeren';
  end if;

  -- Verwijder alle auth-users (cascade verwijdert attendees ook)
  for uid in (select id from auth.users) loop
    delete from auth.users where id = uid;
  end loop;
end;
$$;

-- Geef alle authenticated gebruikers het recht om de functie aan te roepen
-- (de functie zelf controleert of je admin bent)
grant execute on function admin_delete_all_auth_users() to authenticated;
