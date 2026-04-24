# Visiativ Connect — Setup Guide

> **You can do this!** This guide is written for someone who has never deployed a web app before. Follow the steps in order and you'll have a live app in about 30 minutes.

---

## What you'll set up

| Service | What it does | Cost |
|---------|-------------|------|
| **Supabase** | Database + login system + file storage | Free |
| **Vercel** | Hosts your app online | Free |
| **GitHub** | Stores your code (Vercel reads from here) | Free |

---

## Part 1: Set up Supabase (your database)

### 1.1 Create a Supabase account
1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project** → sign up with GitHub or email
3. Click **New project**
4. Fill in:
   - **Name**: `visiativ-connect` (or any name)
   - **Database password**: choose a strong password and save it somewhere safe
   - **Region**: pick the closest to your users (e.g., Frankfurt for Europe)
5. Click **Create new project** — wait ~2 minutes for it to set up

### 1.2 Run the database schema
1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `database/schema.sql` from this folder
4. Copy ALL the contents and paste them into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success" — your database tables are now created!

### 1.3 Set up the auth trigger (important!)
1. Click **New query** again in SQL Editor
2. Open `database/admin_setup.sql` from this folder
3. Copy the section starting with `CREATE OR REPLACE FUNCTION public.handle_new_user()` to the end
4. Paste and click **Run**
5. This makes it so when someone first logs in, they're automatically linked to their attendee record

### 1.4 Create a storage bucket for session files
1. In Supabase, click **Storage** in the left sidebar
2. Click **New bucket**
3. Name it exactly: `session-content`
4. Toggle **Public bucket** to ON
5. Click **Save**

### 1.5 Configure email login (magic links)
1. In Supabase, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it is by default)
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to your future Vercel URL (you can update this later — use `http://localhost:5173` for now)
5. Go to **Authentication** → **Email Templates** → **Magic Link**
6. Customize the email subject: `Your Visiativ Connect login link`

### 1.6 Get your API keys
1. Go to **Project Settings** (gear icon) → **API**
2. Copy these two values — you'll need them soon:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public key** (a long string starting with `eyJ...`)

---

## Part 2: Put your code on GitHub

### 2.1 Create a GitHub account
1. Go to [github.com](https://github.com) and sign up (it's free)

### 2.2 Create a repository
1. Click the **+** icon → **New repository**
2. Name it `visiativ-connect`
3. Set it to **Private** (so only you can see the code)
4. Click **Create repository**

### 2.3 Upload your code
GitHub will show instructions. The easiest way for a beginner:

**Option A — Using GitHub Desktop (easiest):**
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Sign in to your GitHub account
3. Go to **File** → **Add Local Repository**
4. Navigate to this `Event Networking App` folder
5. Click **Publish repository** → choose your `visiativ-connect` repo

**Option B — Drag and drop (if the folder is small):**
1. On your new GitHub repo page, click **uploading an existing file**
2. Drag all files from this folder into the browser window
3. Scroll down and click **Commit changes**

---

## Part 3: Deploy to Vercel

### 3.1 Create a Vercel account
1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → **Continue with GitHub** (use the same GitHub account)

### 3.2 Import your project
1. On your Vercel dashboard, click **Add New** → **Project**
2. Find your `visiativ-connect` repository and click **Import**
3. Vercel will auto-detect it's a Vite/React project — leave settings as-is

### 3.3 Add your environment variables
Before clicking Deploy, scroll down to **Environment Variables** and add:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL (from step 1.6) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key (from step 1.6) |

4. Click **Deploy** — wait about 2 minutes
5. Vercel gives you a URL like `https://visiativ-connect.vercel.app` — **this is your app!**

### 3.4 Update Supabase with your live URL
1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Replace `http://localhost:5173` with your new Vercel URL
3. Add your Vercel URL to **Redirect URLs** as well
4. Click **Save**

---

## Part 4: Make yourself an admin

### 4.1 First login
1. Go to your app URL
2. Enter your email address and click **Send login link**
3. Check your email and click the magic link
4. Complete your profile setup

### 4.2 Give yourself admin rights
1. Go to Supabase → **SQL Editor** → **New query**
2. Run this (with YOUR email):
```sql
UPDATE attendees
SET is_admin = true, is_visiativ_staff = true
WHERE email = 'your-email@visiativ.com';
```
3. Refresh the app — you'll now see **Admin Dashboard** in your profile

---

## Part 5: Add your first event

1. Open the app and go to **Profile** → **Admin Dashboard**
2. Click **Event** in the admin menu
3. Fill in your event name, date, and location
4. Click **Save** — the event is now live!

---

## Part 6: Upload your attendee list

### 6.1 Prepare your CSV
Create a spreadsheet with these columns (exactly as shown):

| account_name | contact_name | email | account_manager_name | account_manager_email |
|---|---|---|---|---|
| Acme Engineering | John Smith | john@acme.com | Marie Dupont | m.dupont@visiativ.com |
| Beta Mfg | Anna Müller | a.mueller@beta.de | Pierre Martin | p.martin@visiativ.com |

Save as CSV format.

> 💡 You can download a template from the Admin → Attendees upload page.

### 6.2 Upload
1. Go to **Admin** → **Upload Attendees**
2. Click to select your CSV file
3. Check the preview looks correct
4. Click **Import attendees**

That's it! Your attendees can now log in with their email address.

---

## Part 7: Add your agenda

1. Go to **Admin** → **Agenda**
2. Click **Add session**
3. Fill in the title, time, room, and description
4. To add downloadable content (slides, PDFs):
   - Click **Upload file** in the session form
   - Select your PDF or PowerPoint file
   - It will be stored in Supabase Storage and linked to the session

---

## Sharing the app with attendees

Send your attendees a simple email like this:

> **Before the event:** Set up your profile and connect with fellow attendees at: [your-app-url]
>
> Just enter your registration email address and we'll send you a one-click login link. No password needed!

---

## Frequently asked questions

**Q: An attendee says they can't log in — "email not registered"**
This means their email isn't in the attendee list. Upload their row via Admin → Attendees, or check for a typo in the email address.

**Q: How do I run the prize draw?**
Go to Admin → Analytics — you'll see all ticket counts. To pick a winner, go to Supabase → SQL Editor and run:
```sql
SELECT a.name, a.email, a.company, COUNT(*) as tickets
FROM draw_tickets dt
JOIN attendees a ON a.id = dt.attendee_id
GROUP BY a.id, a.name, a.email, a.company
ORDER BY tickets DESC;
```
You can use a random number or a random selector tool to pick a winner from the list.

**Q: How do I export leads after the event?**
Go to **Admin** → **Leads** and click "Export leads CSV". This gives you everyone who either:
- Clicked "I want more info" on a topic, OR
- Requested follow-up in the post-event survey

Each lead row includes their name, company, account manager, sessions attended, and interests.

**Q: What if I want to use a custom domain (e.g., connect.visiativ.com)?**
In Vercel, go to your project → **Settings** → **Domains** → add your domain. You'll need to add a DNS record with your domain provider.

**Q: The app is slow / hitting Supabase limits**
The Supabase free tier supports up to 500MB database, 1GB file storage, 50,000 monthly active users, and 2GB bandwidth. For a 300-person event, you'll be well within these limits.

---

## Need help?
If something isn't working, the best resources are:
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- Search YouTube for "Supabase tutorial" or "Vercel deploy React"
