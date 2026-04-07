# Database Options: Choose Your Path

Two proven paths to fix the data persistence issue.

## Option 1: Self-Hosted Docker (Choose This If You Want Full Control)

Run PostgreSQL in Docker on your existing server.

| Aspect | Details |
|--------|---------|
| **Cost** | $0/month |
| **Setup Time** | 2 hours |
| **Maintenance** | Manual backups, monitoring, OS patches |
| **Control** | Complete — everything on your server |
| **Ops Load** | Medium — you manage everything |
| **Scalability** | Fine for small/medium user base |

**Files needed:**
- `docker-compose.yml` — Define dev + prod containers
- `Dockerfile` — Build Node.js app container
- `schema.sql` — Database schema
- `backup.sh` — Automated backup script
- `.env.local` and `.env.production` — Connection strings

**Dev/Prod Separation:**
- Separate Docker containers
- Separate usernames/passwords
- Separate databases (nhonly_dev / nhonly_prod)
- Docker network isolation

**Read:** `docs/SELF-HOSTED-POSTGRES.md`

---

## Option 2: Supabase Cloud (Choose This If You Want Zero Ops)

Managed PostgreSQL in the cloud.

| Aspect | Details |
|--------|---------|
| **Cost** | $25/month (Pro tier) |
| **Setup Time** | 30 min |
| **Maintenance** | Supabase handles everything |
| **Control** | Limited but sufficient — managed service |
| **Ops Load** | Zero — they backup/monitor for you |
| **Scalability** | Excellent — grows with your needs |

**What you do:**
1. Sign up at supabase.com
2. Create two projects (dev + prod)
3. Run schema.sql in each
4. Add credentials to .env files

**Dev/Prod Separation:**
- Physically separate Supabase projects
- Separate API keys (dev vs prod)
- Separate databases (same company, completely isolated)
- Automatic disaster recovery

**Read:** `docs/SUPABASE-SETUP.md`

---

## Quick Comparison

| Feature | Self-Hosted | Supabase |
|---------|-------------|----------|
| **Initial setup** | 2 hours | 30 min |
| **Monthly cost** | $0 | $25 |
| **Backups** | Manual (scripted) | Automatic |
| **Disaster recovery** | Manual restore | Click to restore |
| **Monitoring** | Your responsibility | Built-in dashboard |
| **Database patching** | Your responsibility | Automatic |
| **Scaling up later** | Buy bigger server | Upgrade plan |
| **Support** | Community only | Supabase support |
| **Vendor lock-in** | None | PostgreSQL standard, easy to migrate |

---

## My Recommendation

**Self-hosted Docker** because:
1. You already host the frontend
2. Full control of your data
3. Zero monthly costs
4. All infrastructure in one place
5. PostgreSQL is standard — easy to migrate later if needed

The "manual ops" parts are mostly automated (backups via cron, health checks via script).

---

## Decision Matrix

Choose **Self-Hosted** if:
- ✓ You want zero cloud costs
- ✓ You prefer full control
- ✓ You're comfortable with Linux ops
- ✓ You want everything on one server

Choose **Supabase** if:
- ✓ You want zero ops burden
- ✓ You prioritize uptime over cost
- ✓ You want professional disaster recovery
- ✓ You want to focus on product, not infrastructure

---

## Implementation Path (Either Option)

### Step 1: Fix Live Site (Today)
```bash
git push origin dev:main
# Live deployment auto-rebuilds with exhibit system
```

### Step 2: Choose Database (Today)

Read both guides and decide:
- Self-hosted? → Read `docs/SELF-HOSTED-POSTGRES.md`
- Supabase? → Read `docs/SUPABASE-SETUP.md`

### Step 3: Set Up Database (This Week)

**If self-hosted:**
```bash
# Create docker-compose.yml, Dockerfile, schema.sql
# Test locally: docker-compose up -d
# Deploy to nhon-ly.org
```

**If Supabase:**
```bash
# Create two projects
# Run schema.sql in both
# Save credentials to .env files
```

### Step 4: Implement API Layer (This Week)

Both options use same API endpoints:
- `src/lib/stories.server.ts` — Database operations
- `src/routes/api/stories/+server.ts` — API routes
- Update UI to use `/api/stories` instead of IndexedDB

### Step 5: Deploy & Migrate (Next Week)

Update recording/archive UI to use new API, deploy to production.

---

## Timeline

| Option | Week 1 | Week 2 | Week 3 |
|--------|--------|--------|--------|
| **Self-Hosted** | Setup Docker, test locally | Implement API | Deploy + migrate |
| **Supabase** | Create projects | Implement API | Deploy + migrate |

Both complete in 2-3 weeks from decision.

---

## Questions?

**Q: Can we switch later?**
A: Yes. PostgreSQL is standard. Self-hosted → Supabase or vice versa takes a few hours (export data, import to new database).

**Q: What if self-hosted server dies?**
A: Daily backups to `/backups` on server. Plus Docker makes it easy to rebuild from git + backup.

**Q: What if Supabase goes down?**
A: They have 99.9% SLA + automatic failover. Highly unlikely, but you can export your data anytime.

**Q: Can users migrate existing recordings from IndexedDB?**
A: Yes, both options include migration helper code. Low priority since app is new.

---

## Next Step: Tell Me Your Choice

Once you decide, I'll implement the full database layer + API endpoints.

Send one of:
- "Let's do self-hosted Docker"
- "Let's use Supabase"

Then I'll guide you through setup → testing → deployment.
