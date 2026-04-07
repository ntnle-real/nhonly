# Supabase Setup: Quick Start to Production

Supabase handles PostgreSQL ops for us — perfect for this use case.

## Architecture

```
Browser                          Supabase Cloud
├─ Record audio                 ├─ PostgreSQL (managed)
├─ Preview locally              ├─ Auto-backups
└─ POST to API                  ├─ Auth (JWT)
                                ├─ Storage (audio files)
                                └─ Realtime subscriptions
```

## Step 1: Create Supabase Projects (5 minutes)

### Development Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up / log in
3. Click "New Project"
4. Name: `nhonly-dev`
5. Database password: Generate strong password, save to `.env.local`
6. Region: Closest to you (e.g., us-west-1)
7. Pricing: Free tier works for dev
8. Create project (wait ~2 min)

**Save these keys to `.env.local`:**
```bash
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...  # NEVER expose this
```

### Production Project
Repeat above but name it `nhonly-prod`.

**Save these keys to `.env.production` on live server:**
```bash
PUBLIC_SUPABASE_URL=https://yyyy.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**CRITICAL:**
- Dev project uses dev keys
- Prod project uses prod keys
- Never mix them
- Service role key is secret — only on server

## Step 2: Create Database Schema (5 minutes)

In Supabase console, go to SQL Editor. Run this for BOTH dev and prod projects:

```sql
-- Create stories table
CREATE TABLE stories (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,  -- URL from Supabase Storage
  duration_ms INTEGER NOT NULL,
  timestamp BIGINT NOT NULL,
  type TEXT DEFAULT 'recording',  -- 'recording' or 'diorama'
  diorama_id TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX idx_stories_timestamp ON stories(timestamp DESC);

-- Enable row-level security (optional but recommended)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read all stories
CREATE POLICY "Anyone can read stories"
  ON stories
  FOR SELECT
  USING (true);

-- Allow anyone to insert stories
CREATE POLICY "Anyone can insert stories"
  ON stories
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete their own stories
CREATE POLICY "Users can delete stories"
  ON stories
  FOR DELETE
  USING (true);
```

## Step 3: Install Supabase Client (5 minutes)

```bash
npm install @supabase/supabase-js
```

## Step 4: Create Database Service (20 minutes)

Create `src/lib/supabase.server.ts`:

```typescript
// MARK: SYSTEM(Supabase) -> Database Connection Layer
// Purpose: Initialize Supabase client with proper environment separation
// Success: Client connects to correct database (dev/prod); operations are routed correctly
// Failure: Missing environment variables or connection fails

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// CRITICAL: Verify environment
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Check .env.local or .env.production');
}

// Client-side client (uses anon key — safe for public API)
export const supabaseClient = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Server-side client (uses service role key — for admin operations)
export const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

Create `src/lib/stories.server.ts`:

```typescript
// MARK: FUNCTION(saveStory) -> Store Recording in Supabase
// Purpose: Save audio blob to Storage, record metadata in database
// Success: Audio uploaded, story record created with URL
// Failure: Upload fails or database error

import { supabaseAdmin } from './supabase.server';
import type { ObservationSession } from './obs';
import { createObservationSession } from './obs';

export async function saveStory(
  title: string,
  audioBlob: Blob,
  durationMs: number,
  obs: ObservationSession = createObservationSession()
) {
  obs.read('story_input', { title, durationMs });

  try {
    // Upload audio to Supabase Storage
    obs.step('upload_audio_to_storage');
    const fileName = `${Date.now()}_${title.replace(/\s+/g, '_')}.webm`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('recordings')
      .upload(fileName, audioBlob);

    if (uploadError) {
      obs.observe('upload_failed', uploadError.message);
      throw uploadError;
    }

    obs.observe('audio_uploaded', fileName);

    // Get public URL
    obs.step('get_audio_url');
    const { data } = supabaseAdmin.storage
      .from('recordings')
      .getPublicUrl(fileName);
    const audioUrl = data.publicUrl;

    // Save metadata to database
    obs.step('save_story_metadata');
    const { data: storyData, error: dbError } = await supabaseAdmin
      .from('stories')
      .insert([
        {
          title,
          audio_url: audioUrl,
          duration_ms: durationMs,
          timestamp: Date.now(),
          type: 'recording'
        }
      ])
      .select();

    if (dbError) {
      obs.observe('database_error', dbError.message);
      throw dbError;
    }

    obs.observe('story_saved', storyData[0].id);
    return obs.return_('story_record', storyData[0]);
  } catch (error) {
    obs.observe('save_failed', String(error));
    throw error;
  }
}

export async function getAllStories(obs: ObservationSession = createObservationSession()) {
  obs.step('fetch_all_stories');

  const { data, error } = await supabaseAdmin
    .from('stories')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    obs.observe('fetch_failed', error.message);
    return [];
  }

  obs.observe('stories_fetched', `${data.length} stories`);
  return obs.return_('stories_list', data);
}

export async function deleteStory(id: number, obs: ObservationSession = createObservationSession()) {
  obs.read('delete_request', id);

  const { error } = await supabaseAdmin
    .from('stories')
    .delete()
    .eq('id', id);

  if (error) {
    obs.observe('delete_failed', error.message);
    throw error;
  }

  obs.observe('story_deleted', id);
  return obs.return_('deletion_complete', undefined);
}
```

## Step 5: Create API Endpoints (20 minutes)

Create `src/routes/api/stories/+server.ts`:

```typescript
// MARK: ROUTE(API Stories) -> Recording Persistence Endpoints
// Purpose: Accept recordings from browser, save to Supabase
// Success: Audio stored, metadata recorded, ID returned
// Failure: Invalid input or database error

import { json } from '@sveltejs/kit';
import { saveStory, deleteStory, getAllStories } from '$lib/stories.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const audioBlob = formData.get('audio') as Blob;
    const durationMs = parseInt(formData.get('duration') as string);

    if (!title || !audioBlob || !durationMs) {
      return json({ error: 'Missing fields' }, { status: 400 });
    }

    const story = await saveStory(title, audioBlob, durationMs);
    return json({ id: story.id });
  } catch (error) {
    console.error('Failed to save story:', error);
    return json({ error: 'Failed to save story' }, { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  const stories = await getAllStories();
  return json(stories);
};

export const DELETE: RequestHandler = async ({ url }) => {
  const id = parseInt(url.searchParams.get('id') || '0');

  if (!id) {
    return json({ error: 'Missing story id' }, { status: 400 });
  }

  try {
    await deleteStory(id);
    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to delete story' }, { status: 500 });
  }
};
```

## Step 6: Enable Storage in Supabase (5 minutes)

In Supabase console:

1. Go to **Storage** tab
2. Click **New bucket**
3. Name: `recordings`
4. Make it **Public**
5. Done!

Supabase now has a bucket to store audio files.

## Step 7: Update Recording Page (15 minutes)

In your recording save handler, replace IndexedDB with Supabase:

```typescript
// OLD (IndexedDB - remove this)
// await saveStory(title, audioBlob, durationMs);

// NEW (Supabase)
const formData = new FormData();
formData.append('title', title);
formData.append('audio', audioBlob);
formData.append('duration', durationMs);

const response = await fetch('/api/stories', {
  method: 'POST',
  body: formData
});

if (response.ok) {
  const { id } = await response.json();
  console.log('Story saved with ID:', id);
} else {
  console.error('Failed to save story');
}
```

## Step 8: Update Archive Display (10 minutes)

Replace the IndexedDB query with API call:

```typescript
// OLD (IndexedDB)
// const stories = await getAllStories();

// NEW (Supabase)
const response = await fetch('/api/stories');
const stories = await response.json();
```

## Environment Variables

### `.env.local` (Development)
```bash
PUBLIC_SUPABASE_URL=https://[dev-project].supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs[dev-key]
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs[dev-secret]
```

### `.env.production` (On live server - NEVER commit)
```bash
PUBLIC_SUPABASE_URL=https://[prod-project].supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs[prod-key]
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs[prod-secret]
```

## Verification

### Check dev project
```bash
# Login to Supabase, go to nhonly-dev project
# Table Editor > stories
# Should be empty initially
```

### Test recording save
```bash
# npm run dev
# Go to recording page
# Record something
# Save it
# Check Supabase console — story should appear in table
# Check Storage/recordings — audio file should exist
```

### Check prod project
```bash
# Separate login/project
# Should ONLY have real user recordings
# Never mixed with dev test data
```

## Backup & Disaster Recovery

**Supabase handles this automatically:**
- Daily backups
- Point-in-time recovery (14 days)
- Backup management in Settings

Click **Settings > Backups** to see recovery options.

## Cost Considerations

**Free tier includes:**
- 500 MB storage (audio)
- 1 GB database
- Good for MVP

**When you need to scale:**
- Pro tier: $25/month, 100 GB storage, auto-backups
- Pay-as-you-go overage if needed

## Next Steps

1. Create two Supabase projects (dev + prod)
2. Create database schema in both
3. Configure `.env.local` and `.env.production`
4. Update saving/loading code
5. Test recording → save → list workflow
6. Deploy to production
7. Migrate existing recordings (if any) from IndexedDB

**This unblocks the live site immediately** while handling dev/prod separation automatically via separate Supabase projects.
