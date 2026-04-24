# Vercel Deployment — Copy-paste reference

After running PUSH-TO-GITHUB.bat, do these steps on vercel.com:

## Step 1 — Go to
https://vercel.com/new

## Step 2 — Import GitHub repo
- Click "Continue with GitHub"
- Find "visiativ-connect" → click Import

## Step 3 — Add Environment Variables
Before clicking Deploy, scroll down to "Environment Variables" and add these two:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://nqeyjyodfqgqocynrfam.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZXlqeW9kZnFncW9jeW5yZmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTc1ODYsImV4cCI6MjA5MjA5MzU4Nn0.1i-2Q2ZqpScbph3flfRn-4ez64LmBwX-uz_1jpN289w` |

## Step 4 — Click Deploy
Your app will be live at: https://visiativ-connect.vercel.app

## Step 5 — Update Supabase with your live URL
1. Go to Supabase → Authentication → URL Configuration
2. Set Site URL to: https://visiativ-connect.vercel.app
3. Add to Redirect URLs: https://visiativ-connect.vercel.app
4. Save

## Step 6 — Make yourself admin
1. Log in to the app with: dbroekaart@hotmail.com
2. Go to Supabase → SQL Editor → New query → run:

UPDATE attendees
SET is_admin = true, is_visiativ_staff = true
WHERE email = 'dbroekaart@hotmail.com';

Done! You now have full admin access.
