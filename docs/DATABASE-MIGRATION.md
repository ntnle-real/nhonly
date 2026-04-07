# Database Migration: Client-Side → Server-Side

## Current Architecture (CRITICAL FLAWS)

### What we have now:
```
User Browser                           Live Server (nhon-ly.org)
├─ IndexedDB ("nhonly_archive")       ├─ Node.js app
├─ Stores recordings locally only     ├─ Serves frontend
└─ No backup mechanism                └─ NO DATABASE — recordings not persisted
```

### Problems:
1. **No persistence** — Browser crash = all recordings lost
2. **No portability** — Recordings trapped in one browser/device
3. **No management** — Can't see/audit user recordings on the server
4. **No backup** — Dev and prod are identical (client-side only)
5. **No separation** — Users can't have drafts separate from published work
6. **No search/discovery** — Can't browse all community recordings
7. **Production risk** — User data completely unmanaged

## Target Architecture

```
User Browser (Frontend)                   Live Server (nhon-ly.org)
├─ Record audio                          ├─ Node.js SvelteKit app
├─ Preview in IndexedDB (temp)           ├─ PostgreSQL database
├─ Display via ExhibitPanel                │  ├─ stories table (with dev/prod separation)
└─ Save to server when ready              │  ├─ dioramas table
                                          │  └─ users table (future)
                                          └─ API endpoints
                                             ├─ POST /api/stories (save)
                                             ├─ GET /api/stories (list)
                                             └─ DELETE /api/stories/:id
```

## Implementation Phases

### Phase 1: Database Setup (URGENT)

**Goal:** Get server-side persistence for recordings.

**Steps:**
1. Install PostgreSQL on production server
2. Create two databases:
   - `nhonly_prod` — Live user recordings
   - `nhonly_dev` — Development/testing data
3. Define schema for recordings table:

```sql
CREATE TABLE stories (
  id SERIAL PRIMARY KEY,
  environment TEXT NOT NULL, -- 'dev' or 'prod'
  title VARCHAR(255) NOT NULL,
  audio_blob BYTEA NOT NULL,
  duration_ms INTEGER,
  timestamp BIGINT NOT NULL,
  type VARCHAR(50) DEFAULT 'recording',
  diorama_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CRITICAL: Index to prevent dev/prod mixing
CREATE UNIQUE INDEX idx_story_env ON stories(id, environment);
```

4. Create `.env.production` on server:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/nhonly_prod
PUBLIC_ENVIRONMENT=production
```

5. Create `.env.local` for local dev:

```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/nhonly_dev
PUBLIC_ENVIRONMENT=development
```

### Phase 2: API Layer (1-2 weeks)

**Goal:** Create server routes to save/load recordings.

**New endpoints:**

```typescript
// src/routes/api/stories/+server.ts

// POST /api/stories — Save recording from browser
export async function POST({ request }) {
  const { title, audioBlob, durationMs } = await request.json();

  // CRITICAL: Verify environment
  if (process.env.NODE_ENV === 'production'
      && !process.env.DATABASE_URL.includes('_prod')) {
    throw new Error('FATAL: Production request with dev database');
  }

  // Save to database
  const story = await db.query(
    'INSERT INTO stories (title, audio_blob, duration_ms, timestamp, environment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id',
    [title, audioBlob, durationMs, Date.now(), process.env.PUBLIC_ENVIRONMENT]
  );

  return json({ id: story.id });
}

// GET /api/stories — List all recordings for user
export async function GET({ url }) {
  const stories = await db.query(
    'SELECT id, title, duration_ms, timestamp FROM stories
     WHERE environment = $1
     ORDER BY timestamp DESC',
    [process.env.PUBLIC_ENVIRONMENT]
  );

  return json(stories);
}

// DELETE /api/stories/:id
export async function DELETE({ params }) {
  await db.query(
    'DELETE FROM stories WHERE id = $1 AND environment = $2',
    [params.id, process.env.PUBLIC_ENVIRONMENT]
  );

  return json({ success: true });
}
```

### Phase 3: Migration Layer (1 week)

**Goal:** Move existing client-side recordings to server.

**Steps:**
1. User logs in → browser offers "Upload saved recordings?" dialog
2. IndexedDB recordings bundled and sent to server
3. Server verifies environment and stores securely
4. Clear old IndexedDB to prevent confusion

```typescript
// Migration helper
async function migrateLocalRecordings() {
  const localStories = await getAllStories(); // from IndexedDB

  for (const story of localStories) {
    await fetch('/api/stories', {
      method: 'POST',
      body: JSON.stringify({
        title: story.title,
        audioBlob: story.audioBlob,
        durationMs: story.durationMs
      })
    });
  }

  // Clear local storage after successful migration
  await clearAllStories();
}
```

### Phase 4: Dev/Prod Separation (2 weeks)

**Goal:** Enforce strict environment isolation.

**Implementation:**

```typescript
// src/lib/config.ts
export function verifyEnvironment() {
  const env = process.env.NODE_ENV;
  const dbUrl = process.env.DATABASE_URL;
  const publicEnv = process.env.PUBLIC_ENVIRONMENT;

  // CRITICAL CHECKS
  if (env === 'production') {
    if (!dbUrl?.includes('nhonly_prod')) {
      throw new Error('FATAL: Production node with development database');
    }
    if (publicEnv !== 'production') {
      throw new Error('FATAL: Environment mismatch');
    }
  }

  if (env === 'development') {
    if (!dbUrl?.includes('nhonly_dev')) {
      throw new Error('FATAL: Development node with production database');
    }
  }
}

// Call on app startup
verifyEnvironment();
```

**All database queries must include environment check:**

```typescript
// GOOD: Explicitly filter by environment
const stories = await db.query(
  'SELECT * FROM stories WHERE environment = $1',
  [process.env.PUBLIC_ENVIRONMENT]
);

// BAD: Could mix dev/prod
const stories = await db.query('SELECT * FROM stories');
```

### Phase 5: Monitoring & Backup (ongoing)

**Goal:** Protect production data.

**Checklist:**
- [ ] Daily PostgreSQL backups (to separate secure location)
- [ ] Backup retention: 30 days
- [ ] Automated alerts if backup fails
- [ ] Monthly restore test (to verify backups work)
- [ ] Monitoring on production database size
- [ ] Logging all DELETE operations

**Backup script:**
```bash
#!/bin/bash
# Daily backup (add to crontab)
pg_dump nhonly_prod > /backups/nhonly_prod_$(date +%Y%m%d).sql
```

## Rollout Timeline

**Week 1 (IMMEDIATE):**
- Set up PostgreSQL
- Create databases (dev/prod)
- Deploy Phase 1 & 2

**Week 2:**
- Implement migration helper
- User testing with existing recordings
- Deploy Phase 3

**Week 3:**
- Deploy strict environment separation (Phase 4)
- Monitor for issues

**Week 4+:**
- Monitoring, backups, optimization

## Minimum Viable Product (MVP)

To get out of the current broken state, implement at minimum:

1. PostgreSQL + two databases
2. Basic API (save, list, delete)
3. Environment variable separation (.env.production vs .env.local)
4. One safety check: verify NODE_ENV matches database name

This unblocks users from losing recordings while you build out the rest.

## Testing Strategy

### Development (against nhonly_dev)
```bash
# Local: Records should go to dev database
npm run dev
# Navigate to recording page, record something
# Verify it appears in: psql nhonly_dev -c "SELECT * FROM stories;"
```

### Staging → Production (against nhonly_prod)
```bash
# On live server:
# 1. Verify environment variables
echo $DATABASE_URL  # Should include "nhonly_prod"

# 2. Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# 3. Test recording save via API
curl -X POST https://nhon-ly.org/api/stories \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","durationMs":1000}'

# 4. Verify it's in prod database, not dev
psql nhonly_prod -c "SELECT COUNT(*) FROM stories WHERE environment='production';"
```

## Risk Mitigation

**If dev and prod databases get mixed:**

1. STOP the app immediately
2. Identify which database was accessed
3. Run restoration from backup:
```bash
# Restore production from backup
psql nhonly_prod < /backups/nhonly_prod_BACKUP.sql
```
4. Verify environment variables are correct
5. Restart app
6. Audit what was mixed (timestamps, data)

**Prevent this by:**
- Automated environment checks on startup (Phase 4)
- Unique indexes by environment
- Separate database users (one for dev, one for prod)
- Read-only production credentials for anyone without backup access

## Files to Create/Modify

- `src/routes/api/stories/+server.ts` — API endpoints
- `src/lib/db.ts` — Database connection layer
- `src/lib/config.ts` — Environment verification
- `.env.example` — Template with DATABASE_URL
- `schema.sql` — PostgreSQL schema
- `backup.sh` — Backup automation
- `.env.production` — Production secrets (server only)
- `.env.local` — Development secrets (git-ignored)

## Success Criteria

✓ Recordings persisted on server (not just client)
✓ Dev database completely separate from production
✓ Automatic environment verification on startup
✓ Users can access recordings across devices
✓ Admin can view/manage all recordings
✓ Daily backups running
✓ Disaster recovery tested

## Current Blockers

⚠️ **No PostgreSQL server** — Need to provision
⚠️ **No API layer** — Need to build routes
⚠️ **Live site broken** — Deploy the exhibit work to fix
⚠️ **No backup strategy** — Need to implement

Priority: Get Phase 1 + Phase 2 done ASAP to unblock users.
