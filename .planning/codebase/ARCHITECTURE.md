# Architecture & Design Patterns

## High-Level Architecture

**Client-Side SPA** (Single Page Application)
```
SvelteKit Router → Svelte Components → UI State (Runes) → Service Layer
                                           ↓
                                   Web Audio API / IndexedDB
```

## Layer Structure

### 1. Routing Layer
- **Location:** `src/routes/`
- **Files:**
  - `+page.svelte` - Main application page (all functionality)
  - `+layout.svelte` - Root layout wrapper

**Routing:** SvelteKit file-based routing
- Single route: `src/routes/+page.svelte` serves `/`
- All application logic on single page

### 2. UI Component Layer
- **Location:** `src/routes/+page.svelte`
- **Pattern:** Monolithic component (all UI in one file)
- **State Management:** Svelte 5 runes (`$state`)
  - `recordingState` - Tracks UI state (idle/recording/stopped)
  - `elapsedMs` - Recording duration
  - `audioBlob` - Recorded audio data
  - `storyTitle` - User-entered title
  - `statusMessage` - Transient feedback messages

**UI States:**
1. **Idle** - "Tell your story" button shown
2. **Recording** - Timer displayed, stop button active
3. **Stopped** - Title input, archive button shown

### 3. Service Layer
- **Location:** `src/lib/`
- **Services:**
  - `recording.ts` - Audio capture and playback control
  - `archive.ts` - IndexedDB persistence
  - `i18n.ts` - Language and text management

**Service Pattern:** Functional modules (not classes), exported as functions

### 4. Data Layer
- **Storage:** IndexedDB (client-only)
- **Schema:**
  - Database: `nhonly_archive`
  - Object Store: `stories`
  - Fields: `id` (auto), `title`, `audioBlob`, `timestamp`

## Control Flow - Happy Path

```
1. User clicks "Tell your story"
   → handleStartRecording()
   → startRecording() [recording.ts]
   → navigator.mediaDevices.getUserMedia({ audio: true })
   → recordingState = 'recording'

2. User clicks "Stop"
   → handleStopRecording()
   → stopRecording() [recording.ts]
   → Returns Blob (WAV format)
   → recordingState = 'stopped'

3. User enters title, clicks "Archive"
   → handleArchive()
   → saveStory(title, audioBlob) [archive.ts]
   → IndexedDB transaction writes record
   → recordingState = 'idle'
   → Status message shown for 3 seconds
   → Reset all state
```

## Key Design Decisions

### 1. Single-Page, Monolithic Component
- All UI logic in `+page.svelte`
- **Rationale:** Simple MVP with minimal feature set
- **Trade-off:** Becomes harder to maintain as features grow

### 2. Functional Services over Classes
- Services exported as functions, not objects
- State managed at service module level (closures)
- **Rationale:** Simplicity, no OOP overhead
- **Trade-off:** Global state harder to test, requires careful initialization

### 3. Svelte Stores for Reactive State
- Language preference in `currentLanguage` store
- **Rationale:** Reactive updates across components
- **Trade-off:** Language selection lost on page reload (not persisted)

### 4. IndexedDB for Persistence
- Browser native, no backend required
- **Rationale:** Works offline, zero infrastructure
- **Trade-off:** Data not synced, limited search/query capabilities

### 5. Minimal Styling
- Inline CSS in `<style>` blocks
- No CSS framework or preprocessor
- **Rationale:** Reduces dependencies, small bundle
- **Trade-off:** Styling logic scattered across components

## Error Handling Pattern

```typescript
try {
  // Attempt operation
  await operation()
} catch (error) {
  // Set user-facing message
  statusMessage = 'User-friendly error text'
}
```

- Errors caught at component level
- User-facing messages in `statusMessage`
- Console logs for debugging (console.error in recording.ts)

## Lifecycle & Initialization

**Component Mount (onMount):**
1. `initDatabase()` - Initialize IndexedDB connection
2. Start timer interval for elapsed time tracking (100ms tick)
3. Store cleanup on unmount

**No server-side initialization** - All setup happens in browser.

## Async Patterns

- `async/await` for MediaRecorder, IndexedDB
- Promise-based APIs wrapped in async functions
- Error propagation via try/catch

## State Persistence

**Persisted:**
- Recorded audio stories in IndexedDB
- Story metadata (title, timestamp)

**NOT Persisted:**
- Current language preference (Svelte store, session-only)
- Recording state
- UI state

## Access Control & Security

- No authentication layer
- No authorization
- All data accessible to current browser user
- Uses browser's Same-Origin Policy

## Scalability Concerns

Current design assumes:
- Single user per browser
- Reasonable number of stories (IndexedDB quota ~50MB)
- No real-time sync needed
- No cross-device data access

Suitable for: Personal story recording app
Not suitable for: Multi-user collaboration, data sync, social features
