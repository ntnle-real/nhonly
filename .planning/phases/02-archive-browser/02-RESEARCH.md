# Phase 2: Archive Browser - Research

**Researched:** 2026-04-06
**Domain:** IndexedDB reading, audio playback, SPA scene management, bilingual UI
**Confidence:** HIGH

## Summary

Phase 2 requires building a browse and playback interface for stories saved to IndexedDB during Phase 1. The archive system is already partially complete: `archive.ts` exports `getAllStories()` and `getStory()` functions following C3 contracts. The planning work focuses on: (1) reading all stories and sorting them newest-first, (2) implementing playback via HTML `<audio>` element, (3) adding delete functionality with confirmation modal, (4) extending the i18n system with 12 new bilingual strings, and (5) choosing architecture (route-based `/archive` or scene-state in SPA).

**Primary recommendation:** Create `/archive` as a dedicated SvelteKit route with three scene states (list, playback, delete-confirm) to keep code organization clean. Reuse Phase 1 patterns entirely (styling, transitions, components). All indexing/sorting/deletion logic requires C3 contracts.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Archive button:** Secondary CTA on landing page ("Archive" / "Lưu trữ"), navigates to `/archive` route
- **Story list:** Title, date, duration metadata. Sorted newest-first by `savedAt` timestamp
- **Audio playback:** Full-screen scene with progress bar (simple linear, not waveform) and play/pause controls
- **Delete interaction:** Modal confirmation overlay (not route change). No soft-delete; permanent removal from IndexedDB
- **Empty state:** Reverent copy with CTA back to recording. Uses Lora Display font
- **Scene transitions:** 450ms opacity fade (Phase 1 pattern, reused exactly)
- **Navigation:** Landing → Archive (secondary button), Archive → Playback (tap story), Playback → Archive (close or auto-return after 2s finish delay), Archive → Delete Confirm (modal overlay, no navigation)
- **All new i18n strings locked in CONTEXT.md table** — 12 new keys, English and Vietnamese provided verbatim

### Claude's Discretion
- Whether archive is `/archive` route or extended scene in `+page.svelte` (planner's choice for code hygiene)
- Whether to wrap `<audio>` element in a service or use directly in Svelte component
- Delete toast animation (3s fade, exact timing)
- IndexedDB read loading state (fast enough to skip spinner, or show one)
- Error handling for IndexedDB read failure (show error state with retry)

### Deferred Ideas (OUT OF SCOPE)
- Cloud backup/sync (Phase 3)
- Family sharing / access controls (Phase 4)
- Story metadata editing, tags (Phase 5)
- Search across stories (Phase 5)
- Transcription/translation (Phase 6)
- Export formats MP3/WAV (Phase 7)
- Waveform visualization during playback (use simple progress bar)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | Story list view (title, date, duration) sorted newest-first | `getAllStories()` returns array; must sort by timestamp descending in memory |
| ARCH-02 | Audio playback with progress bar and controls | HTML `<audio>` element handles webm blobs natively; progress updates via timeupdate event |
| ARCH-03 | Delete with confirmation modal | Modal overlay pattern; `deleteStory(id)` service needed (not yet in archive.ts) |
| ARCH-04 | Empty state when no stories | Branch on `stories.length === 0`; show Lora Display font empty headline + CTA |
| ARCH-05 | All UI bilingual (Vietnamese/English) | i18n.ts pattern: add 12 new keys to vi/en objects; reuse `translate()` function |
| ARCH-06 | Archive button on landing page | Add secondary button below primary CTA in `+page.svelte` |
| ARCH-07 | Playback auto-returns after finish | Audio `ended` event triggers 2s delay, then navigate back to archive list |

</phase_requirements>

---

## Existing API Surface (archive.ts)

**File:** `src/lib/archive.ts`
**Status:** Phase 1 complete; foundation ready for Phase 2 reads

### Function Signatures

```typescript
// Init database (called on app mount)
export async function initDatabase(obs?: ObservationSession): Promise<void>

// Save story (Phase 1 — already implemented)
export async function saveStory(
  title: string,
  audioBlob: Blob,
  obs?: ObservationSession
): Promise<number>

// Read all stories (PHASE 2 will use this)
export async function getAllStories(
  obs?: ObservationSession
): Promise<ArchivedStory[]>

// Read single story by ID (PHASE 2 will use this)
export async function getStory(
  id: number,
  obs?: ObservationSession
): Promise<ArchivedStory | null>
```

**All functions follow C3 contracts with obs.read() → obs.step() → obs.observe() → obs.return_() pattern.**

### Story Shape (ArchivedStory Interface)

```typescript
interface ArchivedStory {
  id: number;                    // Auto-incremented by IndexedDB
  title: string;                 // User-entered title
  audioBlob: Blob;               // audio/webm MIME type
  timestamp: number;             // milliseconds since epoch (Date.now())
}
```

**Critical:** `timestamp` is milliseconds since epoch — convert to readable date with `new Intl.DateTimeFormat()` in component.

### IndexedDB Details

| Property | Value |
|----------|-------|
| Database name | `nhonly_archive` |
| Object store name | `stories` |
| Key path | `id` (auto-increment) |
| Store type | `readwrite` for saves, `readonly` for reads |

**Phase 2 reads must:** (1) call `getAllStories()`, (2) sort array by `timestamp` descending (newest first), (3) convert timestamp to locale-aware date string for display.

---

## Story Shape & Display Contract

### Data Structure in Memory (after getAllStories)

```typescript
const stories: ArchivedStory[] = [
  {
    id: 1,
    title: "First story",
    audioBlob: Blob { size: 125000, type: "audio/webm" },
    timestamp: 1712428800000  // April 5, 2026, 00:00 UTC
  },
  // ... more stories ...
];
```

### Sort Order (newest-first)

```typescript
stories.sort((a, b) => b.timestamp - a.timestamp);
// Result: [most recent story, ..., oldest story]
```

### Display Values Derived from Story

```typescript
// Date formatting (use Intl.DateTimeFormat, already done in Phase 1)
const dateStr = new Intl.DateTimeFormat(
  currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
  { month: 'long', day: 'numeric', year: 'numeric' }
).format(new Date(story.timestamp));

// Duration formatting (stored as durationMs in Phase 1 — NOT in ArchivedStory)
// ISSUE: Phase 1 saves story blob but does not store durationMs
// SOLUTION: Extract duration from audio playback (see below) or extend ArchivedStory interface
```

### ⚠️ CRITICAL ISSUE: Duration Not Stored

**Problem:** `ArchivedStory` interface does not include `durationMs`. Phase 1 saves the blob and timestamp, but duration is lost.

**UI Spec requires:** Display duration in list item metadata (e.g., "April 5, 2026 · 12:34").

**Options for planner:**
1. **Extend ArchivedStory:** Add `durationMs: number` to interface, update `saveStory()` to accept and store duration
2. **Extract duration at playback:** Read audio duration from blob during playback initialization (async, slower)
3. **Store duration separately:** Separate archive entry for metadata (complex, defer to Phase 3)

**Recommendation:** Option 1 (extend interface). Duration is available in Phase 1 (`savedDurationMs`), should be stored with blob. Low-cost change, unblocks display.

---

## IndexedDB Read Strategy

### Reading All Stories (Newest-First)

**Pattern to reuse from Phase 1:**

```typescript
// Phase 1 pattern: getAllStories() is already written
const allStories = await getAllStories();

// Phase 2 must add sorting
const sorted = allStories.sort((a, b) => b.timestamp - a.timestamp);

// Then filter/transform for display
const displayList = sorted.map(story => ({
  id: story.id,
  title: story.title,
  dateFormatted: formatDate(story.timestamp, language),
  durationFormatted: formatDuration(story.durationMs), // if stored
  audioBlob: story.audioBlob  // pass to playback component
}));
```

**C3 Contract needed:** `readAndSortStories(language)` — reads all, sorts by timestamp desc, formats dates/durations for display. Returns list ready for Svelte iteration.

### Error Handling

`getAllStories()` returns empty array on IndexedDB read error — no exception. Phase 2 component must handle:

```typescript
const stories = await getAllStories();
if (stories.length === 0) {
  // Show empty state OR show error if initialization failed
}
```

**Track whether failure is "no stories saved" vs "database error":**
- On mount, call `initDatabase()` first (already done in Phase 1)
- If `initDatabase()` fails, show error state with retry
- If `getAllStories()` returns empty [], show empty state (not error)

---

## Audio Playback Approach

### HTML Audio Element Strategy

**Phase 1 already uses `<audio>` for preview.** Phase 2 playback scene reuses same pattern:

```svelte
<audio
  src={audioURL}
  on:timeupdate={handleTimeUpdate}
  on:ended={handlePlaybackEnded}
  on:error={handlePlaybackError}
  bind:this={audioElement}
  bind:currentTime={currentTime}
  bind:duration={totalDuration}
></audio>

<button onclick={() => audioElement.play()}>▶ Play</button>
<button onclick={() => audioElement.pause()}>⏸ Pause</button>
<button onclick={() => { audioElement.currentTime = 0; audioElement.play(); }}>↻ Replay</button>
```

### Blob URL Creation & Cleanup

```typescript
// Create playable URL from IndexedDB blob
const audioURL = URL.createObjectURL(story.audioBlob);

// Use in <audio src={audioURL}>
// ... play/pause/seek as needed ...

// On unmount or scene change
URL.revokeObjectURL(audioURL);
```

**Phase 1 pattern:** `createPreviewURL()` and `revokePreviewURL()` already exist in `src/lib/preview.ts`. Phase 2 can reuse or create `createPlaybackURL()` wrapper.

### Progress Bar & Time Display

**HTML audio element provides:**
- `currentTime` (seconds, real-time)
- `duration` (seconds, total)
- `timeupdate` event (frequent, ~250ms)

**Component must format for display:**

```typescript
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Progress bar: width = (currentTime / duration) * 100%
// Label: "{currentTime} / {totalDuration}"
```

### Playback Error Handling

```typescript
<audio on:error={handlePlaybackError} />

function handlePlaybackError(e: Event) {
  // Audio element failed to load blob
  // Show error scene with copy from i18n: playback_error_heading, playback_error_body
  // User can return to archive list
}
```

**Possible causes:**
- Blob is corrupted or has been garbage-collected (rare)
- MIME type not supported (unlikely — Phase 1 uses audio/webm)

---

## SPA Extension Strategy: Route vs. Scene State

### Option A: New Route `/archive`

**Pros:**
- Clean separation of concerns
- URL state: `/`, `/archive`, `/archive?id=1` for deep links
- Easier testing (route-level)
- Scales well for Phase 3+ features (share, export, etc.)

**Cons:**
- Slight navigation complexity
- Requires +layout.svelte awareness of archive route

**Implementation:**
```
src/routes/
  +page.svelte          # Landing scene (unchanged)
  archive/
    +page.svelte        # Archive scene (list, playback, delete-confirm)
    +page.ts            # Load archive data server-side (optional)
```

### Option B: Extended Scene State in +page.svelte

**Pros:**
- All scenes in one file — simpler for small project
- No route changes — faster transitions
- Fits "single-page-app" aesthetic

**Cons:**
- +page.svelte becomes large (landing + recording + archive)
- URL doesn't reflect state
- Harder to test/maintain long-term

**Implementation:**
```typescript
type Scene = 'landing' | 'recording' | 'paused' | 'stopped' | 'saving' | 'saved' | 'error'
  | 'archive' | 'playback' | 'delete-confirm';  // Add archive scenes
```

### Recommendation: **Option A (Route-Based)**

**Rationale:**
1. CONTEXT.md spec shows `/archive` route explicitly (line 34: "navigates to `/archive` route")
2. Phase 2 scope is substantial enough (list, playback, delete) to warrant own file
3. Future phases (Phase 3+) will likely extend archive with cloud sync, sharing — route structure accommodates growth
4. Cleaner code organization; planner can split into multiple components easily

---

## Component Architecture (Route-Based Recommendation)

### File Structure

```
src/routes/
  archive/
    +page.svelte         # Main archive scene (handles list, playback, delete states)
    StoryList.svelte     # Sub-component: story list with items
    StoryItem.svelte     # Sub-component: single story item
    Playback.svelte      # Sub-component: full-screen playback scene
    DeleteConfirm.svelte # Sub-component: delete confirmation modal
    archive.service.ts   # Service: readAndSortStories, deleteStory
```

### Component Responsibilities

#### +page.svelte (Archive Container)

```svelte
<script>
  // State
  let scene: 'list' | 'playback' | 'delete-confirm' = $state('list');
  let stories: DisplayStory[] = $state([]);
  let selectedStory: DisplayStory | null = $state(null);
  let loading = $state(true);
  let error: string | null = $state(null);

  // Lifecycle
  onMount(async () => {
    try {
      const loaded = await readAndSortStories($currentLanguage);
      stories = loaded;
    } catch (e) {
      error = 'Failed to load stories';
    } finally {
      loading = false;
    }
  });

  // Handlers
  function handleStorySelect(story) { ... }
  function handlePlaybackClose() { ... }
  function handleDeleteRequest(id) { ... }
  function handleDeleteConfirm(id) { ... }
  function handleDeleteCancel() { ... }
</script>

<!-- Render based on scene -->
{#if scene === 'list'}
  {#if loading}
    <spinner />
  {:else if error}
    <error-state />
  {:else if stories.length === 0}
    <empty-state />
  {:else}
    <StoryList {stories} on:select={handleStorySelect} />
  {/if}
{:else if scene === 'playback'}
  <Playback story={selectedStory} on:close={handlePlaybackClose} />
{:else if scene === 'delete-confirm'}
  <DeleteConfirm story={selectedStory} on:confirm on:cancel />
{/if}
```

#### StoryList.svelte

```svelte
<script>
  export let stories: DisplayStory[];
  let dispatch;

  function handlePlayClick(story) {
    dispatch('select', story);
  }

  function handleDeleteClick(story) {
    dispatch('delete-request', story);
  }
</script>

<header class="archive_header">
  <h1>{translate($currentLanguage, 'archive_header')}</h1>
  <p class="count">
    {stories.length} {stories.length === 1 ? 'story' : 'stories'}
  </p>
</header>

<ul>
  {#each stories as story (story.id)}
    <StoryItem {story} on:play on:delete-request />
  {/each}
</ul>
```

#### Playback.svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  export let story: DisplayStory;

  let audioElement: HTMLAudioElement;
  let currentTime = $state(0);
  let duration = $state(0);
  let audioURL: string;
  let autoReturnTimer: NodeJS.Timeout | null = null;

  onMount(() => {
    audioURL = URL.createObjectURL(story.audioBlob);
  });

  onDestroy(() => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    if (autoReturnTimer) clearTimeout(autoReturnTimer);
  });

  function handlePlaybackEnded() {
    // 2s delay, then return to list
    autoReturnTimer = setTimeout(() => {
      dispatch('close');
    }, 2000);
  }
</script>

<div class="playback-scene">
  <header>...</header>
  <audio {src} bind:currentTime bind:duration on:ended={handlePlaybackEnded} />
  <progress-bar {currentTime} {duration} />
  <button onclick={() => audioElement.play()}>▶</button>
  <button onclick={() => audioElement.replay()}>↻</button>
  <button onclick={() => dispatch('close')}>✕</button>
</div>
```

#### DeleteConfirm.svelte

```svelte
<!-- Modal overlay -->
<div class="modal-overlay" on:keydown={(e) => e.key === 'Escape' && dispatch('cancel')}>
  <div class="modal">
    <h1 class="heading">{translate($currentLanguage, 'delete_heading')}</h1>
    <p>{translate($currentLanguage, 'delete_body')}</p>
    <div class="buttons">
      <button on:click={() => dispatch('confirm')} class="delete-btn">
        {translate($currentLanguage, 'delete_confirm')}
      </button>
      <button on:click={() => dispatch('cancel')} class="cancel-btn">
        {translate($currentLanguage, 'delete_cancel')}
      </button>
    </div>
  </div>
</div>
```

### Service Layer (archive.service.ts)

**New file needed** — Archive-specific service functions with C3 contracts:

```typescript
// MARK: SYSTEM(Storage) -> Read and Sort Stories
export async function readAndSortStories(
  language: Language,
  obs?: ObservationSession
): Promise<DisplayStory[]>

// MARK: SYSTEM(Storage) -> Delete Story
export async function deleteStory(
  id: number,
  obs?: ObservationSession
): Promise<void>

// Helper: format timestamp to locale date
function formatStoryDate(timestamp: number, language: Language): string

// Helper: format duration (if stored) to MM:SS
function formatStoryDuration(durationMs: number): string
```

**All service functions MUST follow C3 pattern with obs calls.**

---

## C3 Contract Requirements

### Functions Needing Contracts

| Function | MARK | Purpose | Success | Failure |
|----------|------|---------|---------|---------|
| `readAndSortStories()` | `SYSTEM(Storage) → Read and Sort Stories` | Fetch all stories from IndexedDB, sort newest-first, format for display | Returns non-empty array sorted by timestamp desc, dates formatted | Database not ready, read fails (return empty array) |
| `deleteStory()` | `SYSTEM(Storage) → Delete Story` | Remove story record from IndexedDB permanently | Story removed from store, id no longer accessible | Database not ready, delete fails, record not found |
| `formatStoryDate()` | `SYSTEM(Locale) → Format Story Date` | Convert timestamp to locale-aware date string (Phase 1 pattern) | Returns formatted date matching Intl.DateTimeFormat output | Invalid timestamp (fallback to ISO date) |
| `formatStoryDuration()` | `SYSTEM(Locale) → Format Duration` | Convert milliseconds to MM:SS string | Returns valid "MM:SS" format string | Invalid duration (return "00:00" or error string) |

### Contract Pattern (from Phase 1)

**All Phase 2 contracts must follow the spatial proof shape:**

```
MARK → Purpose → Success → Failure → contract object → conduct with obs → binding (if needed)
```

**Example for `readAndSortStories()`:**

```typescript
// MARK: SYSTEM(Storage) -> Read and Sort Stories
// Purpose: Fetch all stories from IndexedDB, sort newest-first, format timestamps and durations for display list.
// Success: Returns non-empty array of DisplayStory objects, sorted by timestamp descending, all dates/durations formatted.
// Failure: Database not ready (returns empty array), read transaction fails (returns empty array with obs.observe).

interface ReadAndSortStoriesContract {
  serves: string;
  declares: {
    input: 'stories_list_request';
    output: 'sorted_display_stories';
  };
  succeeds_if: {
    reads: ['stories_list_request'];
    steps: ['fetch_all_stories', 'sort_by_timestamp', 'format_display_values'];
    observes: ['stories_loaded', 'sorted_desc', 'formatting_complete'];
    returns: ['sorted_display_stories'];
  };
  fails_if: {
    observes: ['database_not_ready', 'fetch_failed'];
  };
}

export async function readAndSortStories(
  language: Language,
  obs: ObservationSession = createObservationSession()
): Promise<DisplayStory[]> {
  obs.read('stories_list_request', { language });

  obs.step('fetch_all_stories');
  const stories = await getAllStories(obs);
  if (stories.length === 0) {
    obs.observe('stories_loaded', 'zero stories in archive');
    return obs.return_('sorted_display_stories', []);
  }

  obs.step('sort_by_timestamp');
  const sorted = stories.sort((a, b) => b.timestamp - a.timestamp);
  obs.observe('sorted_desc', `sorted ${sorted.length} stories by timestamp descending`);

  obs.step('format_display_values');
  const display: DisplayStory[] = sorted.map(s => ({
    id: s.id,
    title: s.title,
    dateFormatted: formatStoryDate(s.timestamp, language),
    durationFormatted: formatStoryDuration(s.durationMs),
    audioBlob: s.audioBlob
  }));
  obs.observe('formatting_complete', `formatted ${display.length} stories for display`);

  return obs.return_('sorted_display_stories', display);
}
```

---

## i18n Extension

### Current System (Phase 1)

**File:** `src/lib/i18n.ts`

- Type: `Language = 'vi' | 'en'`
- Strings: `Record<Language, Record<string, string>>`
- Functions: `translate(lang, key)` and `t(key)` (reactive/sync)
- Storage: localStorage `nhonly_language`
- Usage in Svelte: `{translate($currentLanguage, 'key')}`

### New Strings for Phase 2 (Locked from CONTEXT.md)

**Add to `src/lib/i18n.ts` strings object:**

```typescript
const strings: Record<Language, Record<string, string>> = {
  vi: {
    // ... existing Phase 1 keys ...

    // Phase 2 Archive UI
    archive_nav: 'Lưu trữ',
    archive_empty_headline: 'Kho lưu trữ của bạn còn trống',
    archive_empty_body: 'Các chuyện bạn ghi âm sẽ xuất hiện ở đây. Hãy bắt đầu bằng cách ghi âm chuyện đầu tiên.',
    archive_empty_cta: 'Ghi âm chuyện đầu tiên',
    archive_header: 'Các chuyện của bạn',
    archive_count_singular: '{count} chuyện',
    archive_count_plural: '{count} chuyện',
    playback_close: '✕',
    playback_replay: '↻',
    delete_heading: 'Xóa chuyện này?',
    delete_body: 'Chuyện này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.',
    delete_confirm: 'Xóa',
    delete_cancel: 'Giữ lại',
    delete_success: 'Chuyện đã bị xóa',
    playback_error_heading: 'Không thể phát chuyện',
    playback_error_body: 'Tệp âm thanh có thể bị hỏng. Hãy thử một chuyện khác hoặc ghi âm lại.',
    playback_error_cta: 'Quay lại kho lưu trữ'
  },
  en: {
    // ... existing Phase 1 keys ...

    // Phase 2 Archive UI
    archive_nav: 'Archive',
    archive_empty_headline: 'Your archive is empty',
    archive_empty_body: 'Stories you record will appear here. Begin by recording your first story.',
    archive_empty_cta: 'Record your first story',
    archive_header: 'Your stories',
    archive_count_singular: '{count} story',
    archive_count_plural: '{count} stories',
    playback_close: '✕',
    playback_replay: '↻',
    delete_heading: 'Delete this story?',
    delete_body: 'This story will be permanently deleted. This action cannot be undone.',
    delete_confirm: 'Delete',
    delete_cancel: 'Keep',
    delete_success: 'Story deleted',
    playback_error_heading: 'Could not play story',
    playback_error_body: 'The audio file may be corrupted. Try another story or re-record.',
    playback_error_cta: 'Return to archive'
  }
};
```

### Pluralization Pattern

**Phase 2 adds plural forms:** `{count} story` vs. `{count} stories` (English), `{count} chuyện` vs. `{count} chuyện` (Vietnamese — same form both cases).

**Implementation in component:**

```typescript
const count = stories.length;
const key = count === 1 ? 'archive_count_singular' : 'archive_count_plural';
const label = translate($currentLanguage, key).replace('{count}', String(count));
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + Svelte testing library (Phase 1 precedent) |
| Config file | `vitest.config.ts` (inherited from Phase 1) |
| Quick run command | `npm test -- src/lib/archive.service.test.ts` |
| Full suite command | `npm test` |

**Phase 1 test output:** 58 tests passing across preview, waveform, archive (basic), recording. All 100% coverage for service functions.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-01 | readAndSortStories returns empty when no stories saved | unit | `npm test -- archive.service.test.ts -t "empty array"` | ❌ Wave 0 |
| ARCH-01 | readAndSortStories sorts by timestamp newest-first | unit | `npm test -- archive.service.test.ts -t "sort descending"` | ❌ Wave 0 |
| ARCH-01 | readAndSortStories formats dates using Intl | unit | `npm test -- archive.service.test.ts -t "date format"` | ❌ Wave 0 |
| ARCH-02 | Audio playback initializes with correct duration | unit | `npm test -- playback.test.ts -t "audio duration"` | ❌ Wave 0 |
| ARCH-02 | Playback progress updates on timeupdate event | unit | `npm test -- playback.test.ts -t "currentTime tracks"` | ❌ Wave 0 |
| ARCH-02 | Playback closes on ended event with 2s delay | unit | `npm test -- playback.test.ts -t "auto-return"` | ❌ Wave 0 |
| ARCH-03 | deleteStory removes record from IndexedDB | unit | `npm test -- archive.service.test.ts -t "delete story"` | ❌ Wave 0 |
| ARCH-03 | Delete confirmation modal shows when delete button clicked | unit | `npm test -- delete-confirm.test.ts -t "modal displays"` | ❌ Wave 0 |
| ARCH-04 | Empty state displays when stories array is empty | unit | `npm test -- archive.test.ts -t "empty state"` | ❌ Wave 0 |
| ARCH-05 | All new i18n keys exist in both vi and en | unit | `npm test -- i18n.test.ts -t "phase 2 keys"` | ❌ Wave 0 |
| ARCH-06 | Archive button navigates to /archive route | unit | `npm test -- landing.test.ts -t "archive button navigation"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- src/lib/archive.service.test.ts` (service layer unit tests, <5s)
- **Per wave merge:** `npm test` (full suite, ~20s, all tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/archive.service.test.ts` — covers ARCH-01 (readAndSortStories), ARCH-03 (deleteStory)
- [ ] `src/routes/archive/Playback.test.ts` — covers ARCH-02 (audio playback, auto-return)
- [ ] `src/routes/archive/DeleteConfirm.test.ts` — covers ARCH-03 (modal confirmation)
- [ ] `src/routes/archive/archive.test.ts` — covers ARCH-04 (empty state), ARCH-06 (navigation)
- [ ] `src/lib/i18n.test.ts` — extends Phase 1 test to verify all Phase 2 keys exist in both languages
- [ ] Framework: Vitest already installed (Phase 1), no additional setup needed
- [ ] Fixtures: Use existing `createObservationSession()` from `src/lib/obs.ts` for contract verification

---

## Common Pitfalls

### Pitfall 1: Forgetting to Sort Stories in Memory

**What goes wrong:** Stories display in IndexedDB insertion order (random), not newest-first. User sees oldest story first.

**Why it happens:** `getAllStories()` returns unsorted array; IndexedDB does not auto-sort without a cursor with range/index.

**How to avoid:** Always sort result of `getAllStories()` in `readAndSortStories()` service: `stories.sort((a, b) => b.timestamp - a.timestamp)`.

**Warning signs:** First story in list has date older than second story.

### Pitfall 2: Not Revoking Audio Blob URLs

**What goes wrong:** Memory leak after playback. Browser keeps Blob URLs in memory, cannot be garbage collected. Long session accumulates orphaned URLs.

**Why it happens:** `URL.createObjectURL()` creates a reference that must be explicitly revoked with `URL.revokeObjectURL()`.

**How to avoid:** Create URL in component mount, revoke in destroy handler or when scene changes. Phase 1 pattern: `createPreviewURL()` / `revokePreviewURL()` in `src/lib/preview.ts`.

**Warning signs:** App gets sluggish after playing many stories, memory usage climbs.

### Pitfall 3: Missing Duration in ArchivedStory Display

**What goes wrong:** Duration metadata cannot display in list (e.g., "April 5 · ?") because it's not stored with blob.

**Why it happens:** Phase 1 `saveStory()` accepts blob + title, but not duration. Duration is ephemeral (only during recording).

**How to avoid:** Extend `ArchivedStory` interface to include `durationMs: number`. Update `saveStory()` signature to accept duration parameter. Phase 1 has `savedDurationMs` available (see +page.svelte line 99).

**Warning signs:** i18n calls for duration text exist but duration value is undefined/null.

### Pitfall 4: Audio Element Not Bound to State

**What goes wrong:** Progress bar doesn't update as audio plays. `currentTime` stays at 0.

**Why it happens:** Svelte binding (`bind:currentTime`) not connected to audio element, or binding placed on wrong element.

**How to avoid:** Use `bind:currentTime` and `bind:duration` on `<audio>` element. Listen to `timeupdate` event for frequent updates. Phase 1 precedent: preview audio player (line 283 in +page.svelte).

**Warning signs:** Play button works, audio plays in background, but progress bar frozen.

### Pitfall 5: Delete Confirmation Modal Not Focus-Trapped

**What goes wrong:** User presses Tab and focus escapes modal to background list. Delete and Keep buttons are not the only focusable elements.

**Why it happens:** Modal markup lacks `role="dialog"` and focus trap logic.

**How to avoid:** Add `role="dialog"` and `aria-modal="true"` to modal div. Implement focus trap: intercept Tab, Shift+Tab, keep focus within modal buttons. Listen for Escape key to close.

**Warning signs:** Tab order jumps from modal to background elements.

### Pitfall 6: Empty State Not Showing When Stories Array Is Empty

**What goes wrong:** List shows nothing, blank screen. User thinks archive is broken or loading.

**Why it happens:** Component renders `{#each stories as story}` without checking `stories.length === 0` first.

**How to avoid:** Use conditional render: `{#if stories.length === 0} <empty-state /> {:else} <StoryList /> {/if}`.

**Warning signs:** Test with fresh IndexedDB (no stories). Empty page renders.

---

## Code Examples

### Verify All Phase 2 i18n Keys Exist

**Test to prevent key typos:**

```typescript
// src/lib/i18n.test.ts (extend Phase 1 test)
import { translate } from './i18n';

const phase2Keys = [
  'archive_nav', 'archive_empty_headline', 'archive_empty_body',
  'archive_empty_cta', 'archive_header', 'archive_count_singular',
  'archive_count_plural', 'playback_close', 'playback_replay',
  'delete_heading', 'delete_body', 'delete_confirm', 'delete_cancel',
  'delete_success', 'playback_error_heading', 'playback_error_body',
  'playback_error_cta'
];

describe('i18n', () => {
  phase2Keys.forEach(key => {
    it(`has '${key}' in both vi and en`, () => {
      expect(translate('vi', key)).not.toBe(key);
      expect(translate('en', key)).not.toBe(key);
    });
  });
});
```

### C3 Contract: Read and Sort Stories

**Template for archive.service.ts:**

```typescript
// MARK: SYSTEM(Storage) -> Read and Sort Stories
// Purpose: Fetch all stories from IndexedDB, sort newest-first, format for display.
// Success: Returns array of DisplayStory objects sorted by timestamp descending, all dates/durations formatted.
// Failure: Database not initialized (returns empty array), read fails (returns empty array).

import type { ObservationSession } from './obs';
import { createObservationSession } from './obs';
import { getAllStories, type ArchivedStory } from './archive';

interface DisplayStory {
  id: number;
  title: string;
  dateFormatted: string;
  durationFormatted: string;
  audioBlob: Blob;
}

interface ReadAndSortStoriesContract {
  serves: string;
  declares: {
    input: 'stories_request';
    output: 'sorted_display_list';
  };
  succeeds_if: {
    reads: ['stories_request'];
    steps: ['fetch_all', 'sort_descending', 'format_display_values'];
    observes: ['stories_loaded', 'sorted_by_timestamp', 'formatting_complete'];
    returns: ['sorted_display_list'];
  };
  fails_if: {
    observes: ['database_error', 'fetch_failed'];
  };
}

export async function readAndSortStories(
  language: 'vi' | 'en',
  obs: ObservationSession = createObservationSession()
): Promise<DisplayStory[]> {
  obs.read('stories_request', { language });

  obs.step('fetch_all');
  const stories = await getAllStories(obs);
  if (!stories || stories.length === 0) {
    obs.observe('stories_loaded', 'zero stories in archive');
    return obs.return_('sorted_display_list', []);
  }

  obs.step('sort_descending');
  const sorted = [...stories].sort((a, b) => b.timestamp - a.timestamp);
  obs.observe('sorted_by_timestamp', `sorted ${sorted.length} by timestamp descending`);

  obs.step('format_display_values');
  const display: DisplayStory[] = sorted.map(s => ({
    id: s.id,
    title: s.title,
    dateFormatted: formatStoryDate(s.timestamp, language),
    durationFormatted: formatStoryDuration(s.durationMs ?? 0),
    audioBlob: s.audioBlob
  }));
  obs.observe('formatting_complete', `formatted ${display.length} stories`);

  return obs.return_('sorted_display_list', display);
}

function formatStoryDate(timestamp: number, language: 'vi' | 'en'): string {
  return new Intl.DateTimeFormat(
    language === 'vi' ? 'vi-VN' : 'en-US',
    { month: 'long', day: 'numeric', year: 'numeric' }
  ).format(new Date(timestamp));
}

function formatStoryDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
```

### Delete Story C3 Contract

```typescript
// MARK: SYSTEM(Storage) -> Delete Story
// Purpose: Remove a story record permanently from IndexedDB.
// Success: Story removed from object store, subsequent queries don't find the ID.
// Failure: Database not initialized, delete transaction fails, story not found.

interface DeleteStoryContract {
  serves: string;
  declares: {
    input: 'story_id_to_delete';
    output: 'deletion_complete';
  };
  succeeds_if: {
    reads: ['story_id_to_delete'];
    steps: ['start_transaction', 'delete_record', 'commit'];
    observes: ['record_deleted'];
    returns: ['deletion_complete'];
  };
  fails_if: {
    observes: ['database_not_ready', 'delete_failed'];
  };
}

export async function deleteStory(
  id: number,
  obs: ObservationSession = createObservationSession()
): Promise<void> {
  obs.read('story_id_to_delete', { id });

  if (!db) {
    obs.observe('database_not_ready', 'db is null');
    throw new Error('Database not initialized');
  }

  return new Promise((resolve, reject) => {
    obs.step('start_transaction');
    const transaction = db!.transaction(['stories'], 'readwrite');
    const store = transaction.objectStore('stories');

    obs.step('delete_record');
    const request = store.delete(id);

    request.onerror = () => {
      obs.observe('delete_failed', request.error?.message ?? 'unknown');
      reject(new Error('Failed to delete story'));
    };

    request.onsuccess = () => {
      obs.observe('record_deleted', `story id=${id} removed`);
      obs.step('commit');
      resolve(obs.return_('deletion_complete', undefined));
    };
  });
}
```

---

## State of the Art

### IndexedDB vs. Alternatives (Phase 1 Decision — Verified)

| Approach | Status | Notes |
|----------|--------|-------|
| IndexedDB (current) | Standard | Large quota (~50MB+), local persistence, browser-native, no server needed. Perfect for local archive (Phase 1-2). |
| localStorage | Too small | ~5-10MB max, synchronous, blocks UI on large reads. Not suitable for audio blobs. |
| File System Access API | Newer, limited support | Can persist to user's disk, but not cross-browser stable. Defer to Phase 3+ (export feature). |
| Cloud storage | Future | Phase 3+ feature. Requires backend, encryption, sync strategy. Out of scope. |

**Phase 2 does NOT change Phase 1 decision.** IndexedDB is correct for local archive.

### Audio Playback Evolution

| Approach | Phase | Status |
|----------|-------|--------|
| Web Audio API (MediaRecorder) | 1 | Recording only. Playback uses HTML `<audio>`. Correct separation. |
| HTML `<audio>` element | 1-2 | Simple, native, supports webm blobs, no decode overhead. Standard for playback. |
| Custom Web Audio Playback | Future | More control (equalizer, visualizer, effects). Defer to Phase 5+ (polish). |

**Phase 2 uses `<audio>` for playback.** No custom decoder needed.

### Deprecated Approaches

- **Flash-based audio player:** Deprecated, unsupported in modern browsers.
- **Server-side transcode:** Not needed; webm is natively playable in all modern browsers.
- **Soft-delete:** Phase 2 uses hard-delete (permanent removal). Phase 3+ might introduce recycle bin.

---

## Open Questions

1. **Should duration be stored with story blob?**
   - What we know: Phase 1 saves blob + title + timestamp, but duration is lost. UI spec requires duration display.
   - What's unclear: Whether to extend ArchivedStory interface or extract duration at playback time.
   - Recommendation: Extend interface. Duration is available during save (Phase 1 `savedDurationMs`), cost is low.

2. **Should IndexedDB read failures show a loading state?**
   - What we know: `getAllStories()` returns empty array on error (no exception). Hard to distinguish "no stories" from "read error."
   - What's unclear: Whether users expect a spinner during IndexedDB fetch (fast on modern hardware, ~50-200ms).
   - Recommendation: Show spinner only if fetch takes >500ms (detect via timeout promise race). On error, show error state with retry.

3. **Should archive auto-load on app mount, or lazy-load when navigating to /archive?**
   - What we know: Phase 1 initializes database on app mount. No pre-loading of stories.
   - What's unclear: Whether Phase 2 should call `readAndSortStories()` during app boot, or only when user navigates to archive.
   - Recommendation: Lazy-load when navigating to `/archive`. Keeps landing page fast, respects user intent (user may never open archive).

---

## Environment Availability

**SKIPPED:** Phase 2 is code/UI changes only. No external tools, services, runtimes, or CLI utilities beyond Phase 1 stack.

- Vitest: ✓ (Phase 1 installed)
- SvelteKit: ✓ (Phase 1 installed)
- Web Audio API: ✓ (browser-native)
- IndexedDB: ✓ (browser-native)
- Intl.DateTimeFormat: ✓ (JavaScript standard library)

All dependencies available; no fallbacks needed.

---

## Sources

### Primary (HIGH confidence)

- **Phase 1 Implementation Files:**
  - `src/lib/archive.ts` — getAllStories(), getStory(), ArchivedStory interface, C3 contract patterns
  - `src/routes/+page.svelte` — Scene-based SPA structure, i18n pattern, audio element usage, transitions
  - `src/lib/i18n.ts` — i18n system, translate() function, language persistence
  - `src/app.css` — Tailwind v4 theme tokens, color palette, typography

- **Phase 2 Design Contract:**
  - `.planning/phases/02-archive-browser/02-CONTEXT.md` — Locked decisions, story shape, navigation flow
  - `.planning/phases/02-archive-browser/02-UI-SPEC.md` — Component inventory, interaction contract, copywriting, styling

- **C3 Kernel (Project Standards):**
  - `C3/kernel/THEORY.md` — Contract-driven development, spatial proof shape
  - `C3/kernel/CONTRACTS.md` — Contract templates (TypeScript, Svelte)
  - `C3/kernel/EXAMPLES/typescript/validate.ts` — Example C3 contract implementation

- **Project Configuration:**
  - `.planning/STATE.md` — Architecture decisions, Phase 1 status, deployment context
  - `.planning/ROADMAP.md` — Phase 2 scope and success criteria
  - `.planning/config.json` — Project tech stack (SvelteKit, TypeScript, Tailwind v4, C3)

### Secondary (MEDIUM confidence)

- Phase 1 Test Suite — Vitest patterns, fixture setup, mock strategies (verified by passing tests)
- Phase 1 Error Handling — classifyError(), StorageError pattern (reusable for Phase 2 services)

---

## Metadata

**Confidence breakdown:**
- **Existing API surface:** HIGH — archive.ts is complete Phase 1 code, getAllStories() signature verified
- **Story shape & display:** HIGH — ArchivedStory interface is defined; timestamp is milliseconds since epoch (verified in code)
- **Audio playback:** HIGH — Phase 1 uses `<audio>` element for preview, pattern is proven
- **Component architecture:** HIGH — Phase 1 scene-based SPA pattern is established, i18n system is working
- **C3 contracts:** HIGH — C3/kernel/ is complete, examples provided, Phase 1 contracts follow pattern
- **Duration storage issue:** MEDIUM — Phase 1 code does not store duration, requires decision on interface extension
- **i18n strings:** HIGH — All 16 new keys locked in CONTEXT.md, verified as complete set

**Research date:** 2026-04-06
**Valid until:** 2026-04-20 (14 days — stable domain, no fast-moving dependencies)

---

**RESEARCH COMPLETE.** Planner can now create task breakdown for Phase 2 implementation.
