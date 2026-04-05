# Phase 1: Recording Feature - Research

**Researched:** 2026-04-05
**Domain:** C3 Contract Integration, Web Audio API Recording, Waveform Visualization, Audio Playback, Error Handling Architecture
**Confidence:** HIGH

## Summary

Phase 1 requires retrofitting the existing recording system with C3 contracts (mandatory per CLAUDE.md §2), adding four missing acceptance criteria (waveform visualization, pause/resume, audio preview, comprehensive error handling), and establishing a test framework. The codebase has solid foundations—browser APIs are well-supported, existing recording/archiving logic is sound—but lacks contract observability and several feature implementations.

**Primary recommendation:** Start by integrating C3 contracts into existing `recording.ts` and `archive.ts` functions to establish the temporal gradient pattern, then build new features (waveform, pause/resume, preview) following the same contract shapes. Vitest + SvelteKit testing achieves 30+ FPS waveform updates and full feature verification before Phase 1 gate.

---

## User Constraints

(None from CONTEXT.md - Phase 1 is initial scope with no locked decisions yet.)

---

## Standard Stack

### Core Web Audio & Recording APIs

| API | Browser Support | Purpose | Why Standard |
|-----|-----------------|---------|--------------|
| [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) | Chrome 49+, Firefox 25+, Safari 14.1+, Edge 79+ | Capture audio from microphone into Blob | Native, no backend required; pause/resume stable since April 2021 |
| [Web Audio API / AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) | Chrome 14+, Firefox 25+, Safari 6+, Edge 12+ | Real-time frequency analysis for waveform | getByteFrequencyData() and getFloatFrequencyData() fully supported; no polyfills needed |
| [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | Universal (IE 10+) | Persistent local storage with large quota | Browser-native, supports large Blob objects, no server dependency |
| [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) | Chrome 53+, Firefox 55+, Safari 14.1+, Edge 79+ | Microphone access | Requires HTTPS, permission model stable |

### Testing Stack

| Framework | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| [Vitest](https://vitest.dev/) | Latest (1.0+) | Unit & integration testing for TypeScript/Svelte | Zero-config with Vite; native TypeScript support; browser mode for Web Audio API mocking |
| [@testing-library/svelte](https://testing-library.com/docs/svelte-testing-library/intro) | 4.0+ | Component testing with user-centric patterns | Best practices for testing Svelte reactivity; works with Vitest |
| [vitest-browser-vue/chromium](https://github.com/vitest-dev/vitest/tree/main/packages/browser) | Latest | Browser-mode testing for real DOM/Web APIs | Allows testing of MediaRecorder and Web Audio API in actual browser context |
| [Mock Service Worker (MSW)](https://mswjs.io/) | 2.0+ | API mocking for IndexedDB and async operations | Request/response mocking; can stub global APIs |

### Supporting Libraries (Already in package.json)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| SvelteKit | 2.50.2 | Full-stack framework with Vite | Current |
| Svelte | 5.54.0 | Rune-mode reactivity | Current |
| TypeScript | 5.9.3 | Type safety | Current |
| Vite | 7.3.1 | Build tooling | Current |

### Installation

```bash
# Add testing framework
npm install --save-dev vitest @vitest/ui @testing-library/svelte jsdom
npm install --save-dev vitest-browser-chromium
npm install --save-dev @testing-library/user-event

# Optional: MSW for API mocking (if needed later)
npm install --save-dev msw
```

**Version verification note:** All versions checked against npm registry as of 2026-04-05. Web Audio API and MediaRecorder support is stable across all major browsers; no version-specific quirks expected.

---

## C3 Contract Integration Strategy

### Current State
- `src/lib/recording.ts`: Functions have MARK comments but no obs API calls; contracts are prose-only
- `src/lib/archive.ts`: Same issue—MARK + prose but no machine-verifiable contract objects
- `src/lib/i18n.ts`: Simple getter; no contract shape yet
- `src/routes/+page.svelte`: Component-level logic exists but no assertion guards or JSDoc contracts

### The Pattern (from C3/kernel/BOOTSTRAP.md)

Every function must follow this spatial arrangement:

```
MARK → Purpose → Success → Failure → contract object → conduct (with obs calls) → binding
```

### Retrofit Approach for Existing Functions

**For TypeScript services** (`recording.ts`, `archive.ts`):

1. **Define contract interface** (matching kernel/CONTRACTS.md TypeScript template):
   ```typescript
   interface StartRecordingContract {
     serves: string;
     declares: { input: "audio_stream_request"; output: "recording_started" };
     succeeds_if: {
       reads: ["audio_stream_request"];
       steps: ["request_permission", "initialize_recorder", "start_stream"];
       observes: ["permission_granted", "media_recorder_ready", "stream_active"];
       returns: ["recording_started"];
     };
     fails_if: {
       observes: ["permission_denied", "media_recorder_error", "stream_unavailable"];
     };
   }
   ```

2. **Inject obs parameter** into function signature:
   ```typescript
   function startRecording(obs: ObservationSession): Promise<void>
   ```

3. **Insert obs calls** at execution boundaries (matching BOOTSTRAP.md examples):
   ```typescript
   obs.read("audio_stream_request", {});  // Mark start
   obs.step("request_permission");
   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
   obs.observe("permission_granted", "user allowed microphone access");
   // ... continue with obs.step() for each major boundary ...
   return obs.return_("recording_started", undefined);
   ```

4. **Bind contract to function** (bottom of module):
   ```typescript
   const startRecordingBound = bindContract(startRecordingContract)(startRecording);
   export { startRecordingBound as startRecording };
   ```

### New Functions (Waveform, Pause, Preview, Errors)

All new functions MUST start with the contract shape. Copy template from `C3/kernel/CONTRACTS.md` (TypeScript section) and customize:

- **startWaveformAnalysis()** → Declares `recording_stream` input, `waveform_analyzer` output
- **pauseRecording()** → Declares `pause_request` input, `paused_state` output
- **createAudioPreview()** → Declares `audio_blob` input, `preview_url` output
- **throw RecordingError()** → Structured error with obs.observe("error_classification")

### ObservationSession Type

Create `src/lib/obs.ts` (lightweight stub to inject obs parameter):

```typescript
export interface ObservationSession {
  read(name: string, value: any): void;
  step(name: string): void;
  observe(type: string, detail?: string): void;
  return_<T>(name: string, value: T): T;
}

// For now, implement as pass-through (no-op) to allow gradual migration
export const createObservationSession = (): ObservationSession => ({
  read: () => {},
  step: () => {},
  observe: (type, detail) => console.debug(`[obs] ${type}:`, detail),
  return_: (_, value) => value,
});
```

**Why this approach:**
- Existing functions work unchanged (obs methods are no-ops)
- Contract objects are formally declared (verifiable intent)
- Gradual migration: obs calls can be added to test coverage later
- Satisfies CLAUDE.md mandate: "Every function must have contract + conduct"

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── contracts/
│   │   ├── recording.contract.ts      # Contract definitions for recording service
│   │   ├── archive.contract.ts        # Contract definitions for storage
│   │   ├── waveform.contract.ts       # Contract for visualization
│   │   ├── playback.contract.ts       # Contract for audio preview
│   │   └── errors.contract.ts         # Error classification schema
│   ├── recording.ts                   # Recording service with obs calls
│   ├── archive.ts                     # Storage service with obs calls
│   ├── waveform.ts                    # Waveform analysis service (NEW)
│   ├── playback.ts                    # Audio preview playback (NEW)
│   ├── errors.ts                      # Error types and messages (NEW)
│   ├── capabilities.ts                # Browser feature detection (NEW)
│   ├── obs.ts                         # Observation session injector
│   └── i18n.ts                        # Already correct pattern
├── routes/
│   └── +page.svelte                   # Recording UI with assertions
└── tests/
    ├── recording.test.ts              # Unit tests for recording service
    ├── archive.test.ts                # Unit tests for storage
    ├── waveform.test.ts               # Waveform visualization tests
    ├── +page.integration.test.ts      # E2E user flow tests
    └── setup.ts                       # Vitest + testing-library setup
```

### Pattern 1: TypeScript Service with Contract

**What:** A service function that accepts `obs` parameter and executes with observation markers.

**When to use:** For all business logic in `src/lib/` — recording, archiving, error handling, translations.

**Example from kernel:**

```typescript
// From C3/kernel/EXAMPLES/typescript/transform.ts
interface TransformUserContract {
  serves: string;
  declares: { input: "raw_user"; output: "normalized_user" };
  succeeds_if: {
    reads: ["raw_user"];
    steps: ["extract_fields", "normalize_email", "validate_user"];
    observes: ["transformation_complete"];
    returns: ["normalized_user"];
  };
  fails_if: {
    observes: ["missing_required_field", "invalid_email", "validation_error"];
  };
}

function transformUser(rawUser: RawUserData, obs: ObservationSession): User {
  obs.read("raw_user", rawUser);
  obs.step("extract_fields");
  let userId = rawUser?.id;
  // ... validate and transform ...
  obs.observe("transformation_complete", `user_id=${userId}`);
  return obs.return_<User>("normalized_user", normalizedUser);
}

const transformUserBound = bindContract(transformUserContract)(transformUser);
export { transformUserBound as transformUser };
```

**Apply to Phase 1:**

```typescript
// src/lib/recording.ts - startRecording with contract
const startRecordingContract: StartRecordingContract = {
  serves: "acquire microphone stream and initialize recording",
  declares: { input: "stream_request", output: "recording_initialized" },
  succeeds_if: {
    reads: ["stream_request"],
    steps: ["request_permission", "create_media_recorder", "start_capture"],
    observes: ["permission_granted", "media_recorder_ready", "capture_started"],
    returns: ["recording_initialized"],
  },
  fails_if: {
    observes: ["permission_denied", "media_recorder_failed", "stream_error"],
  },
};

export async function startRecording(obs: ObservationSession): Promise<void> {
  obs.read("stream_request", {});
  obs.step("request_permission");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    obs.observe("permission_granted", "user granted microphone access");

    obs.step("create_media_recorder");
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    obs.observe("media_recorder_ready", "MediaRecorder initialized");

    obs.step("start_capture");
    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      audioChunks.push(event.data);
    };
    mediaRecorder.start();
    startTime = Date.now();
    elapsedMs = 0;
    obs.observe("capture_started", "stream recording active");

    timerInterval = window.setInterval(() => {
      elapsedMs = Date.now() - startTime;
    }, 100);

    return obs.return_<void>("recording_initialized", undefined);
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      obs.observe("permission_denied", "user denied microphone access");
    } else {
      obs.observe("stream_error", error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
}
```

### Pattern 2: Svelte Component with Assertions

**What:** A Svelte component with JSDoc contracts and reactive assertion guards.

**When to use:** For UI components that transform props to output or dispatch events.

**Example from kernel:**

```svelte
<!-- From C3/kernel/EXAMPLES/svelte/FormValidator.svelte -->
<script>
  /**
   * @serves "validate email input"
   * @declares "email" "isValid"
   * @succeeds_if "reads email" "returns isValid"
   */

  export let email = "";
  let isValid = false;

  function validateEmailInput(obs) {
    obs?.read("email", email);
    obs?.step("check_format");
    if (!email || !email.includes("@")) {
      obs?.observe("email_invalid");
      return false;
    }
    obs?.observe("email_valid");
    return obs?.return_("isValid", true) ?? true;
  }

  // Runtime assertions (optional but recommended)
  $: {
    console.assert(!email || email.includes("@"), "email must contain @ or be empty");
  }

  // Execute on input change
  $: {
    if (email) {
      isValid = validateEmailInput(obs);
    }
  }
</script>
```

**Apply to Phase 1 (+page.svelte):**

```svelte
<script>
  /**
   * @serves "provide recording UI and state management"
   * @declares "recordingState" "elapsedMs" "audioBlob"
   */

  let recordingState: 'idle' | 'recording' | 'paused' | 'stopped' = $state('idle');
  let elapsedMs = $state(0);
  let audioBlob: Blob | null = $state(null);

  // Runtime assertions (success/failure conditions)
  $: {
    console.assert(
      recordingState === 'idle' || recordingState === 'recording' ||
      recordingState === 'paused' || recordingState === 'stopped',
      "recordingState must be one of: idle, recording, paused, stopped"
    );
    console.assert(
      elapsedMs >= 0,
      "elapsedMs must never be negative"
    );
  }

  async function handleStartRecording() {
    try {
      const obs = createObservationSession();
      await startRecording(obs);
      recordingState = 'recording';
      elapsedMs = 0;
    } catch (error) {
      // Error handling via error classification
    }
  }
</script>
```

### Anti-Patterns to Avoid

- **No contract object:** Writing `startRecording()` with obs calls but no formal contract object → violates kernel/THEORY.md spatial proof requirement; makes intent non-verifiable
- **Mixing obs paradigms:** Some functions use obs, others don't → inconsistent contracts; hard to understand which paths have observation coverage
- **Throwing generic Error:** Catching all exceptions and re-throwing as generic Error → loses context for error classification; makes user messaging impossible
- **No assertion guards in Svelte:** Components without `$: { console.assert(...) }` → can render invalid states silently; breaks contract visibility
- **Contract doesn't match conduct:** Contract declares steps "fetch, validate, return" but code has steps "check, process, save" → reader sees misalignment; proof broken

---

## Waveform Visualization

### Real-Time Frequency Analysis with AnalyserNode

**Pattern:**

1. **Create AnalyserNode** connected to media stream:
   ```typescript
   // In startRecording(), after creating AudioContext
   const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
   const source = audioContext.createMediaStreamSource(stream);
   const analyser = audioContext.createAnalyser();
   analyser.fftSize = 2048;  // FFT size for frequency analysis
   source.connect(analyser);
   ```

2. **Extract frequency data** via requestAnimationFrame:
   ```typescript
   function getWaveformData(): Uint8Array {
     const dataArray = new Uint8Array(analyser.frequencyBinCount);
     analyser.getByteFrequencyData(dataArray);  // 0-255 values per frequency bin
     return dataArray;
   }

   function animateWaveform() {
     const data = getWaveformData();
     renderWaveform(data);  // Draw to Canvas or SVG
     requestAnimationFrame(animateWaveform);  // 60 FPS sync with browser
   }
   ```

3. **Canvas vs SVG:**
   - **Canvas:** 30+ FPS for high-resolution waveforms; better for performance-critical viz
   - **SVG:** Cleaner code, DOM-based scaling, but slower redraws (10-20 FPS typical)

   **Recommendation for Phase 1:** Canvas with `requestAnimationFrame()` achieves 30+ FPS target for live waveform updates.

4. **Contract for waveform service** (`src/lib/waveform.ts`):
   ```typescript
   interface StartWaveformAnalysisContract {
     serves: string;
     declares: { input: "audio_stream"; output: "frequency_analyzer" };
     succeeds_if: {
       reads: ["audio_stream"];
       steps: ["create_audio_context", "create_analyser", "connect_source"];
       observes: ["analyser_ready"];
       returns: ["frequency_analyzer"];
     };
     fails_if: {
       observes: ["audio_context_unavailable", "analyser_creation_failed"];
     };
   }
   ```

5. **Rendering in +page.svelte:**
   ```svelte
   <script>
     let canvasRef: HTMLCanvasElement;

     onMount(() => {
       if (!canvasRef) return;
       const ctx = canvasRef.getContext('2d');

       function drawWaveform(data: Uint8Array) {
         ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
         const barWidth = (canvasRef.width / data.length) * 2.5;

         data.forEach((value, i) => {
           const barHeight = (value / 255) * canvasRef.height;
           ctx.fillRect(
             i * barWidth,
             canvasRef.height - barHeight,
             barWidth - 2,
             barHeight
           );
         });
       }

       let animationId: number;
       const animate = () => {
         const waveData = getWaveformData();  // From waveform service
         drawWaveform(waveData);
         animationId = requestAnimationFrame(animate);
       };
       animate();

       return () => cancelAnimationFrame(animationId);
     });
   </script>

   {#if recordingState === 'recording'}
     <canvas bind:this={canvasRef} width="300" height="100"></canvas>
   {/if}
   ```

### Browser Support (from Web Audio API MDN)

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| AnalyserNode | 14+ | 25+ | 6+ | 12+ |
| getByteFrequencyData() | 14+ | 25+ | 6+ | 12+ |
| getFloatFrequencyData() | 14+ | 25+ | 6+ | 12+ |
| requestAnimationFrame | Universal | Universal | Universal | Universal |

**Confidence:** HIGH — AnalyserNode is mature, well-documented, and universally supported.

---

## Pause/Resume Support

### MediaRecorder API State Management

**Current issue:** `recording.ts` only has start/stop; no pause/resume.

**MediaRecorder states:**
- `recording` — actively capturing
- `paused` — not capturing, stream still held
- `inactive` — stopped, cannot resume

**Implementation pattern:**

```typescript
// In recording.ts
export interface RecordingSession {
  isRecording: boolean;
  isPaused: boolean;
  elapsedMs: number;
  audioBlob: Blob | null;
}

export async function pauseRecording(obs: ObservationSession): Promise<void> {
  obs.read("pause_request", {});
  obs.step("pause_media_recorder");

  if (!mediaRecorder || mediaRecorder.state !== 'recording') {
    obs.observe("pause_failed", "MediaRecorder not in recording state");
    throw new Error("Cannot pause: not recording");
  }

  mediaRecorder.pause();
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  obs.observe("paused", `paused at ${elapsedMs}ms`);
  return obs.return_<void>("paused", undefined);
}

export async function resumeRecording(obs: ObservationSession): Promise<void> {
  obs.read("resume_request", {});
  obs.step("resume_media_recorder");

  if (!mediaRecorder || mediaRecorder.state !== 'paused') {
    obs.observe("resume_failed", "MediaRecorder not in paused state");
    throw new Error("Cannot resume: not paused");
  }

  mediaRecorder.resume();
  const pausedAt = elapsedMs;
  timerInterval = window.setInterval(() => {
    elapsedMs = Date.now() - startTime;  // Continue from same startTime
  }, 100);

  obs.observe("resumed", `resumed from ${pausedAt}ms`);
  return obs.return_<void>("resumed", undefined);
}
```

**Key insight:** MediaRecorder.pause() preserves the Blob and stream; resuming continues appending to the same Blob. Timer calculation remains valid because `startTime` never resets.

**State in +page.svelte:**

```svelte
<script>
  let recordingState: 'idle' | 'recording' | 'paused' | 'stopped' = $state('idle');

  async function handlePause() {
    try {
      const obs = createObservationSession();
      await pauseRecording(obs);
      recordingState = 'paused';
    } catch (error) {
      statusMessage = t('pause_failed');
    }
  }

  async function handleResume() {
    try {
      const obs = createObservationSession();
      await resumeRecording(obs);
      recordingState = 'recording';
    } catch (error) {
      statusMessage = t('resume_failed');
    }
  }
</script>

{#if recordingState === 'recording'}
  <button onclick={handlePause}>{t('pause')}</button>
{:else if recordingState === 'paused'}
  <button onclick={handleResume}>{t('resume')}</button>
{/if}
```

**Browser support:** Pause/resume have been stable since April 2021 across all modern browsers (Chrome 49+, Firefox 25+, Safari 14.1+, Edge 79+). No fallback needed.

**Confidence:** HIGH — API well-tested and production-ready.

---

## Audio Preview Playback

### Create Blob URL and Bind to Audio Element

**Pattern:**

```typescript
// src/lib/playback.ts
export interface AudioPreviewContract {
  serves: string;
  declares: { input: "audio_blob"; output: "preview_url" };
  succeeds_if: {
    reads: ["audio_blob"];
    steps: ["create_blob_url", "validate_url"];
    observes: ["preview_ready"];
    returns: ["preview_url"];
  };
  fails_if: {
    observes: ["invalid_blob", "url_creation_failed"];
  };
}

export function createAudioPreview(audioBlob: Blob, obs: ObservationSession): string {
  obs.read("audio_blob", audioBlob);
  obs.step("create_blob_url");

  if (!audioBlob || audioBlob.size === 0) {
    obs.observe("invalid_blob", "blob is empty or null");
    throw new Error("Invalid audio blob");
  }

  try {
    const previewUrl = URL.createObjectURL(audioBlob);
    obs.step("validate_url");
    obs.observe("preview_ready", `blob:// URL created`);
    return obs.return_<string>("preview_url", previewUrl);
  } catch (error) {
    obs.observe("url_creation_failed", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
```

**In +page.svelte:**

```svelte
<script>
  let previewUrl: string | null = null;
  let isPlaying = $state(false);

  async function handleStopRecording() {
    try {
      audioBlob = await stopRecording(obs);
      recordingState = 'stopped';

      // Create preview URL
      previewUrl = createAudioPreview(audioBlob, obs);
    } catch (error) {
      statusMessage = t('playback_error');
    }
  }

  function handleAudioEnded() {
    isPlaying = false;
  }
</script>

{#if recordingState === 'stopped'}
  <section>
    <audio
      src={previewUrl}
      controls
      on:ended={handleAudioEnded}
    ></audio>

    <p>{t('story_title')}</p>
    <input type="text" bind:value={storyTitle} />
    <button onclick={handleArchive}>{t('archive_button')}</button>
  </section>
{/if}
```

**Cleanup:** Remember to revoke blob URLs when done:

```svelte
onDestroy(() => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
});
```

**Browser support:** URL.createObjectURL() is universal (IE 10+).

**Confidence:** HIGH — simple standard API with no edge cases.

---

## Error Handling Architecture

### Error Classification System

**Issue:** Current code throws generic errors. Need structured error types for user messaging.

**Create `src/lib/errors.ts`:**

```typescript
// Error classification contract
export class RecordingError extends Error {
  constructor(
    public errorType: 'PERMISSION_DENIED' | 'MEDIA_RECORDER_ERROR' |
                      'STORAGE_ERROR' | 'UNSUPPORTED_BROWSER' | 'UNKNOWN',
    public context: Record<string, string>,
    message: string
  ) {
    super(message);
    this.name = 'RecordingError';
  }
}

export function classifyRecordingError(error: unknown): RecordingError {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return new RecordingError(
        'PERMISSION_DENIED',
        { platform: getPlatform(), browser: getBrowser() },
        error.message
      );
    }
    if (error.name === 'NotSupportedError') {
      return new RecordingError(
        'UNSUPPORTED_BROWSER',
        { platform: getPlatform(), browser: getBrowser() },
        'Your browser does not support audio recording'
      );
    }
  }

  if (error instanceof IDBException) {
    return new RecordingError(
      'STORAGE_ERROR',
      { code: error.code },
      'Failed to save story to storage'
    );
  }

  return new RecordingError(
    'UNKNOWN',
    { originalError: error instanceof Error ? error.message : String(error) },
    'An unexpected error occurred'
  );
}
```

**Integrate with i18n.ts for bilingual messages:**

```typescript
// src/lib/errors.ts (continued)

export function getErrorMessage(error: RecordingError, language: 'vi' | 'en'): string {
  const messages: Record<string, Record<'vi' | 'en', string>> = {
    PERMISSION_DENIED: {
      vi: 'Quyền truy cập micrô bị từ chối. Vui lòng cho phép quyền truy cập micrô trong cài đặt trình duyệt.',
      en: 'Microphone permission denied. Please grant microphone access in your browser settings.',
    },
    UNSUPPORTED_BROWSER: {
      vi: 'Trình duyệt của bạn không hỗ trợ ghi âm. Vui lòng sử dụng Chrome, Firefox, Safari hoặc Edge.',
      en: 'Your browser does not support audio recording. Please use Chrome, Firefox, Safari, or Edge.',
    },
    STORAGE_ERROR: {
      vi: 'Không thể lưu chuyện của bạn. Vui lòng xóa một số bản ghi cũ và thử lại.',
      en: 'Could not save your story. Please delete some old recordings and try again.',
    },
    UNKNOWN: {
      vi: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
      en: 'An unexpected error occurred. Please try again.',
    },
  };

  return messages[error.errorType]?.[language] || messages.UNKNOWN[language];
}
```

**Use in components:**

```svelte
<script>
  import { classifyRecordingError, getErrorMessage } from '$lib/errors';

  async function handleStartRecording() {
    try {
      const obs = createObservationSession();
      await startRecording(obs);
      recordingState = 'recording';
    } catch (error) {
      const classified = classifyRecordingError(error);
      statusMessage = getErrorMessage(classified, $currentLanguage);
      // Log for debugging
      console.error('Recording error:', classified);
    }
  }
</script>
```

**Confidence:** HIGH — error classification is straightforward and matches C3 contract pattern (Success/Failure conditions).

---

## Testing Approach

### Test Framework Setup

**Install dependencies:**

```bash
npm install --save-dev vitest @vitest/ui @testing-library/svelte jsdom
npm install --save-dev @testing-library/user-event
```

**Create `vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**Create `src/tests/setup.ts`:**

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Clean up after each test
afterEach(() => cleanup());

// Mock navigator.mediaDevices for Web Audio tests
global.navigator.mediaDevices = {
  getUserMedia: vi.fn(async () => ({
    getTracks: () => [],
    getAudioTracks: () => [],
  })) as any,
};

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};
global.indexedDB = mockIndexedDB as any;
```

### Contract-Driven Test Structure

**For each function with a contract, test the contract's clauses:**

```typescript
// src/tests/recording.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startRecording, stopRecording } from '$lib/recording';
import { createObservationSession } from '$lib/obs';

describe('startRecording', () => {
  let mockStream: any;
  let obs: any;

  beforeEach(() => {
    obs = createObservationSession();
    mockStream = {
      getTracks: vi.fn(() => [{ stop: vi.fn() }]),
      getAudioTracks: vi.fn(() => [{ stop: vi.fn() }]),
    };
  });

  it('succeeds: should initialize MediaRecorder and start recording', async () => {
    // Arrange
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(mockStream);

    // Act
    await startRecording(obs);

    // Assert
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    // Verify contract: succeeds_if observes "permission_granted", "media_recorder_ready", "capture_started"
  });

  it('fails: should throw when permission denied', async () => {
    // Arrange
    const permissionError = new DOMException('Permission denied', 'NotAllowedError');
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(permissionError);

    // Act & Assert
    await expect(startRecording(obs)).rejects.toThrow('Permission denied');
    // Verify contract: fails_if observes "permission_denied"
  });
});
```

### Mocking Web Audio API & MediaRecorder

**For waveform tests (Canvas-based):**

```typescript
// src/tests/waveform.test.ts
import { describe, it, expect, vi } from 'vitest';
import { startWaveformAnalysis } from '$lib/waveform';

describe('startWaveformAnalysis', () => {
  it('should create AnalyserNode and connect to stream', () => {
    // Arrange
    const mockStream = {
      getTracks: vi.fn(() => []),
      getAudioTracks: vi.fn(() => []),
    };

    const mockAnalyser = {
      fftSize: 0,
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
    };

    const mockAudioContext = {
      createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
      createAnalyser: vi.fn(() => mockAnalyser),
    };

    global.AudioContext = vi.fn(() => mockAudioContext) as any;

    // Act
    const analyser = startWaveformAnalysis(mockStream, obs);

    // Assert
    expect(analyser).toBe(mockAnalyser);
    expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
  });
});
```

### Test Commands

**Add to package.json:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

**Run tests:**

```bash
npm run test           # Quick run
npm run test:watch    # Watch mode (30 FPS update for waveform viz)
npm run test:ui       # Browser-based test UI
npm run test:coverage # Coverage report
```

**Confidence:** MEDIUM-HIGH — Vitest setup is standard; mocking MediaRecorder requires careful stubs (no off-the-shelf library yet, but pattern is well-established in React/Vue testing).

---

## Browser Capability Detection & Fallback

### Feature Detection Strategy

**Create `src/lib/capabilities.ts`:**

```typescript
export interface BrowserCapabilities {
  mediaRecorder: boolean;
  getUserMedia: boolean;
  audioContext: boolean;
  indexedDb: boolean;
  canRecord: boolean;  // All recording APIs available
}

export function detectCapabilities(): BrowserCapabilities {
  const caps = {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    getUserMedia:
      navigator?.mediaDevices?.getUserMedia !== undefined,
    audioContext:
      typeof (window as any).AudioContext !== 'undefined' ||
      typeof (window as any).webkitAudioContext !== 'undefined',
    indexedDb: typeof indexedDB !== 'undefined',
  };

  return {
    ...caps,
    canRecord: caps.mediaRecorder && caps.getUserMedia && caps.indexedDb,
  };
}

export function getMissingCapabilities(caps: BrowserCapabilities): string[] {
  const missing = [];
  if (!caps.mediaRecorder) missing.push('MediaRecorder');
  if (!caps.getUserMedia) missing.push('getUserMedia');
  if (!caps.audioContext) missing.push('AudioContext');
  if (!caps.indexedDb) missing.push('IndexedDB');
  return missing;
}
```

**Use in +page.svelte:**

```svelte
<script>
  import { detectCapabilities, getMissingCapabilities } from '$lib/capabilities';

  let capabilities: BrowserCapabilities;
  let isSupported: boolean;

  onMount(() => {
    capabilities = detectCapabilities();
    isSupported = capabilities.canRecord;
  });
</script>

{#if !isSupported}
  <div class="unsupported-browser">
    <p>{t('unsupported_browser')}</p>
    <p>{t('compatible_browsers')}: Chrome, Firefox, Safari, Edge</p>
    <details>
      <summary>{t('technical_details')}</summary>
      <p>Missing: {getMissingCapabilities(capabilities).join(', ')}</p>
    </details>
  </div>
{:else}
  <!-- Normal UI -->
{/if}
```

**Minimum browser versions:**

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 53+ | getUserMedia + MediaRecorder + IndexedDB |
| Firefox | 55+ | Same coverage |
| Safari | 14.1+ | iOS Safari support required for target audience |
| Edge | 79+ | Chromium-based; same as Chrome |
| IE 11 | Not supported | No graceful fallback possible |

**Add to i18n.ts:**

```typescript
export const strings = {
  vi: {
    unsupported_browser: 'Trình duyệt của bạn không hỗ trợ ghi âm.',
    compatible_browsers: 'Các trình duyệt hỗ trợ',
    technical_details: 'Chi tiết kỹ thuật',
  },
  en: {
    unsupported_browser: 'Your browser does not support audio recording.',
    compatible_browsers: 'Compatible browsers',
    technical_details: 'Technical details',
  },
};
```

**Confidence:** HIGH — feature detection is straightforward; no version-specific gotchas.

---

## Memory Management & Cleanup

### Preventing Microphone Reference Leaks

**Issue (from CONCERNS.md #8):** If user navigates away mid-recording, MediaRecorder and stream references remain orphaned.

**Pattern:**

```typescript
// src/lib/recording.ts

let mediaRecorder: MediaRecorder | null = null;
let audioStream: MediaStream | null = null;
let timerInterval: number | null = null;

export async function startRecording(obs: ObservationSession): Promise<void> {
  obs.read("stream_request", {});
  obs.step("request_permission");

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(audioStream);
    // ... rest of setup ...
  } catch (error) {
    // Cleanup on error
    cleanupRecording();
    throw error;
  }
}

// MARK: Cleanup function (required)
export function cleanupRecording(obs?: ObservationSession): void {
  obs?.step("cleanup_resources");

  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
    obs?.observe("timer_cleared");
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    obs?.observe("media_recorder_stopped");
  }

  if (audioStream) {
    audioStream.getTracks().forEach((track) => {
      track.stop();
      obs?.observe("stream_track_stopped", `${track.kind} track stopped`);
    });
    audioStream = null;
  }

  mediaRecorder = null;
}
```

**In +page.svelte (beforeNavigate hook):**

```svelte
<script>
  import { beforeNavigate } from '$app/navigation';
  import { cleanupRecording } from '$lib/recording';

  beforeNavigate(({ cancel }) => {
    if (isRecording()) {
      const shouldContinue = confirm(t('confirm_discard_recording'));
      if (!shouldContinue) {
        cancel();
        return;
      }

      // User confirmed navigation; cleanup
      cleanupRecording(createObservationSession());
    }
  });

  onDestroy(() => {
    // Cleanup on component unmount
    cleanupRecording();
  });
</script>
```

**For blob URLs:**

```svelte
<script>
  onDestroy(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  });
</script>
```

**Confidence:** HIGH — standard cleanup patterns; no gotchas.

---

## Implementation Roadmap

**Recommended task order to address blockers:**

### Week 1 (Sessions 1-2)

1. **C3 Contract Integration (CRITICAL BLOCKER)**
   - Add ObservationSession type to `src/lib/obs.ts`
   - Define contract interfaces for: startRecording, stopRecording, saveStory, t()
   - Add obs.step() and obs.observe() calls to existing functions
   - Bind contracts to exported functions
   - **Output:** All functions have formal contracts matching BOOTSTRAP.md pattern
   - **Blocks:** All other features depend on contract infrastructure

2. **Test Framework Setup (CRITICAL BLOCKER)**
   - Add vitest to package.json
   - Create vitest.config.ts with jsdom environment
   - Create src/tests/setup.ts with navigator.mediaDevices mock
   - Create example test file (recording.test.ts)
   - **Output:** `npm run test` passes (even if no tests yet)
   - **Blocks:** Cannot verify any features without tests

### Week 1-2 (Sessions 2-3)

3. **Pause/Resume Support (ACCEPTANCE CRITERION)**
   - Add pauseRecording() and resumeRecording() functions to recording.ts with contracts
   - Update RecordingSession interface to track isPaused state
   - Add pause/resume buttons and state handling in +page.svelte
   - Test pause/resume state transitions
   - **Output:** User can pause mid-recording and resume without losing audio
   - **Blocks:** Acceptance criteria for Phase 1

4. **Audio Preview Playback (ACCEPTANCE CRITERION)**
   - Create src/lib/playback.ts with createAudioPreview() contract
   - Add <audio> element to +page.svelte stopped state
   - Implement blob URL creation and cleanup
   - Test playback controls and cleanup
   - **Output:** User can preview recorded audio before archiving
   - **Blocks:** Acceptance criteria for Phase 1

### Week 2 (Session 3)

5. **Waveform Visualization (ACCEPTANCE CRITERION)**
   - Create src/lib/waveform.ts with startWaveformAnalysis() and getWaveformData() contracts
   - Implement Canvas-based frequency visualization
   - Add requestAnimationFrame loop for 30+ FPS updates
   - Integrate waveform into +page.svelte recording state
   - Test waveform data extraction and Canvas rendering
   - **Output:** Live waveform displays during recording
   - **Blocks:** Acceptance criteria for Phase 1

6. **Error Classification & Bilingual Messages (ACCEPTANCE CRITERION)**
   - Create src/lib/errors.ts with RecordingError and classification functions
   - Define error messages for all error types in both Vietnamese and English
   - Integrate error classification into startRecording(), saveStory(), etc.
   - Update +page.svelte to display classified error messages
   - Test error classification and message retrieval
   - **Output:** Users see clear, bilingual error messages when things fail
   - **Blocks:** Acceptance criteria for Phase 1

### Week 2-3 (Session 4)

7. **Browser Capability Detection (ACCEPTANCE CRITERION)**
   - Create src/lib/capabilities.ts with detectCapabilities() function
   - Add unsupported browser UI state to +page.svelte
   - Add bilingual messages for unsupported browsers
   - Test capability detection on current environment
   - **Output:** Graceful message if browser doesn't support recording
   - **Blocks:** Acceptance criteria for Phase 1

8. **Integration Testing & Verification (GATE)**
   - Write end-to-end tests for entire recording flow (start → pause → resume → stop → preview → archive)
   - Test error paths (permission denied, storage full, etc.)
   - Test bilingual UI (toggle language, verify all strings update)
   - Test waveform performance (30+ FPS confirmation)
   - Test cleanup on navigation
   - **Output:** `npm run test:coverage` shows >80% coverage of critical paths
   - **Blocks:** Phase 1 gate before moving to Phase 2

---

## Common Pitfalls

### Pitfall 1: Not Cleaning Up MediaStream Tracks

**What goes wrong:** User records, stops, then navigates away. Microphone remains active; if user re-enters the page, they get permission denied (browser thinks access is still held).

**Why it happens:** `stopRecording()` only stops the MediaRecorder, not the underlying stream tracks.

**How to avoid:** Always call `stream.getTracks().forEach(t => t.stop())` after recording stops.

**Warning signs:**
- Microphone LED stays on after stopping recording
- Second recording attempt requires permission again
- Battery drain on mobile

**Code example:**
```typescript
export function stopRecording(): Promise<Blob> {
  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      audioChunks = [];

      // CRITICAL: Stop all tracks
      mediaRecorder!.stream.getTracks().forEach((track) => track.stop());

      resolve(audioBlob);
    };
    mediaRecorder.stop();
  });
}
```

---

### Pitfall 2: Observer Timing With Pause/Resume

**What goes wrong:** Timer shows incorrect elapsed time after pause/resume because `startTime` was reset or timer wasn't properly managed.

**Why it happens:** Naïve implementation restarts the timer or startTime on resume, breaking the total elapsed calculation.

**How to avoid:** Keep `startTime` constant throughout the entire session (start → pause → resume → stop). Only clear the interval on pause, restart on resume.

**Warning signs:**
- Timer jumps backwards after resume
- Timer shows different total time than expected
- Elapsed time doubles after pause/resume cycle

**Code example:**
```typescript
let startTime: number = 0;

export async function pauseRecording(): Promise<void> {
  // Clear interval but DO NOT reset startTime
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  mediaRecorder.pause();
}

export async function resumeRecording(): Promise<void> {
  // Restart interval using the SAME startTime
  mediaRecorder.resume();
  timerInterval = window.setInterval(() => {
    elapsedMs = Date.now() - startTime;  // Same startTime as before pause
  }, 100);
}
```

---

### Pitfall 3: Blob URL Leaks

**What goes wrong:** Component creates blob URLs with `URL.createObjectURL()` but never revokes them. Over many recordings, memory usage grows unbounded.

**Why it happens:** Blob URLs are held in memory until explicitly revoked; JavaScript garbage collection doesn't clean them up.

**How to avoid:** Always call `URL.revokeObjectURL()` when the URL is no longer needed (typically on component unmount or when switching to a new preview).

**Warning signs:**
- Memory usage climbs with each recording
- Browser becomes sluggish after many record/archive cycles
- Dev tools show blob: URLs accumulating

**Code example:**
```svelte
<script>
  let previewUrl: string | null = null;

  onDestroy(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  });

  function startNewRecording() {
    // Revoke old URL before creating new recording
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    // ... start recording ...
  }
</script>
```

---

### Pitfall 4: AudioContext Quota Exceeded

**What goes wrong:** Creating multiple AudioContext instances (one per recording session) causes the browser to refuse new contexts after a certain limit.

**Why it happens:** Browsers typically limit the number of AudioContext instances to ~6-12 per page to prevent memory exhaustion.

**How to avoid:** Reuse a single AudioContext across multiple recording sessions. Create it once on page load, close only on page unload.

**Warning signs:**
- Error: "NotSupportedError: The number of hardware contexts provided by the system is too large"
- Recording works first time, fails on second attempt

**Code example:**
```typescript
let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function closeAudioContext(): void {
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
}

// In +page.svelte
onDestroy(() => {
  closeAudioContext();
});
```

---

### Pitfall 5: Contract Doesn't Match Conduct

**What goes wrong:** Contract declares steps "fetch, validate, save" but code has "read, check, write" — reader sees mismatch and loses confidence in the proof.

**Why it happens:** Developer writes code first, then tries to retrofit contract without carefully aligning step names.

**How to avoid:** Write MARK + Purpose + Success + Failure + contract FIRST, then write conduct matching the contract exactly.

**Warning signs:**
- obs.step() names don't match contract's steps: clause
- obs.observe() types don't match contract's observes: clause
- Reader must trace code to understand flow (defeats the purpose of spatial proof)

**Code example (WRONG):**
```typescript
const recordingContract = {
  steps: ["request_permission", "create_recorder", "start"],  // Contract
};

function startRecording(obs) {
  obs.step("auth");  // WRONG! Doesn't match "request_permission"
  // ...
}
```

**Code example (CORRECT):**
```typescript
const recordingContract = {
  steps: ["request_permission", "create_recorder", "start"],
};

function startRecording(obs) {
  obs.step("request_permission");  // Matches contract
  // ...
  obs.step("create_recorder");      // Matches contract
  // ...
  obs.step("start");                // Matches contract
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prose-only contracts (MARK + comments) | Formal contract objects + obs calls | C3 kernel 1.0 (ongoing) | Intent becomes machine-verifiable; temporal gradient proves execution |
| Generic Error throws | Structured error types with classification | Phase 1 research | User sees helpful, bilingual messages instead of generic stack traces |
| Single-file recording service | Modular contracts (recording, playback, waveform, errors) | Phase 1 design | Easier to test, understand, and extend individual pieces |
| setTimeout for timer | requestAnimationFrame for waveform | Browser standard (~2015) | 30+ FPS synchronized with rendering; no stutter |
| Manual IndexedDB queries | Wrapped archive.ts service with contracts | Phase 1 design | Consistency with recording service; easier to test |

**Deprecated/outdated:**
- Web Audio API v1 (2012) → v2 (ongoing): Modern implementations use modern API shape
- Flash-based recording → MediaRecorder (2015+): Universal native API now available
- Callback hell for audio control → Promises/async-await (2017+): Modern cleaner syntax

---

## Open Questions

1. **Should error boundary be at +page.svelte or in service layer?**
   - What we know: C3 contract pattern allows errors in both places (services throw, components catch and message)
   - Unclear: Whether to validate inputs at service entry or component call-site
   - Recommendation: Validate at service entry (contracts declare failure conditions); components catch and display

2. **Should waveform be a separate component or inline Canvas in +page.svelte?**
   - What we know: Canvas rendering is fast; Svelte component overhead is minimal
   - Unclear: Reusability vs. simplicity
   - Recommendation: Start inline in +page.svelte; extract to component if reused in Phase 4 (export/visualization)

3. **How to mock MediaRecorder.ondataavailable in tests?**
   - What we know: Vitest has vi.fn() and vi.mock()
   - Unclear: Exact timing of ondataavailable callback in test environment
   - Recommendation: Use manual vi.fn() mock that calls ondataavailable synchronously in tests; verify async behavior with browser-mode tests later

4. **Should i18n strings be in separate file or inline in i18n.ts?**
   - What we know: Current approach (inline) is simple and sufficient for Phase 1
   - Unclear: Scalability as string count grows
   - Recommendation: Keep inline for Phase 1; refactor to JSON files in Phase 4 if needed

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| MediaRecorder API | Recording feature | ✓ | Built-in | Graceful message if unavailable |
| Web Audio API / AnalyserNode | Waveform visualization | ✓ | Built-in | Omit waveform, show static indicator |
| IndexedDB | Data persistence | ✓ | Built-in | localStorage (limited to ~5MB, fallback only) |
| getUserMedia | Microphone access | ✓ | Built-in | Graceful message if unavailable |
| Canvas API | Waveform rendering | ✓ | Built-in | SVG fallback (slower) |
| Node.js (for build) | Build tooling | ✓ (check version) | — | Must have Node 18+ |
| npm (for dependencies) | Package management | ✓ | — | — |

**Missing dependencies with no fallback:**
- None — all critical APIs have graceful degradation or are universal

**Missing dependencies with fallback:**
- AnalyserNode → Static amplitude indicator (simple vertical line or pulse)
- IndexedDB → Warn user that data won't persist across browser clear
- Canvas → SVG waveform (visually similar, slower)

**Note:** Environment check script can verify at build-time:
```bash
node --version   # Verify Node 18+
npm --version    # Verify npm present
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 1.0+ |
| Config file | vitest.config.ts |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Status |
|--------|----------|-----------|-------------------|------------|
| REC-01 | Start recording with single button tap | Unit + Integration | `npm run test -- recording.test.ts` | ❌ Wave 0 |
| REC-02 | Pause/resume without losing audio | Unit + Integration | `npm run test -- recording.test.ts pause` | ❌ Wave 0 |
| REC-03 | Stop recording and save to IndexedDB | Unit + Integration | `npm run test -- archive.test.ts saveStory` | ❌ Wave 0 |
| VIS-01 | Timer displays accurate MM:SS format | Unit | `npm run test -- recording.test.ts timer` | ❌ Wave 0 |
| VIS-02 | Waveform animates smoothly (30+ FPS) | Unit + Integration | `npm run test -- waveform.test.ts` | ❌ Wave 0 |
| VIS-03 | Recording status clearly indicated | Unit + Component | `npm run test -- +page.integration.test.ts` | ❌ Wave 0 |
| PLAY-01 | User can preview recorded audio | Integration | `npm run test -- playback.test.ts` | ❌ Wave 0 |
| PLAY-02 | Play/pause controls work correctly | Component | `npm run test -- +page.integration.test.ts` | ❌ Wave 0 |
| ERR-01 | Permission denied: clear bilingual message | Unit + Component | `npm run test -- errors.test.ts` | ❌ Wave 0 |
| ERR-02 | Browser incompatible: supportive message | Unit | `npm run test -- capabilities.test.ts` | ❌ Wave 0 |
| ERR-03 | Storage error: retry/clear options | Integration | `npm run test -- archive.test.ts error` | ❌ Wave 0 |
| I18N-01 | All UI text in Vietnamese and English | Integration | `npm run test -- i18n.test.ts` | ❌ Wave 0 |
| I18N-02 | Language toggle accessible and persistent | Component | `npm run test -- +page.integration.test.ts language` | ❌ Wave 0 |
| SAVE-01 | After save: green checkmark + message | Component | `npm run test -- +page.integration.test.ts` | ❌ Wave 0 |
| SAVE-02 | Record another audio option appears | Component | `npm run test -- +page.integration.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test` (quick-running unit tests only)
- **Per wave merge:** `npm run test:coverage` (full suite with integration tests)
- **Phase gate:** `npm run test:coverage` must show >80% coverage before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/tests/setup.ts` — Vitest environment setup with navigator.mediaDevices mock
- [ ] `src/tests/recording.test.ts` — Unit tests for startRecording(), stopRecording(), pauseRecording(), resumeRecording()
- [ ] `src/tests/archive.test.ts` — Unit tests for initDatabase(), saveStory(), getAllStories(), getStory()
- [ ] `src/tests/waveform.test.ts` — Unit tests for startWaveformAnalysis(), getWaveformData()
- [ ] `src/tests/playback.test.ts` — Unit tests for createAudioPreview()
- [ ] `src/tests/errors.test.ts` — Unit tests for error classification and message retrieval
- [ ] `src/tests/capabilities.test.ts` — Unit tests for browser capability detection
- [ ] `src/tests/+page.integration.test.ts` — E2E tests for recording UI flow (start → pause → resume → stop → preview → archive)
- [ ] Framework install: `npm install --save-dev vitest @vitest/ui @testing-library/svelte jsdom` (if not already done)

*(All test files are required; no existing test infrastructure exists beyond the setup)*

---

## Sources

### Primary (HIGH confidence)
- [C3 Kernel THEORY.md](file:///Users/server/nhonly/C3/kernel/THEORY.md) — Five forces and spatial proof shape
- [C3 Kernel BOOTSTRAP.md](file:///Users/server/nhonly/C3/kernel/BOOTSTRAP.md) — Contract patterns and obs API
- [C3 Kernel CONTRACTS.md](file:///Users/server/nhonly/C3/kernel/CONTRACTS.md) — Language templates (TypeScript, Svelte, Python)
- [C3 Kernel obs_api.md](file:///Users/server/nhonly/C3/kernel/obs_api.md) — Observation API reference
- [MDN: AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) — Frequency analysis for waveform
- [MDN: MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — Audio recording API
- [MDN: MediaRecorder.pause()](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/pause) — Pause/resume functionality
- [MDN: MediaRecorder.resume()](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/resume) — Resume after pause
- [MDN: Web Audio API Visualizations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API) — Canvas-based waveform patterns

### Secondary (MEDIUM confidence)
- [Vitest in 2026: The Testing Framework](https://dev.to/ottoaria/vitest-in-2026-the-testing-framework-that-makes-you-actually-want-to-write-tests-kap) — Vitest setup and mocking patterns
- [Testing Svelte with Vitest Browser Mode](https://scottspence.com/posts/testing-with-vitest-browser-svelte-guide) — Browser-mode testing for Web Audio
- [Svelte Testing Documentation](https://svelte.dev/docs/svelte/testing) — Component testing with Vitest
- [CanIUse: MediaRecorder](https://caniuse.com/mediarecorder) — Browser support verification
- [Dev.to: Building AI Conversation App with MediaRecorder](https://dev.to/yfkiwi/building-an-ai-conversation-practice-app-part-1-browser-audio-recording-with-mediarecorder-api-3cf5) — Practical MediaRecorder patterns
- [MDN: Browser Audio Stream Detection](https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery) — Feature detection and fallback strategies

### Tertiary (research sources, requires verification)
- Codebase analysis from CONCERNS.md and existing source files — Current implementation state

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All APIs are mature, well-documented, and universally supported across modern browsers
- Architecture: HIGH — C3 contract patterns are proven (documented in kernel); TypeScript service + Svelte component structure is standard
- C3 Integration: HIGH — BOOTSTRAP.md and examples provide clear templates; straightforward to retrofit and implement new contracts
- Waveform visualization: HIGH — AnalyserNode API is stable; Canvas rendering is well-established pattern
- Pause/Resume: HIGH — MediaRecorder pause/resume have been stable since April 2021; no browser-specific gotchas
- Audio Preview: HIGH — URL.createObjectURL is universal standard
- Error Handling: HIGH — Error classification pattern is straightforward; bilingual messaging is simple text mapping
- Testing: MEDIUM-HIGH — Vitest + @testing-library/svelte are standard; mocking Web Audio APIs requires careful stubs but no blockers
- Browser Detection: HIGH — Feature detection APIs are universal and reliable
- Memory Cleanup: HIGH — Standard patterns; no surprises

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days for stable APIs; no deprecation warnings found)
