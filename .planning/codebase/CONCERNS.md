# Codebase Concerns

**Analysis Date:** 2026-04-05

## C3 Contract Adoption Gaps

**Critical Issue: obs API Not Integrated**
- Issue: Codebase declares C3 contract pattern as mandatory (CLAUDE.md line 15-20), but source code does not use obs API calls anywhere
- Files: `src/lib/recording.ts`, `src/lib/archive.ts`, `src/lib/i18n.ts`, `src/routes/+page.svelte`
- Impact: **Violates core requirement** — contracts are declared in comments but not enforced at runtime; no temporal gradient proving execution matches intent
- Expected: Every function should have MARK + Purpose + Success + Failure prose, followed by contract object, followed by conduct with obs.read/step/observe/return_ calls (per CLAUDE.md §2 and kernel/BOOTSTRAP.md §THE PATTERN)
- Fix approach:
  1. Update `src/lib/recording.ts` startRecording() and stopRecording() to include full contract objects matching kernel/EXAMPLES/typescript/transform.ts pattern
  2. Add obs injection parameter to all functions
  3. Insert obs.read, obs.step, obs.observe, obs.return_ calls to trace execution
  4. Bind contracts using pattern shown in examples
  5. Repeat for archive.ts and i18n.ts

**Secondary Issue: Incomplete Spatial Proof**
- Issue: Files have MARK comments but lack formal contract definitions (no TypeScript contract interfaces like TransformUserContract in kernel/EXAMPLES/typescript/transform.ts)
- Files: All source files in `src/lib/` and `src/routes/`
- Impact: Contract intent not machine-verifiable; future code modifications have no enforcement mechanism
- Fix approach: Add TypeScript interfaces for each function's contract (serves, declares, succeeds_if, fails_if structure)

## Architecture & Design Issues

**Missing Waveform Visualization**
- Issue: REQUIREMENTS.md specifies "Live waveform visualization" as acceptance criterion, but `src/routes/+page.svelte` shows only timer feedback, no waveform display
- Files: `src/routes/+page.svelte` (lines 104-110)
- Impact: **Blocks Phase 1 completion** — users lack critical visual feedback showing recording is capturing audio
- Fix approach:
  1. Create `src/lib/waveform.ts` service using Web Audio API AnalyserNode
  2. Extract frequency data in real-time during recording
  3. Render visualization in a Canvas or SVG component
  4. Connect to recording state in +page.svelte

**Missing Pause/Resume Support**
- Issue: REQUIREMENTS.md and ROADMAP.md specify pause/resume, but `src/lib/recording.ts` has only start/stop (no pause state)
- Files: `src/lib/recording.ts`, `src/routes/+page.svelte`
- Impact: **Blocks acceptance criteria** — users cannot pause long recordings without losing entire session
- Fix approach:
  1. Extend RecordingSession interface to include pausedAt, pauseCount
  2. Add pauseRecording() function that calls mediaRecorder.pause()
  3. Add resumeRecording() function that calls mediaRecorder.resume()
  4. Track paused/resumed state separately from isRecording
  5. Update +page.svelte to show pause button during recording state

**Missing Audio Preview/Playback**
- Issue: REQUIREMENTS.md requires "Preview playback of recorded audio", but there is no playback UI in +page.svelte stopped state
- Files: `src/routes/+page.svelte` (lines 113-120)
- Impact: Users cannot verify their recording before archiving; increases anxiety about data loss
- Fix approach:
  1. Add `<audio>` element in stopped state conditional (after line 114)
  2. Create blob URL from audioBlob and bind to audio src
  3. Provide play/pause/seek controls

**Incomplete Error Handling**
- Issue: Functions catch errors but only log to console or return generic messages; no user-facing error context
- Files: `src/lib/recording.ts` (lines 40-44), `src/lib/archive.ts` (lines 50-52, 68-70), `src/routes/+page.svelte` (lines 34-36, 46-48)
- Impact: Users see "Microphone access denied" but not WHY (permission never granted? browser blocked? no device?); hard to debug
- Fix approach:
  1. Create error classification system in `src/lib/errors.ts` (RecordingError, StorageError, PermissionError types)
  2. Throw typed errors with structured context from recording.ts and archive.ts
  3. Map error types to bilingual user messages in i18n.ts
  4. Display contextual help in +page.svelte (e.g., "Check browser permissions in settings")

## Build & Deployment Readiness

**No Testing Framework Configured**
- Issue: No test files, no jest.config, no vitest.config, no test scripts in package.json
- Files: package.json (lines 6-12) — scripts section missing test commands
- Impact: **Critical risk** — Phase 1 acceptance criteria cannot be verified; no regression detection for future phases; deployment risk high
- Fix approach:
  1. Add vitest or jest to devDependencies
  2. Create `vite.config.ts` test configuration (or vitest.config.ts)
  3. Add test scripts: "test": "vitest", "test:ui": "vitest --ui", "coverage": "vitest --coverage"
  4. Create test files for each module in `src/lib/` (recording.test.ts, archive.test.ts, i18n.test.ts)
  5. Write integration tests for +page.svelte interaction flow

**No Linting or Code Style Enforcement**
- Issue: No .eslintrc, .prettierrc, or biome.json; no lint scripts in package.json
- Files: package.json, project root
- Impact: Code style inconsistent; impossible to enforce naming conventions or catch common bugs (unused variables, unreachable code)
- Fix approach:
  1. Add eslint + @typescript-eslint to devDependencies
  2. Create .eslintrc.json with strict rules for TypeScript
  3. Add prettier to devDependencies
  4. Create .prettierrc.json with consistent formatting rules
  5. Add scripts: "lint": "eslint src/", "format": "prettier --write src/"
  6. Consider adding pre-commit hook to enforce linting

**No Type Safety on Browser APIs**
- Issue: MediaRecorder, Web Audio API, IndexedDB used directly without wrapper types; Promise rejections possible but not all handled
- Files: `src/lib/recording.ts`, `src/lib/archive.ts`
- Impact: Future refactoring or debugging is fragile; unclear what APIs throw and when
- Fix approach:
  1. Wrap MediaRecorder initialization in strongly-typed service (RecordingService class)
  2. Wrap IndexedDB in strongly-typed store class (StoryArchive class)
  3. Ensure all Promise chains have .catch() handlers
  4. Use AbortController for cleanup to prevent memory leaks

**Missing Build Verification**
- Issue: No build step validation; svelte-check in package.json but no pre-commit or CI integration
- Files: package.json (line 11-12: check command present but not automated)
- Impact: TypeScript errors or Svelte type problems could ship to production undetected
- Fix approach:
  1. Create GitHub Actions workflow or similar CI (if repository is public/private)
  2. Run "npm run check" on every push to main
  3. Run "npm run build" to verify bundle succeeds
  4. Run test suite (once created) before merge

## Data Persistence & Storage Issues

**No Storage Quota Management**
- Issue: IndexedDB storage quota is browser-dependent (often 50MB-1GB) but code has no quota checking or user warning
- Files: `src/lib/archive.ts` (lines 20-44, 49-77)
- Impact: Users can record indefinitely until quota is exceeded, then operations silently fail; no graceful degradation
- Fix approach:
  1. Query navigator.storage.estimate() before saving
  2. Warn user when quota >80% full
  3. Implement age-based cleanup (delete stories older than N days)
  4. Add UI to show storage usage and allow manual deletion of old recordings

**No Data Migration Path**
- Issue: Database schema is hardcoded (DB_VERSION = 1, STORE_NAME = 'stories'); no migration system for schema changes
- Files: `src/lib/archive.ts` (lines 12-14, 35-42)
- Impact: **Blocks Phase 2** — cannot add new fields to ArchivedStory without breaking existing data; users' recorded stories could be lost
- Fix approach:
  1. Create migration system (e.g., handle onupgradeneeded with version checks)
  2. Define addMetadata migration (for Phase 4: add title, date, tags fields)
  3. Document migration testing procedure

**No Backup or Recovery**
- Issue: All data lives only in IndexedDB; if user clears browser storage or switches devices, all recordings are lost
- Files: `src/lib/archive.ts` — entire module
- Impact: **Undermines core mission** — "preserve stories with dignity" cannot be met if stories disappear on browser clear
- Fix approach:
  1. Phase 2 requirement: add cloud sync with end-to-end encryption
  2. Phase 1 interim: add export-to-download button (create downloadable WAV files with metadata JSON)
  3. Document data persistence guarantees and limitations for users

## Accessibility & UX Issues

**Large Touch Targets Not Enforced**
- Issue: Styling in +page.svelte has button padding (line 154: 0.75rem 1.5rem) but no minimum 48x48px enforcement; input fields may be too small for elderly users
- Files: `src/routes/+page.svelte` (lines 153-157, 147-151)
- Impact: Users with poor dexterity or vision may struggle; violates accessibility best practices
- Fix approach:
  1. Set minimum button height/width to 48px (mobile-friendly standard)
  2. Increase font sizes (title, labels) for readability from distance
  3. Add high-contrast color scheme validation
  4. Test with screen readers

**Insufficient Bilingual State Management**
- Issue: `src/lib/i18n.ts` uses Svelte store with subscribe pattern (line 55-58) that is error-prone; calling currentLanguage.subscribe()() returns undefined if store value changed
- Files: `src/lib/i18n.ts` (lines 54-68)
- Impact: **Potential bug** — t() function may return fallback key instead of translated string if store subscription timing is off; bilingual UI could show English keys instead of Vietnamese
- Fix approach:
  1. Refactor to use get() function from svelte/store (import { get } from 'svelte/store')
  2. Replace subscribe pattern with let lang = get(currentLanguage)
  3. Test Vietnamese locale thoroughly on all UI paths

**No Language Persistence**
- Issue: User's language choice is stored in volatile Svelte store, not persisted to localStorage
- Files: `src/lib/i18n.ts`, `src/routes/+page.svelte`
- Impact: Users must re-select language (EN/VI) every page refresh; frustrating for non-English users
- Fix approach:
  1. Initialize currentLanguage from localStorage on app start
  2. Subscribe to currentLanguage changes and save to localStorage
  3. Implement in +layout.svelte onMount()

## Performance & Scalability Concerns

**No Audio Encoding Handling**
- Issue: MediaRecorder blob type hardcoded as 'audio/wav' (archive.ts line 65) but MediaRecorder may produce different codec depending on browser
- Files: `src/lib/archive.ts` (line 65)
- Impact: Playback may fail on browsers that don't support WAV; audio quality varies unpredictably
- Fix approach:
  1. Check MediaRecorder.isTypeSupported() for audio/webm, audio/mp4, audio/wav
  2. Use best-supported codec in that order
  3. Store actual codec used in metadata
  4. Validate playback on target browsers

**No Chunked Recording for Long Sessions**
- Issue: Entire recording kept in memory as Blob (recording.ts audioChunks array); long recordings (60+ minutes) could exhaust memory
- Files: `src/lib/recording.ts` (lines 11-15, 30-31)
- Impact: **Scalability risk** — app will crash if user records very long narratives; violates use case ("5-60 minute narratives")
- Fix approach:
  1. Use MediaRecorder's ondataavailable event more frequently (requestData() every 30 seconds)
  2. Stream chunks directly to IndexedDB instead of buffering in memory
  3. Implement progress reporting so UI shows incremental save progress
  4. Test with 60+ minute recordings

**Missing Session Cleanup**
- Issue: mediaRecorder and audio stream references not cleaned up if user navigates away mid-recording
- Files: `src/lib/recording.ts`, `src/routes/+page.svelte`
- Impact: **Memory leak** — orphaned MediaRecorder holds microphone and memory; background noise leakage if user returns
- Fix approach:
  1. Export cancelRecording() function to force cleanup
  2. Call in +page.svelte beforeNavigate hook or on component destroy
  3. Ensure all tracks on stream are stopped and mediaRecorder reset to null

## Technical Debt & Code Quality

**Insufficient Type Safety in Event Handling**
- Issue: Form input binding (line 117: bind:value={storyTitle}) uses implicit string typing; no validation at type level
- Files: `src/routes/+page.svelte` (line 117)
- Impact: Risk of null/undefined being passed to saveStory(); should be caught at compile time
- Fix approach:
  1. Define type for form state (StoryFormState interface with storyTitle: string)
  2. Use stricter type checking in event handlers
  3. Validate storyTitle trim length >0 in archive.ts before storage

**Missing JSDoc / Type Documentation**
- Issue: Exported functions lack JSDoc comments explaining contract details
- Files: `src/lib/recording.ts`, `src/lib/archive.ts`, `src/lib/i18n.ts`
- Impact: Future developers (including Claude) have incomplete information about when functions should be called, what they return, what errors they throw
- Fix approach:
  1. Add JSDoc to every exported function with @param, @returns, @throws
  2. Include expected Success/Failure conditions from C3 contract
  3. Document per-function behavior clearly

**Inconsistent Error Handling Pattern**
- Issue: startRecording() throws on error (recording.ts line 43), but getAllStories() silently returns [] on error (archive.ts line 99)
- Files: `src/lib/recording.ts`, `src/lib/archive.ts`
- Impact: Caller cannot distinguish "no stories" from "database error"; inconsistent error contract makes code harder to reason about
- Fix approach:
  1. Standardize: decide whether to throw or return sentinel value (recommend throw with typed errors)
  2. Document per-function error behavior in C3 contract
  3. Update callers consistently

## Integration & Browser Compatibility

**No Browser Capability Detection**
- Issue: Code assumes Web Audio API, MediaRecorder, IndexedDB all available without feature detection
- Files: `src/lib/recording.ts`, `src/lib/archive.ts`, `src/routes/+page.svelte`
- Impact: **Hard failure** on older browsers or unsupported environments (older Safari, Firefox versions); no fallback UI
- Fix approach:
  1. Create capability detection module `src/lib/capabilities.ts`
  2. Check navigator.mediaDevices, MediaRecorder, indexedDB at startup
  3. Show conditional "Your browser is not supported" message if critical APIs missing
  4. Document minimum browser versions (Chrome 50+, Firefox 49+, Safari 14.1+, Edge 79+)

**No Microphone Permission Handling Details**
- Issue: Error message is generic "Microphone access denied" but doesn't distinguish user denial vs OS-level permission issue vs device unavailable
- Files: `src/routes/+page.svelte` (line 35)
- Impact: Users unsure how to fix; on iOS/macOS may not know to grant permissions in Settings
- Fix approach:
  1. Enhance error classification in errors.ts (MicrophonePermissionError, NoMicrophoneDeviceError, OSPermissionError)
  2. Add platform detection (iOS, macOS, Windows, Linux)
  3. Provide platform-specific instructions in error message
  4. Add link to help documentation

## Test Coverage Gaps

**Core Recording Logic Untested**
- Files: `src/lib/recording.ts` — no unit tests
- What's not tested:
  - startRecording() succeeds when permissions granted
  - startRecording() throws on permission denied
  - stopRecording() returns valid Blob with audio data
  - Timer accuracy (elapsedMs increments correctly)
  - Multiple pause/resume cycles (once implemented)
  - Cleanup: all MediaRecorder tracks stopped, timer cleared
- Risk: Refactoring recording logic could break silently; users lose trust when recording stops working
- Priority: **High** — core feature

**Archive Storage Untested**
- Files: `src/lib/archive.ts` — no unit tests
- What's not tested:
  - initDatabase() creates database correctly on first run
  - saveStory() writes blob and metadata with correct timestamp
  - getAllStories() retrieves in correct order
  - getStory() returns exact story or null for missing ID
  - Database upgrade path (when DB_VERSION increments)
  - Storage quota near limit (quota exceeded scenario)
- Risk: Silent data loss or corruption; users cannot recover lost stories
- Priority: **High** — data persistence

**i18n Untested**
- Files: `src/lib/i18n.ts` — no unit tests
- What's not tested:
  - setLanguage() updates currentLanguage store
  - t() returns correct translation for valid key
  - t() falls back to English for missing key
  - t() returns key itself if no translation exists
  - Language switcher toggles between 'en' and 'vi'
  - All bilingual strings are present in both languages
- Risk: Silent translation failures; Vietnamese interface shows English keys
- Priority: **Medium** — UX but not core functionality

**UI Integration Untested**
- Files: `src/routes/+page.svelte` — no integration tests
- What's not tested:
  - Click "Tell your story" → recording starts
  - Timer updates during recording
  - Click "Stop" → recording stops, state transitions to 'stopped'
  - Enter title, click "Archive" → story saved to IndexedDB
  - Error on microphone access → status message shown
  - Language toggle → all visible text changes
  - Resume from stopped state → can record another story
- Risk: **Critical** — user flows could break without detection; users cannot use app
- Priority: **Critical** — acceptance criteria

---

## Summary: Blocking Issues for Phase 1 Completion

| Issue | Impact | Fix Effort | Must Fix? |
|-------|--------|-----------|-----------|
| No C3 contracts in code | Violates CLAUDE.md requirement | High | Yes |
| No waveform visualization | Missing acceptance criterion | Medium | Yes |
| No pause/resume | Missing acceptance criterion | Medium | Yes |
| No audio preview | Missing acceptance criterion | Low | Yes |
| No test framework | Cannot verify acceptance criteria | Medium | Yes |
| No linting/formatting | Code quality drift | Low | Maybe |
| Incomplete error handling | Poor UX on failures | Medium | Yes |
| No browser detection | Hard failures on old browsers | Low | Yes |
| Memory leak on navigation | App instability | Low | Yes |
| Storage quota unmanaged | Silent failures on full disk | Low | Phase 2 |

**Recommendation:** Complete C3 contract integration, waveform visualization, pause/resume, audio preview, and test framework BEFORE declaring Phase 1 complete. All are achievable in current session but require focused work.

---

*Concerns audit: 2026-04-05*
