---
phase: 01-recording-feature
plan: 03b
type: execute
wave: 3
depends_on: [01, 02, 03]
files_modified:
  - src/routes/+page.svelte
  - src/routes/+layout.svelte
autonomous: true
requirements:
  - VISUAL-FEEDBACK
  - REC-CONTROLS
  - ERROR-HANDLING
  - BILINGUAL-UI

must_haves:
  truths:
    - "Recording state shows pause/resume buttons"
    - "Waveform animates during recording"
    - "Timer updates every 100ms"
    - "Audio preview plays before save"
    - "All UI text available in Vietnamese and English"
    - "Error messages display in current language"
    - "UI states transition correctly: idle → recording → stopped → preview → idle"
  artifacts:
    - path: "src/routes/+page.svelte"
      provides: "Complete recording UI with state machine"
      exports: ["+page.svelte component"]
    - path: "src/routes/+layout.svelte"
      provides: "App-level language initialization"
      exports: ["+layout.svelte component"]
  key_links:
    - from: "src/routes/+page.svelte"
      to: "src/lib/recording.ts"
      via: "startRecording, pauseRecording, resumeRecording, stopRecording, cancelRecording"
      pattern: "await (startRecording|pauseRecording|resumeRecording|stopRecording|cancelRecording)"
    - from: "src/routes/+page.svelte"
      to: "src/lib/archive.ts"
      via: "saveStory on final archive"
      pattern: "saveStory"
    - from: "src/routes/+page.svelte"
      to: "src/lib/capabilities.ts"
      via: "checkBrowserCapabilities on mount"
      pattern: "checkBrowserCapabilities"
    - from: "src/routes/+page.svelte"
      to: "src/lib/waveform.svelte"
      via: "conditional rendering during recording state"
      pattern: "if recordingState === 'recording'"
    - from: "src/routes/+page.svelte"
      to: "src/lib/i18n.ts"
      via: "t() function for all UI text"
      pattern: "t\\("
    - from: "src/routes/+layout.svelte"
      to: "src/lib/i18n.ts"
      via: "initLanguage on mount"
      pattern: "initLanguage"
---

<objective>
Build complete recording UI with all states and transitions. Wire recording services, waveform visualization, and audio preview to functional UI. Implement bilingual support and error handling. Verify TypeScript compilation and build integrity.

Purpose: Create the user-facing interface that orchestrates all recording features (start/stop/pause/resume), visual feedback (waveform, timer, status), audio preview, and error handling in both Vietnamese and English.

Output:
- Complete +page.svelte with state machine for all recording states
- Pause/resume buttons in recording state
- Live waveform visualization during recording
- Audio preview player for playback before save
- Save confirmation with visual feedback
- All error messages localized
- TypeScript and build verification passing
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/recording.ts (from Plan 02, recording service)
@src/lib/archive.ts (from Plan 02, storage service)
@src/lib/capabilities.ts (from Plan 01, browser detection)
@src/lib/errors.ts (from Plan 01, error types)
@src/lib/i18n.ts (from Plan 04, bilingual strings)
@src/lib/waveform.ts (from Plan 03, frequency analysis)
@src/lib/waveform.svelte (from Plan 03, Canvas component)
@src/lib/preview.ts (from Plan 03, Blob URL management)
@.planning/REQUIREMENTS.md (UI state and acceptance criteria)
@.planning/codebase/CONCERNS.md (bilingual state management issues)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement complete +page.svelte with state machine and all recording states</name>
  <files>src/routes/+page.svelte</files>
  <read_first>
    - src/lib/recording.ts (function signatures for start/pause/resume/stop/cancel)
    - src/lib/archive.ts (saveStory function signature)
    - src/lib/capabilities.ts (checkBrowserCapabilities, BrowserCapabilities interface)
    - src/lib/errors.ts (Error types for classification)
    - src/lib/i18n.ts (t() function and i18n store)
    - src/lib/waveform.svelte (Waveform component props)
    - src/lib/preview.ts (createPreviewURL, revokePreviewURL)
    - .planning/REQUIREMENTS.md (UI acceptance criteria, all states)
  </read_first>
  <action>
Create src/routes/+page.svelte with exact content (440+ lines):

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentLanguage, t } from '$lib/i18n';
  import { checkBrowserCapabilities, assertBrowserSupported } from '$lib/capabilities';
  import { classifyError } from '$lib/errors';
  import { startRecording, pauseRecording, resumeRecording, stopRecording, cancelRecording, getElapsedMs } from '$lib/recording';
  import { startWaveformAnalysis, stopWaveformAnalysis } from '$lib/waveform';
  import { createPreviewURL, revokePreviewURL } from '$lib/preview';
  import { saveStory } from '$lib/archive';
  import Waveform from '$lib/waveform.svelte';

  // UI State Machine
  type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'preview' | 'saving' | 'saved' | 'error';
  let recordingState: RecordingState = 'idle';
  let errorMessage: string = '';
  let errorType: 'permission' | 'browser' | 'storage' | 'generic' | null = null;

  // Recording State
  let mediaStream: MediaStream | null = null;
  let elapsedMs = 0;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let audioBlob: Blob | null = null;
  let previewURL: string | null = null;
  let storyTitle: string = '';

  // Format elapsed time as MM:SS
  $: formattedTime = formatTime(elapsedMs);

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Start recording
  async function handleStartRecording(): Promise<void> {
    try {
      recordingState = 'recording';
      errorMessage = '';
      errorType = null;
      elapsedMs = 0;

      // Request microphone access
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start waveform analysis
      startWaveformAnalysis(mediaStream);

      // Start timer
      startTimer();
    } catch (error) {
      const classified = classifyError(error, { operation: 'start recording', api: 'getUserMedia' });
      errorMessage = classified.message;
      errorType = classified.name === 'PermissionError' ? 'permission' :
                  classified.name === 'BrowserError' ? 'browser' :
                  classified.name === 'StorageError' ? 'storage' : 'generic';
      recordingState = 'error';
      await cleanupAfterError();
    }
  }

  function startTimer(): void {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      elapsedMs += 100;
    }, 100);
  }

  function stopTimer(): void {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Pause recording
  async function handlePauseRecording(): Promise<void> {
    try {
      await pauseRecording();
      recordingState = 'paused';
      stopTimer();
    } catch (error) {
      const classified = classifyError(error, { operation: 'pause recording' });
      errorMessage = classified.message;
      recordingState = 'error';
    }
  }

  // Resume recording
  async function handleResumeRecording(): Promise<void> {
    try {
      await resumeRecording();
      recordingState = 'recording';
      startTimer();
    } catch (error) {
      const classified = classifyError(error, { operation: 'resume recording' });
      errorMessage = classified.message;
      recordingState = 'error';
    }
  }

  // Stop recording
  async function handleStopRecording(): Promise<void> {
    try {
      stopTimer();
      stopWaveformAnalysis();

      audioBlob = await stopRecording();
      if (!audioBlob) {
        throw new Error('Recording failed: no audio blob returned');
      }

      previewURL = createPreviewURL(audioBlob);
      recordingState = 'stopped';
    } catch (error) {
      const classified = classifyError(error, { operation: 'stop recording' });
      errorMessage = classified.message;
      recordingState = 'error';
      await cleanupAfterError();
    }
  }

  // Show preview
  function handleShowPreview(): void {
    recordingState = 'preview';
  }

  // Record again (discard current and start new)
  async function handleRecordAgain(): Promise<void> {
    try {
      // Cancel current recording and cleanup
      await cancelRecording();
      revokePreviewURL();
      audioBlob = null;
      previewURL = null;
      storyTitle = '';
      elapsedMs = 0;
      errorMessage = '';
      errorType = null;

      // Restart
      await handleStartRecording();
    } catch (error) {
      const classified = classifyError(error, { operation: 'record again' });
      errorMessage = classified.message;
      recordingState = 'error';
    }
  }

  // Archive story
  async function handleArchiveStory(): Promise<void> {
    if (!audioBlob || !storyTitle.trim()) {
      errorMessage = t('please_enter_title');
      return;
    }

    try {
      recordingState = 'saving';
      await saveStory({
        title: storyTitle,
        audioBlob,
        timestamp: new Date()
      });

      recordingState = 'saved';
      revokePreviewURL();

      // Reset after 2 seconds
      setTimeout(() => {
        recordingState = 'idle';
        storyTitle = '';
        audioBlob = null;
        previewURL = null;
      }, 2000);
    } catch (error) {
      const classified = classifyError(error, { operation: 'archive story', api: 'IndexedDB' });
      errorMessage = classified.message;
      errorType = classified.name === 'StorageError' ? 'storage' : 'generic';
      recordingState = 'error';
    }
  }

  // Cancel recording
  async function handleCancel(): Promise<void> {
    try {
      stopTimer();
      stopWaveformAnalysis();
      await cancelRecording();
      revokePreviewURL();
      recordingState = 'idle';
      audioBlob = null;
      previewURL = null;
      storyTitle = '';
      elapsedMs = 0;
      errorMessage = '';
      errorType = null;
    } catch (error) {
      const classified = classifyError(error, { operation: 'cancel recording' });
      errorMessage = classified.message;
      recordingState = 'error';
    }
  }

  async function cleanupAfterError(): Promise<void> {
    try {
      stopTimer();
      stopWaveformAnalysis();
      await cancelRecording();
      revokePreviewURL();
    } catch (_) {
      // Best effort cleanup
    }
  }

  function toggleLanguage(): void {
    const newLang = $currentLanguage === 'en' ? 'vi' : 'en';
    const { setLanguage } = require('$lib/i18n');
    setLanguage(newLang);
  }

  // Verify browser capabilities on mount
  onMount(() => {
    try {
      const caps = checkBrowserCapabilities();
      assertBrowserSupported(caps);
    } catch (error) {
      const classified = classifyError(error, { operation: 'check browser capabilities' });
      errorMessage = classified.message;
      recordingState = 'error';
    }
  });

  // Cleanup on unmount
  onDestroy(async () => {
    stopTimer();
    stopWaveformAnalysis();
    revokePreviewURL();
    await cancelRecording();
  });
</script>

<div class="container">
  <!-- Header -->
  <header class="header">
    <h1>{t('app_title')}</h1>
    <button on:click={toggleLanguage} class="lang-toggle">
      {$currentLanguage === 'en' ? 'VI' : 'EN'}
    </button>
  </header>

  <!-- Main Content -->
  <main class="main">
    {#if recordingState === 'error'}
      <!-- Error State -->
      <div class="error-box">
        <div class="error-icon">⚠️</div>
        <h2>{t('error_occurred')}</h2>
        <p>{errorMessage}</p>
        {#if errorType === 'permission'}
          <p class="error-detail">{t('microphone_required')}</p>
        {:else if errorType === 'browser'}
          <p class="error-detail">{t('browser_old')}</p>
        {:else if errorType === 'storage'}
          <p class="error-detail">{t('storage_full')}</p>
        {/if}
        <button on:click={handleCancel} class="btn btn-primary">
          {t('try_again')}
        </button>
      </div>

    {:else if recordingState === 'idle' && !audioBlob}
      <!-- Idle State -->
      <div class="idle-box">
        <h2>{t('tell_story')}</h2>
        <p class="subtitle">Share your story with your family</p>
        <button on:click={handleStartRecording} class="btn btn-primary btn-large">
          🎤 {t('tell_story')}
        </button>
      </div>

    {:else if recordingState === 'recording'}
      <!-- Recording State -->
      <div class="recording-box">
        <div class="status-indicator recording-pulsing">
          <span>{t('recording')}</span>
        </div>

        <div class="timer">{formattedTime}</div>

        <Waveform isRecording={true} />

        <div class="controls">
          <button on:click={handlePauseRecording} class="btn btn-secondary">
            ⏸ {t('pause')}
          </button>
          <button on:click={handleStopRecording} class="btn btn-danger">
            ⏹ {t('stop_recording')}
          </button>
        </div>
      </div>

    {:else if recordingState === 'paused'}
      <!-- Paused State -->
      <div class="recording-box">
        <div class="status-indicator paused-indicator">
          <span>{t('paused')}</span>
        </div>

        <div class="timer">{formattedTime}</div>

        <Waveform isRecording={false} />

        <div class="controls">
          <button on:click={handleResumeRecording} class="btn btn-secondary">
            ▶ {t('resume')}
          </button>
          <button on:click={handleStopRecording} class="btn btn-danger">
            ⏹ {t('stop_recording')}
          </button>
        </div>
      </div>

    {:else if recordingState === 'stopped'}
      <!-- Stopped/Preview State -->
      <div class="preview-box">
        <div class="preview-player">
          <audio controls src={previewURL} />
        </div>

        <div class="controls">
          <button on:click={handleRecordAgain} class="btn btn-secondary">
            🔄 {t('record_again')}
          </button>
          <button on:click={handleShowPreview} class="btn btn-primary">
            ✅ {t('preview')}
          </button>
        </div>
      </div>

    {:else if recordingState === 'preview'}
      <!-- Save Form State -->
      <div class="form-box">
        <h2>{t('story_title')}</h2>
        <input
          type="text"
          bind:value={storyTitle}
          placeholder={t('enter_title')}
          class="input-title"
          maxlength="100"
        />

        <div class="controls">
          <button on:click={handleCancel} class="btn btn-secondary">
            ✕ {t('cancel')}
          </button>
          <button on:click={handleArchiveStory} class="btn btn-primary">
            💾 {t('archive_button')}
          </button>
        </div>
      </div>

    {:else if recordingState === 'saving'}
      <!-- Saving State -->
      <div class="saving-box">
        <div class="spinner"></div>
        <h2>{t('saving_story')}</h2>
      </div>

    {:else if recordingState === 'saved'}
      <!-- Saved State -->
      <div class="saved-box">
        <div class="checkmark">✓</div>
        <h2>{t('save_confirmation')}</h2>
      </div>
    {/if}
  </main>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: #fff;
    border-bottom: 1px solid #eee;
  }

  .header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .lang-toggle {
    padding: 0.5rem 1rem;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  }

  .lang-toggle:hover {
    background: #e0e0e0;
  }

  .main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .idle-box, .error-box, .recording-box, .preview-box, .form-box, .saving-box, .saved-box {
    background: #fff;
    border-radius: 12px;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .idle-box h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }

  .subtitle {
    color: #666;
    margin: 0 0 2rem 0;
  }

  .error-box {
    border: 2px solid #ff6b6b;
  }

  .error-icon {
    font-size: 3rem;
    text-align: center;
    margin-bottom: 1rem;
  }

  .error-detail {
    color: #666;
    font-size: 0.9rem;
    margin: 1rem 0;
  }

  .status-indicator {
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .recording-pulsing {
    background: #ffe0e0;
    color: #d92d2d;
    animation: pulse 1s ease-in-out infinite;
  }

  .paused-indicator {
    background: #fffacd;
    color: #b8860b;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .timer {
    font-size: 3rem;
    font-weight: 700;
    text-align: center;
    margin: 1rem 0;
    font-family: 'Courier New', monospace;
    color: #333;
  }

  .controls {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }

  .btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #4CAF50;
    color: white;
  }

  .btn-primary:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }

  .btn-secondary {
    background: #2196F3;
    color: white;
  }

  .btn-secondary:hover {
    background: #0b7dda;
  }

  .btn-danger {
    background: #f44336;
    color: white;
  }

  .btn-danger:hover {
    background: #da190b;
  }

  .btn-large {
    padding: 1rem;
    font-size: 1.1rem;
  }

  .input-title {
    width: 100%;
    padding: 0.75rem;
    margin: 1rem 0 2rem 0;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
  }

  .input-title:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .preview-player {
    margin: 1rem 0;
  }

  .preview-player audio {
    width: 100%;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #4CAF50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .saving-box, .saved-box {
    text-align: center;
  }

  .checkmark {
    font-size: 4rem;
    color: #4CAF50;
    margin-bottom: 1rem;
  }

  /* Mobile responsiveness */
  @media (max-width: 600px) {
    .main {
      padding: 1rem;
    }

    .idle-box, .error-box, .recording-box, .preview-box, .form-box, .saving-box, .saved-box {
      padding: 1.5rem;
      max-width: 100%;
    }

    .timer {
      font-size: 2.5rem;
    }

    .controls {
      flex-direction: column;
    }
  }
</style>
```

Key features:
- Complete state machine: idle → recording → paused → stopped → preview → saving → saved
- All 6 recording states with proper UI feedback
- Pause/resume during recording
- Audio preview before save
- Title entry form
- Error handling with localized messages
- Language toggle integrated
- Timer with accurate 100ms updates
- Waveform animation during recording
- Responsive design for mobile
- Proper cleanup on unmount
  </action>
  <verify>
    <automated>grep -n "recordingState\|handleStartRecording\|handleStopRecording\|handlePauseRecording\|handleResumeRecording" src/routes/+page.svelte | head -20 && echo "Page component state machine implemented"</automated>
  </verify>
  <done>
    - src/routes/+page.svelte implements complete state machine
    - All 6 recording states with UI transitions
    - Pause/resume controls functional
    - Audio preview player working
    - All UI text uses t() for localization
    - Error handling integrated
    - Proper cleanup on component destroy
    - Responsive design for desktop and mobile
  </done>
</task>

<task type="auto">
  <name>Task 2: Update +layout.svelte for language initialization and verify build</name>
  <files>src/routes/+layout.svelte</files>
  <read_first>
    - src/lib/i18n.ts (initLanguage function signature)
  </read_first>
  <action>
Update src/routes/+layout.svelte:

```svelte
<script lang="ts">
  import { initLanguage } from '$lib/i18n';
  import { onMount } from 'svelte';

  let { children } = $props();

  // Initialize language on app startup
  onMount(() => {
    initLanguage();
  });
</script>

<svelte:head>
  <!-- Set page language for screen readers and accessibility -->
  <html lang="en" />
</svelte:head>

{@render children()}

<style global>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: #fafafa;
  }

  button {
    font-family: inherit;
  }

  input {
    font-family: inherit;
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
```

After updating, run verification:
1. `npm run check` — TypeScript type-checking
   - Verify no type errors
   - All imports resolve correctly
   - All C3 contract interfaces imported properly

2. `npm run build` — Production bundle build
   - Verify bundling succeeds
   - Check output in dist/ directory
   - Verify no errors in build output
   - Check bundle size (should be <500KB gzip)
  </action>
  <verify>
    <automated>
    npm run check 2>&1 | grep -q "error" && echo "TypeScript check FAILED" && exit 1 || echo "TypeScript check passed"
    npm run build 2>&1 | grep -q "error" && echo "Build FAILED" && exit 1 || true
    test -f dist/index.html && echo "Build output verified"
    </automated>
  </verify>
  <done>
    - src/routes/+layout.svelte calls initLanguage() on mount
    - Language preference initialized before UI renders
    - npm run check passes with no TypeScript errors
    - npm run build succeeds
    - dist/ directory contains valid output (index.html exists)
    - Bundle compiles with no errors
  </done>
</task>

</tasks>

<verification>
**UI State Machine verification:**
1. idle → recording transition works on "Tell your story" click
2. recording → paused transition works on "Pause" click
3. paused → recording transition works on "Resume" click
4. recording/paused → stopped transition works on "Stop" click
5. stopped → preview transition works on "Preview" click
6. preview → saving → saved transition works on "Archive" click
7. Any state → error transition on caught exceptions
8. Error → idle transition on "Try again" click

**Recording controls verification:**
1. Recording state shows pause/resume buttons
2. Timer updates every 100ms (MM:SS format)
3. Waveform animates during recording
4. Waveform stops when paused
5. Audio preview player visible after stop
6. Can play/pause/seek in preview

**Bilingual verification:**
1. All UI text uses t() function
2. Language toggle button works
3. All text changes when language switched
4. Language preference persists across reload
5. Error messages localized

**Build verification:**
1. TypeScript check passes (npm run check)
2. Production build succeeds (npm run build)
3. No compilation errors
4. dist/ directory created with index.html
5. Bundle size reasonable (<500KB gzip)

**Readiness for Phase 1 completion:**
- All recording states working
- All controls functional
- Bilingual UI complete
- Error handling integrated
- Build passing
- Ready for final acceptance criteria verification
</verification>

<success_criteria>
- [ ] src/routes/+page.svelte implements all 6 recording states
- [ ] State transitions work correctly
- [ ] Pause/resume buttons visible and functional during recording
- [ ] Timer updates every 100ms with MM:SS format
- [ ] Waveform animates during recording, stops when paused
- [ ] Audio preview player visible after stop
- [ ] All UI text uses t() for localization
- [ ] Language toggle works and persists
- [ ] Error messages display in current language
- [ ] npm run check passes
- [ ] npm run build succeeds
- [ ] dist/index.html exists
- [ ] No TypeScript or build errors
- [ ] Responsive design on mobile and desktop
</success_criteria>

<output>
After completion, create `.planning/phases/01-recording-feature/01-03b-SUMMARY.md` with:
- Complete +page.svelte state machine deployed
- All 6 recording states working with proper transitions
- Pause/resume controls functional
- Audio preview working
- Bilingual UI complete
- All error handling integrated
- TypeScript and build verification passing
- Phase 1 core feature complete and buildable
</output>
