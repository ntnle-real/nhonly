# CRITICAL: Database Architecture Status

## Live Deployment Issue (Right Now)

**Status:** `https://nhon-ly.org` returns HTTP 500 "Internal Error"

**Likely causes:**
1. Missing exhibit files in main branch
2. Build error on live server

**Fix (immediate):** Need to push exhibit commits to main and redeploy.

---

## Bigger Issue (This Must Be Fixed)

### Current Architecture Problem

Everything is **client-side only** — no server database:

```
User Browser                       Live Server
├─ Record audio                   ├─ Serves web app
├─ Store in IndexedDB only         └─ NO DATABASE
└─ Recording lost if cache cleared
```

### This is Broken Because:

❌ **No persistence** — Recordings vanish when browser cache is cleared
❌ **No backup** — Users can't see their recordings from another device
❌ **No audit trail** — You can't see/manage user recordings
❌ **Dev = Prod** — Both use same client-side structure (no separation)
❌ **No recovery** — Users have no way to recover lost recordings

### Current State vs. What Users Need

| Need | Current | Required |
|------|---------|----------|
| Record a story | ✓ Works | ✓ Works |
| Save it | ✓ IndexedDB | ✗ BROKEN — can be lost |
| Access from other device | ✗ Impossible | ✓ Required |
| Backup your recording | ✗ None | ✓ Required |
| Admin see all recordings | ✗ Can't | ✓ Required |
| Dev/prod separation | ✗ None | ✓ Required |

---

## Solution: Supabase (Choose This)

Move to managed PostgreSQL + storage.

**Pros:**
- Instant setup (no ops)
- Automatic backups
- Clear dev/prod separation (separate projects)
- Audio storage built-in
- 2-week implementation

**Cons:**
- $25/month after free tier

**Recommended:** Do this immediately.

---

## Timeline

### TODAY: Fix Live Deployment
```bash
git push origin dev:main
# Live site auto-deploys with exhibit system
```

### THIS WEEK: Set Up Supabase
1. Create dev + prod projects (30 min)
2. Define schema (10 min)
3. Build API layer (2 hours)
4. Test locally (1 hour)

**By end of week:** Users can save recordings that aren't lost.

### NEXT WEEK: Migrate & Deploy
1. Update UI to use new API (2 hours)
2. Migrate existing recordings (if any) (1 hour)
3. Deploy to production (30 min)
4. Monitor (ongoing)

---

## Immediate Actions (Do Now)

### 1. Fix Live Site (5 min)

The exhibit system is complete but only on `dev` branch:

```bash
# Push to main → auto-deploys
git push origin dev:main

# Or merge properly
git checkout main
git merge dev
git push origin main
```

This fixes the HTTP 500.

### 2. Start Supabase Setup (Today/Tomorrow)

Follow `docs/SUPABASE-SETUP.md`:

1. Go to supabase.com
2. Create `nhonly-dev` project
3. Create `nhonly-prod` project
4. Save both sets of credentials

This takes 15 minutes and unblocks everything else.

### 3. Implement Database Layer (This Week)

Use the code templates in `SUPABASE-SETUP.md`:
- `src/lib/supabase.server.ts` — Connection
- `src/lib/stories.server.ts` — Operations
- `src/routes/api/stories/+server.ts` — API

This is 2-3 hours of straightforward implementation.

---

## Questions to Answer

**Q: Why is there no database now?**
A: The app started as a pure frontend (browser recording). Real users need persistence, backups, and management — that requires a backend.

**Q: Can we keep using IndexedDB?**
A: No. It's only for browser cache, not production user data. Users are losing recordings.

**Q: Why Supabase over self-hosted?**
A: Faster setup, automatic backups, built-in storage, clear environment separation. Zero ops overhead.

**Q: How do we prevent dev/prod mixing?**
A: Supabase projects are separate databases + separate credentials:
- Dev project with dev API keys
- Prod project with prod API keys
- Never the twain shall meet (unless someone misconfigures)

**Q: What about existing recordings?**
A: If any users have saved recordings in IndexedDB, we need a migration helper. Low priority — most likely there aren't many yet since the app is new.

---

## Files Created (For Your Reference)

- `docs/ENVIRONMENT-SEPARATION.md` — General env strategy
- `docs/DATABASE-MIGRATION.md` — Detailed migration plan (generic PostgreSQL)
- `docs/SUPABASE-SETUP.md` — **Use this one** — Supabase quick-start
- `docs/CRITICAL-STATUS.md` — This file

---

## Next Conversation

Once you confirm:
1. Live site is back up (after pushing to main)
2. Supabase projects are created

I can implement the database layer and API endpoints. Should be done in 2-3 hours once we start.

---

## TL;DR

**Right now:**
- Live site broken → push to main
- Users losing recordings → need database

**This week:**
- Create Supabase projects (15 min)
- Implement API layer (2 hours)
- Test locally (1 hour)

**Next week:**
- Deploy to production
- Users can now save recordings safely

**Then:**
- Monitor, optimize, celebrate ✨
