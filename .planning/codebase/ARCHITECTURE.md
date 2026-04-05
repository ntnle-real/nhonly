# Architecture

**Analysis Date:** 2026-04-05

## Pattern Overview

**Overall:** C3 Contract-Driven Development + SvelteKit Frontend

The nhonly codebase follows a contract-driven architecture where every function declares its intent (Purpose), success conditions, and failure conditions before implementation. The application is a SvelteKit web app built around three core domains: audio recording, story archival, and internationalization. Code uses spatial proof patterns (MARK boundaries, observable contracts, obs API instrumentation) to maintain verifiable code as the system grows.

**Key Characteristics:**
- **C3 kernel foundation** — All code should follow contract-driven patterns from `C3/kernel/` (not external references)
- **Svelte 5 runes** — Client-side state management using Svelte's reactive `$state()` runes
- **Declarative contracts** — Every function declares Purpose, Success, Failure before implementation
- **Observation API** — obs.step, obs.observe, obs.return_ create audit trails matching contracts
- **Browser-native APIs** — Web Audio API for recording, IndexedDB for persistence
- **Gradual enhancement** — Works in modern browsers with getUserMedia and IndexedDB support

## Layers

**Contracts & Theory (C3/kernel/):**
- Purpose: Define the C3 contract philosophy, forcing clarity before code
- Location: `C3/kernel/THEORY.md`, `C3/kernel/BOOTSTRAP.md`, `C3/kernel/CONTRACTS.md`
- Contains: Conceptual foundation, pattern templates, observation API reference
- Depends on: Nothing (self-contained kernel)
- Used by: All feature code must reference and follow these templates

**UI/Route Layer (src/routes/):**
- Purpose: SvelteKit page components that handle user interactions and state flow
- Location: `src/routes/+page.svelte`, `src/routes/+layout.svelte`
- Contains: Page-level Svelte components, state management with $state(), event handlers
- Depends on: Library modules (`src/lib/recording`, `src/lib/archive`, `src/lib/i18n`)
- Used by: Browser client

**Business Logic Layer (src/lib/):**
- Purpose: Encapsulate domain logic (recording, archival, translation) as contract-bound functions
- Location: `src/lib/recording.ts`, `src/lib/archive.ts`, `src/lib/i18n.ts`
- Contains: Recording state machine, IndexedDB transaction wrappers, language dictionaries
- Depends on: Browser APIs (MediaRecorder, IndexedDB, navigator.mediaDevices)
- Used by: Route components call these functions with explicit success/failure handling

**Configuration (src/, root):**
- Purpose: SvelteKit & TypeScript configuration, app type definitions
- Location: `svelte.config.js`, `tsconfig.json`, `src/app.d.ts`
- Contains: Vite/SvelteKit adapter config, TypeScript compiler options, rune mode enablement
- Depends on: @sveltejs/kit, TypeScript runtime
- Used by: Build pipeline and type checker

**Examples & Templates (C3/EXAMPLES/ and C3/kernel/EXAMPLES/):**
- Purpose: Reference implementations showing C3 patterns in action for multiple languages
- Location: `C3/kernel/EXAMPLES/typescript/`, `C3/kernel/EXAMPLES/svelte/` (primary); `C3/EXAMPLES/` (may contain project-specific versions)
- Contains: Transform, validate, component pattern examples
- Depends on: C3 kernel patterns
- Used by: Developers learning and implementing new contracts

## Data Flow

**Recording Flow (user tells story):**

1. User taps "Tell your story" button → `handleStartRecording()` in `+page.svelte`
2. Route calls `startRecording()` from `src/lib/recording.ts`
3. `startRecording()` declares: Purpose: capture audio stream, Success: stream acquired + timer started, Failure: getUserMedia denied
4. On success → creates MediaRecorder, starts chunk collection, starts timer interval
5. Component polls `getElapsedMs()` every 100ms to update timer display
6. User taps stop button → `handleStopRecording()`
7. Route calls `stopRecording()` → returns Blob of recorded audio
8. Blob stored in component state `audioBlob`

**Archival Flow (user saves story):**

1. User enters title and taps "Archive" → `handleArchive()` in `+page.svelte`
2. Route validates title not empty, calls `saveStory(title, audioBlob)` from `src/lib/archive.ts`
3. `saveStory()` declares: Purpose: persist story with metadata, Success: transaction complete + ID returned, Failure: write failed
4. On success → IndexedDB write transaction completes, returns auto-increment ID
5. Component receives ID, displays status message "Story archived", resets state

**Translation Flow (user toggles language):**

1. User taps language button → `toggleLanguage()` in `+page.svelte`
2. Reads current language from `currentLanguage` store
3. Calls `setLanguage(newLang)` from `src/lib/i18n.ts` → updates store
4. All UI bound to `t(key)` getter function
5. UI reactively re-renders with new language strings

**State Management:**

- **Page component state:** Uses Svelte 5 `$state()` runes for recordingState, elapsedMs, audioBlob, storyTitle, statusMessage
- **Global language state:** `currentLanguage` writable store persists across route changes (not persisted to browser storage)
- **Database connection state:** `db` variable in `src/lib/archive.ts` opened once on `initDatabase()` call in onMount
- **Recording session state:** MediaRecorder instance and audio chunks buffer in `src/lib/recording.ts` module scope

## Key Abstractions

**Contract Declaration (MARK + Purpose + Success + Failure):**
- Purpose: Name and declare the intent, success, failure of a code region before implementation
- Examples: Every function in `src/lib/*.ts` declares MARK comments with Purpose/Success/Failure before code
- Pattern: MARK header → Purpose one-liner → Success conditions → Failure conditions → implementation
- Examples in codebase: `src/lib/recording.ts` line 1-3, `src/lib/archive.ts` line 1-3, `src/lib/i18n.ts` line 1-3

**Observation API (obs.read, obs.step, obs.observe, obs.return_):**
- Purpose: Create readable audit trails proving execution matched declared contract
- Usage in current code: Comments mark expected calls (SUCCESS/FAILURE comments in implementation)
- Pattern: Gradient thinking — successive markers trace logical flow matching contract clauses
- Future integration: Functions accepting obs parameter can instrument execution

**Recording Session (implicit state machine):**
- Purpose: Encapsulate MediaRecorder lifecycle and audio chunk collection
- Pattern: startRecording() initializes, chunks accumulate on ondataavailable, stopRecording() finalizes Blob
- States: null (not recording) → MediaRecorder instance (recording) → Blob (stopped)
- Location: `src/lib/recording.ts` module scope variables

**Language Store (Svelte writable):**
- Purpose: Centralized reactive language selection
- Pattern: Writable store exported for subscription, `setLanguage()` updates, `t(key)` reads with fallback
- Fallback: Missing keys default to English, then to key itself if missing from all languages
- Location: `src/lib/i18n.ts` lines 43-68

## Entry Points

**Browser Entry (SvelteKit Auto Adapter):**
- Location: `src/routes/+page.svelte` (SvelteKit root page)
- Triggers: Browser HTTP GET / (auto-loaded by @sveltejs/adapter-auto)
- Responsibilities: Render three UI states (idle, recording, stopped), dispatch to library functions, display messages

**Layout Wrapper:**
- Location: `src/routes/+layout.svelte`
- Triggers: Loaded before any page component
- Responsibilities: Apply favicon via svelte:head, render page children via {@render children()}

**Initialization:**
- Location: `+page.svelte` onMount hook (lines 15-24)
- Triggers: Component mounts to DOM
- Responsibilities: Call `initDatabase()`, start elapsed time interval with 100ms tick

## Error Handling

**Strategy:** Try-catch at component level, contracts declare Success/Failure conditions in comments

**Patterns:**
- **Browser API errors (recording):** `src/lib/recording.ts` startRecording() throws on getUserMedia denial → caught in handleStartRecording() → sets statusMessage to "Microphone access denied"
- **Database errors (archival):** `src/lib/archive.ts` saveStory() throws on transaction failure → caught in handleArchive() → sets statusMessage to "Failed to archive story"
- **Graceful degradation:** t(key) in `src/lib/i18n.ts` falls back to English, then to key itself if missing
- **Recording state validation:** stopRecording() checks mediaRecorder not null before stopping, rejects Promise if not initialized

## Cross-Cutting Concerns

**Logging:** Minimal formalized logging; browser console.error used in `src/lib/recording.ts` error handler (line 42)

**Validation:**
- Title validation in handleArchive() — must be non-empty string (line 54-56 in +page.svelte)
- Email-like validation example in `C3/kernel/EXAMPLES/svelte/FormValidator.svelte` (shows contract pattern but not used in nhonly)

**Authentication:** Not applicable — app is client-side only, no user login

**Constraints (IndexedDB):**
- `DB_NAME = 'nhonly_archive'` scoped to origin in `src/lib/archive.ts` line 12
- `DB_VERSION = 1` for schema versioning (line 13)
- `STORE_NAME = 'stories'` with autoIncrement primary key on id (line 14)
- Database accessed via Promise-based IndexedDB API with transaction patterns

---

*Architecture analysis: 2026-04-05*
