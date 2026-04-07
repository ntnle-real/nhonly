# Supabase: Getting Started (nhonly)

Complete walkthrough to get recordings persisted to Supabase with dev/prod separation.

## What You're Building

```
User Browser                           Supabase Cloud
├─ Record audio                       ├─ nhonly-dev project (FREE)
├─ Preview locally                    ├─ nhonly-prod project ($25/mo)
└─ POST to /api/stories               ├─ PostgreSQL (auto-managed)
    ↓                                 ├─ Storage/recordings bucket
    Saved to Supabase                 └─ Daily backups + recovery
```

## Timeline

- **Step 1-3:** 15 minutes (create projects + schema)
- **Step 4-5:** 5 minutes (environment setup)
- **Step 6:** 2 minutes (test locally)
- **Total:** ~25 minutes to working system

## Step 1: Create Development Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / log in
3. Click **New Project**
4. **Project name:** `nhonly-dev`
5. **Database password:** Generate a strong one (copy it, you'll use it in `.env.local`)
6. **Region:** Pick closest to your location
7. **Pricing tier:** Free (perfect for development)
8. Click **Create new project** — wait 2 minutes for provisioning

**Save your credentials immediately after project is ready:**

Go to **Settings > API** and copy:

```bash
# From "Project API Keys" section:
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Step 2: Create Production Project

Repeat Step 1, but name it `nhonly-prod`.

**Store these credentials securely** — you'll add them to `.env.production` on your live server later.

**CRITICAL:** Dev and prod projects MUST be separate to prevent accidents.

## Step 3: Create Database Schema in BOTH Projects

For each project (dev first, then prod):

1. Go to **SQL Editor**
2. Click **New Query**
3. Paste this schema:

```sql
-- Create stories table for recordings
CREATE TABLE IF NOT EXISTS stories (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  timestamp BIGINT NOT NULL,
  type TEXT DEFAULT 'recording',
  diorama_id TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_stories_timestamp
  ON stories(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_stories_type
  ON stories(type);

-- Row-level security (optional but good practice)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Allow reads
CREATE POLICY "Anyone can read stories"
  ON stories FOR SELECT USING (true);

-- Allow writes
CREATE POLICY "Anyone can insert stories"
  ON stories FOR INSERT WITH CHECK (true);

-- Allow deletes
CREATE POLICY "Anyone can delete stories"
  ON stories FOR DELETE USING (true);
```

4. Click **Run**
5. Verify success (no errors)
6. **Repeat for prod project**

## Step 4: Enable Storage Bucket

For each project (dev and prod):

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. **Bucket name:** `recordings`
4. **Make public:** Toggle ON (so audio URLs are publicly accessible)
5. Click **Create bucket**

## Step 5: Configure Environment Variables

### Local Development (`.env.local`)

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your **dev project** credentials:

```bash
NODE_ENV=development
PUBLIC_ENVIRONMENT=development

PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Never commit `.env.local` to git** — it's in `.gitignore`.

### Production Server (`.env.production`)

On your live server (`nhon-ly.org`), create `.env.production`:

```bash
ssh user@nhon-ly.org
cd /path/to/nhonly-dev
nano .env.production
```

Paste your **prod project** credentials:

```bash
NODE_ENV=production
PUBLIC_ENVIRONMENT=production

PUBLIC_SUPABASE_URL=https://yyyy.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

Save and exit. **Never commit this file to git.**

## Step 6: Test Locally

### Install Dependencies

```bash
npm install
```

This installs `@supabase/supabase-js` (already in package.json).

### Start Development Server

```bash
npm run dev
```

### Record a Test Story

1. Open `http://localhost:5173` (or whatever port shows)
2. Go to the **recording page**
3. Record 3-5 seconds of audio
4. Enter a title: "Test Recording"
5. Click **Save**

### Verify in Supabase

**In your dev project dashboard:**

1. Go to **SQL Editor**
2. Run: `SELECT * FROM stories;`
3. You should see your test recording
4. Go to **Storage > recordings** — you should see the audio file

**In Supabase logs:**
- Click your username → **Project Logs**
- Filter by `stories` table
- See INSERT events

## Step 7: Verify Dev/Prod Separation

**Dev project should have:**
- Your test recordings
- Test data

**Prod project should have:**
- Nothing yet (or only real user recordings once deployed)
- Completely separate from dev

This separation is automatic because you use different Supabase projects with different credentials.

## Step 8: Deploy to Production

On your live server:

```bash
ssh user@nhon-ly.org
cd /path/to/nhonly-dev

# Pull latest code
git pull origin main

# Ensure .env.production is in place
ls -la .env.production  # Should exist

# Install and build
npm install
npm run build

# Start or restart service (depends on your setup)
# If using systemd:
sudo systemctl restart nhonly

# Or if running manually:
# node build/index.js
```

**Verify production works:**

```bash
# From your computer:
curl -X GET https://nhon-ly.org/api/stories
# Should return [] or existing prod recordings
```

## Step 9: Set Up Monitoring

### Health Check Endpoint

We've already created `/health` endpoint in `src/routes/health/+server.ts`.

Monitor it with:

```bash
curl https://nhon-ly.org/health
# Should return: { status: 'ok', database: 'connected' }
```

### Supabase Dashboard

Monitor from Supabase console:

1. Go to **Monitoring** tab
2. Watch realtime API requests
3. Check database size
4. View backup history under **Settings > Backups**

## Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY"

**Problem:** App crashes with this error

**Solution:**
- Check `.env.local` or `.env.production` has the key
- Make sure you copied the full key (it's long)
- Restart dev server: `npm run dev`

### "Upload failed: 401"

**Problem:** Audio upload fails even though you saved credentials

**Solution:**
- Service role key might be expired (very rare)
- Go to **Settings > API > Service Role Key** in Supabase
- Copy the FULL current key again
- Update `.env.local` or `.env.production`
- Restart

### "Database insert succeeded but no data returned"

**Problem:** Weird edge case

**Solution:**
- Check schema created successfully: Go to **SQL Editor** → `SELECT COUNT(*) FROM stories;`
- If table doesn't exist, run the schema again
- Restart dev server

### Prod Server Shows Empty

**Problem:** App runs but `/api/stories` returns `[]`

**Likely causes:**
1. `.env.production` has dev credentials instead of prod credentials
2. `npm run build` wasn't run after updating `.env.production`
3. Service needs restart

**Fix:**
```bash
# SSH to server
ssh user@nhon-ly.org

# Verify env
grep PUBLIC_SUPABASE_URL .env.production
# Should show prod project URL (different from dev)

# Rebuild and restart
npm run build
sudo systemctl restart nhonly
```

## Backups & Recovery

Supabase handles backups automatically:

1. Go to **Settings > Backups**
2. See daily backup history
3. Click **Restore** to restore to specific point in time (up to 14 days)

**Manual backup (if needed):**

```bash
# Export from Supabase
# Go to SQL Editor → Run this:
SELECT * FROM stories;

# Copy results, save to CSV/JSON locally
```

## Cost Overview

**Development:**
- Free tier: 500 MB storage, 1 GB database — more than enough for dev

**Production:**
- Free tier: Limits to 100 concurrent connections (might hit with scale)
- **Pro tier:** $25/month after free trial
  - 100 GB storage
  - 8 GB database
  - 500 concurrent connections
  - Auto-backups, monitoring, priority support

For your use case right now, **free tier is fine**. Upgrade to Pro when you hit usage limits.

## What's Next

1. **Update recording page** to call `/api/stories` instead of IndexedDB
2. **Update archive page** to load from `/api/stories` instead of IndexedDB
3. **Deploy to production** and test with real users
4. **Monitor Supabase dashboard** for usage patterns
5. (Optional) Add user authentication so people can only see their own recordings

## Files Created/Modified

- `src/lib/supabase.server.ts` — Database connection layer (C3 contracts)
- `src/lib/stories.server.ts` — Recording operations (save, list, delete)
- `src/routes/api/stories/+server.ts` — API endpoints (POST, GET, DELETE)
- `src/routes/health/+server.ts` — Health check for monitoring
- `.env.example` — Template with Supabase variables
- `.env.local` — Your dev credentials (git-ignored)
- `.env.production` — Your prod credentials (server only, git-ignored)

## Success Criteria

✅ Recording saves to Supabase (visible in dashboard)
✅ `/api/stories` returns list of saved recordings
✅ Audio files stored in `recordings` bucket
✅ Dev project separate from prod project
✅ Backups running automatically

Once you hit all these, data persistence is working! 🎉

