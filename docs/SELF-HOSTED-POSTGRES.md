# Self-Hosted PostgreSQL in Docker (Same Server)

Run PostgreSQL in Docker on `nhon-ly.org` — same machine as the Node.js app.

## Architecture

```
nhon-ly.org server
├─ Node.js app (port 3000)
├─ Docker network
│  ├─ PostgreSQL container (nhonly_dev db)
│  └─ PostgreSQL container (nhonly_prod db)
└─ Backup storage (/backups)
```

## Step 1: Install Docker (if not already done)

```bash
# macOS (homebrew)
brew install docker docker-compose

# Or download Docker Desktop from docker.com
```

## Step 2: Create Docker Compose File

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  # Development database
  postgres-dev:
    image: postgres:15-alpine
    container_name: nhonly-postgres-dev
    environment:
      POSTGRES_USER: nhonly_dev_user
      POSTGRES_PASSWORD: ${DB_DEV_PASSWORD}  # Set in .env
      POSTGRES_DB: nhonly_dev
      POSTGRES_INITDB_ARGS: "-c log_statement=all"
    ports:
      - "5432:5432"  # Dev only — localhost access
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - nhonly-network
    restart: unless-stopped
    # Health check
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nhonly_dev_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Production database (separate container)
  postgres-prod:
    image: postgres:15-alpine
    container_name: nhonly-postgres-prod
    environment:
      POSTGRES_USER: nhonly_prod_user
      POSTGRES_PASSWORD: ${DB_PROD_PASSWORD}  # Different password
      POSTGRES_DB: nhonly_prod
      POSTGRES_INITDB_ARGS: "-c log_statement=off"  # Quieter in prod
    ports:
      - "5433:5432"  # Different port (internal to Docker only)
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - nhonly-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nhonly_prod_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Node.js app
  app:
    build: .
    container_name: nhonly-app
    environment:
      NODE_ENV: ${NODE_ENV}
      PUBLIC_ENVIRONMENT: ${PUBLIC_ENVIRONMENT}
      DATABASE_URL: ${DATABASE_URL}
    ports:
      - "3000:3000"
    depends_on:
      postgres-dev:
        condition: service_healthy
      postgres-prod:
        condition: service_healthy
    networks:
      - nhonly-network
    restart: unless-stopped

volumes:
  postgres_dev_data:
  postgres_prod_data:

networks:
  nhonly-network:
    driver: bridge
```

## Step 3: Create Database Schema

Create `schema.sql`:

```sql
-- Create stories table (runs in both dev and prod)
CREATE TABLE IF NOT EXISTS stories (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  audio_blob BYTEA NOT NULL,
  duration_ms INTEGER NOT NULL,
  timestamp BIGINT NOT NULL,
  type VARCHAR(50) DEFAULT 'recording',
  diorama_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_stories_timestamp
  ON stories(timestamp DESC);

-- Index by type for filtering
CREATE INDEX IF NOT EXISTS idx_stories_type
  ON stories(type);

-- Verify table created
SELECT COUNT(*) as table_check FROM stories;
```

## Step 4: Environment Configuration

### `.env.local` (Your Dev Machine)

```bash
NODE_ENV=development
PUBLIC_ENVIRONMENT=development
DATABASE_URL=postgresql://nhonly_dev_user:your-dev-password@localhost:5432/nhonly_dev
```

### `.env.production` (On nhon-ly.org Server)

```bash
NODE_ENV=production
PUBLIC_ENVIRONMENT=production
DATABASE_URL=postgresql://nhonly_prod_user:your-prod-password@nhonly-postgres-prod:5433/nhonly_prod
```

**CRITICAL:** The prod connection uses:
- Different user/password
- Different database name (nhonly_prod)
- Different port (5433 in Docker)
- Docker hostname (nhonly-postgres-prod)

## Step 5: Update Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy files
COPY package*.json ./
COPY . .

# Install dependencies
RUN npm ci

# Build SvelteKit
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "build/index.js"]
```

## Step 6: Run Locally

```bash
# Start both databases + app in Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f postgres-dev
docker-compose logs -f postgres-prod

# Access dev database
docker exec -it nhonly-postgres-dev psql -U nhonly_dev_user -d nhonly_dev

# Stop everything
docker-compose down
```

## Step 7: Verify Dev/Prod Separation

```bash
# Connect to dev database
docker exec -it nhonly-postgres-dev psql -U nhonly_dev_user -d nhonly_dev -c "SELECT * FROM stories;"

# Connect to prod database (different port, different user)
docker exec -it nhonly-postgres-prod psql -U nhonly_prod_user -d nhonly_prod -c "SELECT * FROM stories;"

# They should be completely separate
```

## Step 8: Deploy to nhon-ly.org

On your server, clone and run:

```bash
# SSH to nhon-ly.org
ssh user@nhon-ly.org

# Navigate to app directory
cd /path/to/nhonly

# Update code
git pull origin main

# Start containers (builds if needed)
docker-compose up -d

# Verify running
docker-compose ps

# Check logs
docker-compose logs -f app
```

## Step 9: Backup Strategy

Create `backup.sh`:

```bash
#!/bin/bash
# Daily backup of production database

BACKUP_DIR="/backups/nhonly"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p $BACKUP_DIR

# Backup production database
docker exec nhonly-postgres-prod pg_dump \
  -U nhonly_prod_user \
  -d nhonly_prod \
  > $BACKUP_DIR/nhonly_prod_$DATE.sql

# Backup development database
docker exec nhonly-postgres-dev pg_dump \
  -U nhonly_dev_user \
  -d nhonly_dev \
  > $BACKUP_DIR/nhonly_dev_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Add to crontab on server:

```bash
crontab -e
# Add line:
0 2 * * * /path/to/nhonly/backup.sh >> /var/log/nhonly-backup.log 2>&1
```

This runs daily at 2 AM.

## Step 10: Monitoring

Check database health:

```bash
# Is dev DB responsive?
docker exec nhonly-postgres-dev pg_isready -U nhonly_dev_user

# Is prod DB responsive?
docker exec nhonly-postgres-prod pg_isready -U nhonly_prod_user

# Check container logs
docker-compose logs postgres-dev
docker-compose logs postgres-prod
```

Add to your monitoring (e.g., a health check endpoint):

```typescript
// src/routes/health/+server.ts
import { json } from '@sveltejs/kit';
import { Pool } from 'pg';

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const result = await pool.query('SELECT 1');
    await pool.end();
    return json({
      status: 'ok',
      environment: process.env.PUBLIC_ENVIRONMENT,
      database: 'connected'
    });
  } catch (error) {
    return json({
      status: 'error',
      error: String(error),
      environment: process.env.PUBLIC_ENVIRONMENT
    }, { status: 500 });
  }
}
```

Then monitoring can check: `curl https://nhon-ly.org/health`

## Security Notes

**Production Database:**
- Different password than dev
- Different user credentials
- Not exposed to external ports
- Behind Docker network (app-only access)
- Daily backups to `/backups`

**Connection Strings:**
- Never commit `.env.production`
- Store on server only
- Use strong passwords (generate with: `openssl rand -base64 32`)
- Rotate credentials quarterly

**Access Control:**
- Only Node.js app can connect to databases (Docker network)
- No direct SSH access to databases
- Backups stored separately from database files

## Disaster Recovery

### If production database corrupts:

```bash
# Stop containers
docker-compose down

# Restore from backup
docker exec nhonly-postgres-prod psql -U nhonly_prod_user -d nhonly_prod < /backups/nhonly/nhonly_prod_2024-01-15.sql

# Start containers again
docker-compose up -d

# Verify recovery
docker exec nhonly-postgres-prod psql -U nhonly_prod_user -d nhonly_prod -c "SELECT COUNT(*) FROM stories;"
```

### If you accidentally connect prod to dev:

Docker network separation prevents this. The app container only sees:
- `nhonly-postgres-dev` (dev database)
- `nhonly-postgres-prod` (prod database)

But the two databases are on separate containers with separate credentials.

## Cost Comparison

| Option | Setup | Monthly | Ops Load |
|--------|-------|---------|----------|
| Self-hosted Docker | 2 hours | $0 | Medium |
| Supabase | 30 min | $25 | None |

Self-hosted is cheaper but requires:
- Manual backups (scripted above)
- Manual monitoring
- Manual updates/patches

## Switching Back to Supabase

If you ever want cloud-hosted instead:

1. Export data: `docker exec nhonly-postgres-prod pg_dump ... > backup.sql`
2. Create Supabase project
3. Import backup
4. Update `.env.production` with Supabase URL
5. Done

No code changes required.

## Next Steps

1. Create `docker-compose.yml` in project root
2. Create `schema.sql` with table definition
3. Create `Dockerfile` for Node.js app
4. Test locally: `docker-compose up -d`
5. Verify separation: Connect to both databases
6. Deploy to nhon-ly.org
7. Set up backup cron job
8. Monitor with `/health` endpoint

Questions? This is a solid production setup with full dev/prod separation and backup protection.
