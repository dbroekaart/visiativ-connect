-- ============================================================
-- RUN THIS AFTER SCHEMA.SQL
-- This makes your account an admin so you can access the dashboard
-- ============================================================

-- Step 1: First log in to the app with your email address
-- Step 2: Come back here and run this query with YOUR email:

UPDATE attendees
SET is_admin = true, is_visiativ_staff = true
WHERE email = 'your-admin-email@visiativ.com';  -- ← Change this!

-- Step 3: To make other Visiativ staff members admins or staff:
UPDATE attendees
SET is_visiativ_staff = true
WHERE email IN (
  'colleague1@visiativ.com',
  'colleague2@visiativ.com'
);

-- ============================================================
-- Enable Supabase Storage for session content files
-- Run in Supabase SQL Editor:
-- ============================================================

-- Create storage bucket (do this in Supabase Dashboard → Storage instead)
-- Dashboard → Storage → New bucket → Name: "session-content" → Public: YES

-- ============================================================
-- Fix: Allow attendees without user_id (pre-imported) to be linked
-- when the user first logs in via magic link
-- ============================================================
-- This is handled automatically by a Supabase Auth trigger.
-- Add this trigger in Supabase SQL Editor:

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Link the auth user to their pre-imported attendee record
  UPDATE public.attendees
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;

  -- If no pre-imported record exists, create a basic one
  IF NOT FOUND THEN
    INSERT INTO public.attendees (user_id, email, name)
    VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
