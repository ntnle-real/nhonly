# Environment Separation: Dev vs. Live

This document establishes the pattern for keeping development and production environments completely separate.

## Core Principle

**NEVER allow dev operations to affect live data.**

Each environment (dev, staging, live) gets:
- Its own database
- Its own API endpoints
- Its own configuration
- Its own secrets

## Environment Matrix

| Variable | Development | Production |
|----------|-------------|-----------|
| `NODE_ENV` | `development` | `production` |
| `PUBLIC_ENVIRONMENT` | `development` | `production` |
| `DATABASE_URL` | `...nhonly_dev` | `...nhonly_prod` |
| `PUBLIC_API_BASE_URL` | `http://localhost:3000` | `https://nhon-ly.org` |
| Logging | Verbose | Error-only |
| Seed Data | Test records | Real data only |

## Setup Process

### 1. Local Development

Create `.env.local`:
```bash
cp .env.example .env.local
# Edit .env.local:
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/nhonly_dev
PUBLIC_API_BASE_URL=http://localhost:3000
```

Run locally:
```bash
npm run dev
```

### 2. Production Deployment

Create `.env.production` on the live server **only**:
```bash
# On nhon-ly.org server:
NODE_ENV=production
DATABASE_URL=postgresql://prod-db-host:5432/nhonly_prod
PUBLIC_API_BASE_URL=https://nhon-ly.org
PUBLIC_ENABLE_RECORDING=true
```

**Important:** Never commit `.env.production` to git. Store it securely on the server.

### 3. Staging (Optional Future)

For QA before pushing to live:
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db-host:5432/nhonly_staging
PUBLIC_API_BASE_URL=https://staging.nhon-ly.org
```

## Environment-Aware Code

### Safe Pattern: Use environment variables for critical paths

```typescript
// ✓ SAFE: Uses environment to route to correct database
const dbUrl = process.env.DATABASE_URL;
if (process.env.NODE_ENV === 'production') {
  // Extra safety check
  if (!dbUrl.includes('nhonly_prod')) {
    throw new Error('CRITICAL: Production code must use production database');
  }
}
```

```typescript
// ✓ SAFE: Feature flags prevent accidental changes
if (process.env.PUBLIC_ENABLE_ADMIN_RESET === 'true') {
  // Only available in non-production environments
}
```

### Dangerous Pattern: Hardcoded endpoints

```typescript
// ✗ DANGER: Always hits live data
const response = await fetch('https://nhon-ly.org/api/stories');

// ✗ DANGER: Environment ignored, runs same code everywhere
const dbUrl = 'postgresql://prod-db:5432/nhonly_prod';
```

## Deployment Workflow

### Current Workflow (must maintain separation)

```mermaid
Local Dev
├─ .env.local (dev database)
├─ npm run dev
└─ Tests against nhonly_dev database

↓ (git push to main)

Live Server (nhon-ly.org)
├─ .env.production (live database)
├─ Deploy workflow runs
├─ npm run build
└─ Tests against nhonly_prod database
```

### Future Workflow (when database is added)

```
Feature Branch
├─ Local dev database
├─ Test against nhonly_dev
└─ Create PR

↓ (PR review)

Staging (optional)
├─ Deploy to staging server
├─ Test against nhonly_staging
└─ User acceptance testing

↓ (approval)

Production
├─ Deploy to live
├─ Use nhonly_prod database
└─ Monitor for errors
```

## Database Naming Convention

All databases follow this pattern:

```
nhonly_dev       → Local development (on dev machine)
nhonly_staging   → Staging server (QA testing)
nhonly_prod      → Live production (nhon-ly.org)
```

This makes it instantly obvious which environment a connection targets.

## Secrets Management

### Current (No Database)
- No secrets needed
- `.env*` files are in `.gitignore`
- All .env files are local-only

### Future (With Database)

**Local (`.env.local`):**
```bash
# Safe to create locally, never commit
DATABASE_URL=postgresql://user:password@localhost:5432/nhonly_dev
```

**Live (`.env.production`):**
- Created only on the live server
- Never committed to git
- Store using system secrets (launchctl environment, systemd ExecStart, etc.)
- Backup separately from git

### Secrets Checklist

- [ ] `.env*` files are in `.gitignore`
- [ ] Production `.env.production` exists only on live server
- [ ] Database passwords never appear in git history
- [ ] Secrets rotation documented
- [ ] Backup procedure for production secrets

## Verification Commands

### Check environment variables are set correctly

```bash
# Local dev (should show nhonly_dev)
echo $DATABASE_URL | grep nhonly_dev

# On live server (should show nhonly_prod)
echo $DATABASE_URL | grep nhonly_prod
```

### Verify database connections during deployment

The deploy workflow includes verification:
```bash
# On live server post-deploy
curl -sf http://localhost:3000 > /dev/null && echo "✓ App is responding"
# Future: Add database health check
```

### Prevent cross-environment accidents

Add a startup check in the app:
```typescript
// src/lib/config.ts
if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL?.includes('_prod')) {
    throw new Error('FATAL: Production must use production database');
  }
}
```

## Adding a Database (Checklist)

When you implement a database:

1. [ ] Choose database type (PostgreSQL recommended for relational data)
2. [ ] Create dev database locally (`nhonly_dev`)
3. [ ] Create production database on live server (`nhonly_prod`)
4. [ ] Update `.env.example` with `DATABASE_URL` template
5. [ ] Create `.env.local` for your dev machine
6. [ ] Create `.env.production` on live server (never commit)
7. [ ] Add database connection code that uses `process.env.DATABASE_URL`
8. [ ] Add safety check to verify environment matches database
9. [ ] Document backup procedure for production database
10. [ ] Test deploy workflow with database operations

## Disaster Recovery

### If dev and prod databases get mixed:

1. **STOP**: Immediately take down the affected environment
2. **ASSESS**: Confirm which database was accessed
3. **RESTORE**: Use backups to restore data
4. **VERIFY**: Check environment variables are correct
5. **REMEDIATE**: Update deploys to include environment checks
6. **AUDIT**: Review git history to understand what happened

This is prevented by following the patterns above.

## References

- `.env.example` — Template for environment variables
- `deploy.yml` — Deployment workflow (uses live environment)
- Current app state: Frontend-only (no database yet)
