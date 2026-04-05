# External Integrations & APIs

## Third-Party Services

Currently **NONE** - this is a standalone, offline-first application.

## Browser APIs (Built-in)

### Media APIs
- **Web Audio API**
  - `navigator.mediaDevices.getUserMedia()` - Request microphone permission
  - `MediaRecorder` API - Encode audio to WAV format
  - `AudioContext` available but not actively used
  - **Risk:** Requires HTTPS in production (exception: localhost in development)

### Storage APIs
- **IndexedDB** - Client-side persistent database
  - No external server sync
  - Data persists locally in browser
  - Subject to browser storage quotas (typically 50MB+)

### Internationalization
- **No external i18n service** - Strings hardcoded in `src/lib/i18n.ts`
- Supports: English (en), Vietnamese (vi)
- Language selection stored in Svelte store (session-only, not persisted)

## Deployment

- **No backend server required**
- **No API endpoints**
- **No third-party services integrated**
- Can deploy to any static hosting (Vercel, Netlify, GitHub Pages, S3, etc.)

## Environment Configuration

- No environment variables configured
- No secrets management needed
- No configuration files for external services

## Data Flow

```
User Input → Svelte Components → Recording Service (Web Audio API) →
Audio Blob → Archive Service → IndexedDB → Retrieval on Demand
```

All data stays in the browser - no network communication.

## GDPR & Privacy

- **No data collection** - stories stored locally only
- **No analytics** - no tracking services integrated
- **No third-party cookies** - stateless application
- Users maintain full ownership of their data
