# External Integrations

**Analysis Date:** 2026-04-05

## APIs & External Services

**None Configured:**
This application has no external API integrations. All functionality is self-contained and client-side.

## Data Storage

**Databases:**
- IndexedDB (browser native)
  - Database name: `nhonly_archive`
  - Version: 1
  - Object store: `stories` with auto-increment ID
  - Implementation: `src/lib/archive.ts`
  - Functions: `initDatabase()`, `saveStory()`, `getAllStories()`, `getStory()`

**File Storage:**
- Browser memory (Blob objects)
- No persistent file storage backend
- Audio blobs stored only in IndexedDB (in-browser database)

**Caching:**
- None (SvelteKit default caching via adapter)

## Authentication & Identity

**Auth Provider:**
- None (not applicable - single-user, client-only application)

## Monitoring & Observability

**Error Tracking:**
- None (errors logged to browser console via `console.error()` in `src/lib/recording.ts`)

**Logs:**
- Browser console only
- Error output in `src/lib/recording.ts` line 42: `console.error('Failed to start recording:', error)`

## CI/CD & Deployment

**Hosting:**
- Flexible via @sveltejs/adapter-auto (SvelteKit detects environment automatically)
- Possible targets: Vercel, Netlify, Cloudflare, AWS Lambda, Node.js servers

**CI Pipeline:**
- None configured (no GitHub Actions, GitLab CI, or similar)

## Environment Configuration

**Required env vars:**
- None (zero environment-dependent configuration)

**Secrets location:**
- Not applicable (no secrets managed)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser APIs Used

**Web Audio API:**
- `navigator.mediaDevices.getUserMedia()` - Microphone access
- `MediaRecorder` - Audio capture and streaming
- `BlobEvent` - Audio data chunks
- Implementation: `src/lib/recording.ts` lines 22-32

**IndexedDB:**
- Database operations for story persistence
- Implementation: `src/lib/archive.ts` lines 20-127

**Svelte Stores:**
- `writable()` store for language state
- Implementation: `src/lib/i18n.ts` line 43

---

*Integration audit: 2026-04-05*
