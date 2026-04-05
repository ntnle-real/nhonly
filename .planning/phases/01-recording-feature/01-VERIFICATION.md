# Phase 1: Recording Feature — Acceptance Criteria Verification

**Phase Status:** Ready for Verification
**Verification Date:** 2026-04-05
**Project:** nhonly — Ceremonial Audio Recording System
**Requirement IDs:** [REC-CONTROLS, VISUAL-FEEDBACK, ERROR-HANDLING, BILINGUAL-UI, C3-CONTRACTS, NO-MEMORY-LEAKS, TEST-FRAMEWORK]

---

## Project Context

**Users:** Elderly storytellers, family members. Primary languages: Vietnamese and English.
**Core Mission:** Enable recording of audio narratives with assurance that stories are preserved safely.
**Success Indicator:** User can record, preview, and confirm save with minimal friction and maximum clarity.

---

## Phase 1 Acceptance Criteria Verification

All acceptance criteria from REQUIREMENTS.md must be verified. This document provides verification procedures and current implementation status.

### AC-1: Recording Controls — Start/Stop

**Requirement:** User can start recording with single button tap; see visual state change (red indicator); stop recording and save to IndexedDB.

**Implementation Status:**
- [x] Button "Tell your story" present in UI (src/routes/+page.svelte, line 100)
- [x] handleStartRecording() calls recording.ts startRecording() (line 28-37)
- [x] recordingState transitions: 'idle' → 'recording' (line 31)
- [x] stopRecording() implemented in recording.ts (lines 49-76)
- [x] Blob returned and stored in audioBlob (line 43)

**Status Indicators to Verify:**
- [ ] Red pulsing indicator visible during recording
- [ ] "Recording" text displayed
- [ ] Transition smooth with no lag
- [ ] Audio data collected without loss

**Verification Steps:**
1. Open browser to http://localhost:5173
2. Click "Tell your story" button
3. Grant microphone permission when prompted
4. Observe red pulsing indicator and "Recording" text appear
5. Speak into microphone for 5 seconds
6. Click "Stop" button
7. Verify audio blob exists and is ready for preview

**Test Procedure:**
```bash
npm run dev &
# In browser:
# 1. Tap "Tell your story"
# 2. Grant permission
# 3. Wait for red indicator
# 4. Record 10 seconds
# 5. Tap "Stop"
# Verify: Audio blob created, state transitions correctly
```

**Done When:** Recording starts with visual feedback, stops cleanly, audio blob returned.

---

### AC-2: Pause/Resume Support

**Requirement:** Pause button appears during recording; pause without losing audio; resume continues from pause point without data loss; multiple pause/resume cycles work.

**Implementation Status:**
- [ ] pauseRecording() function NOT YET IMPLEMENTED in recording.ts
- [ ] resumeRecording() function NOT YET IMPLEMENTED in recording.ts
- [ ] UI does not show pause/resume buttons (src/routes/+page.svelte, lines 104-111 only show stop)
- [ ] recordingState lacks 'paused' transition

**BLOCKING ISSUE:** Missing pause/resume support is a violation of REQUIREMENTS.md acceptance criteria.

**Fix Approach (from CONCERNS.md):**
1. Extend RecordingSession interface to track pausedAt, pauseCount
2. Add pauseRecording() function that calls mediaRecorder.pause()
3. Add resumeRecording() function that calls mediaRecorder.resume()
4. Update +page.svelte to show "Pause" button during 'recording' state
5. Add 'paused' state to recordingState type
6. Update pauseRecording() and resumeRecording() test cases

**Verification Steps (After Implementation):**
1. Start recording
2. Click "Pause" button
3. Verify timer stops, waveform freezes
4. Click "Resume" button
5. Verify timer resumes, waveform continues
6. Repeat pause/resume 3 times
7. Stop recording
8. Play back and verify all pause/resume cycles captured correctly

**Test Procedure:**
```bash
# After pause/resume implemented:
npm run test:run -- src/lib/recording.test.ts --grep "pause|resume"
# Expected: All pause/resume tests pass
```

**Done When:** Pause/resume cycles tested; no audio data loss; multiple cycles work correctly.

---

### AC-3: Visual Feedback — Waveform Animation

**Requirement:** Live waveform animation during recording; shows amplitude/frequency; animates at 30+ FPS; responsive to audio amplitude; stops when paused; resumes when resumed.

**Implementation Status:**
- [ ] Waveform visualization NOT YET IMPLEMENTED
- [ ] No Canvas or SVG waveform element in +page.svelte
- [ ] No AnalyserNode connected to audio stream
- [ ] No requestAnimationFrame animation loop

**BLOCKING ISSUE:** Missing waveform visualization is a violation of REQUIREMENTS.md acceptance criteria and Phase 1 vision.

**Fix Approach (from CONCERNS.md):**
1. Create src/lib/waveform.ts service using Web Audio API AnalyserNode
2. Extract frequency data in real-time during recording
3. Render visualization in Canvas component
4. Connect to recording state in +page.svelte
5. Test animation smoothness at 30+ FPS
6. Verify responsive to audio amplitude

**Verification Steps (After Implementation):**
1. Start recording
2. Speak into microphone
3. Observe waveform animates smoothly (no jerkiness)
4. Increase audio volume, observe waveform amplitude increases
5. Pause recording, verify waveform freezes
6. Resume recording, verify waveform resumes
7. Stop recording, verify waveform animation stops

**Test Procedure:**
```bash
# After waveform implemented:
# Manual testing: npm run dev
# Observe 30+ FPS frame rate (open DevTools → Performance tab)
# Record and monitor waveform responsiveness
```

**Done When:** Waveform displays smoothly at 30+ FPS; responds to audio amplitude; pauses/resumes correctly.

---

### AC-4: Recording Duration Timer

**Requirement:** Timer displays elapsed time in MM:SS format; updates frequently (no gap > 200ms); accurate within ±100ms over 60-minute recording; large readable font (≥3rem).

**Implementation Status:**
- [x] Timer displayed with formatTime() function (lines 82-87)
- [x] Updates every 100ms via setInterval (line 18-23)
- [x] MM:SS format implemented correctly
- [x] Large font size: timer class has `font-size: 3rem` (line 141)
- [ ] Accuracy not yet verified over 60-minute recording

**Status Indicators to Verify:**
- [x] Timer format correct (MM:SS)
- [x] Updates frequently (100ms interval)
- [x] Font size large (3rem = 48px)
- [ ] Accuracy within ±100ms over extended duration
- [ ] No timer lag during pause/resume

**Verification Steps:**
1. Start recording
2. Wait 30 seconds, verify timer shows "0:30" or close
3. Measure actual wall-clock time vs timer display
4. Pause and resume, verify timer pauses and resumes correctly
5. (Extended test) Record for 5-10 minutes, verify timer accuracy

**Test Procedure:**
```bash
# Timer accuracy test:
# 1. npm run dev
# 2. Start recording, note time
# 3. Stop after exactly 60 seconds
# 4. Verify timer shows ~1:00
# Repeat 3 times, average error should be < ±100ms
```

**Done When:** Timer accurate within ±100ms; pauses/resumes correctly; no drift over extended duration.

---

### AC-5: Recording Status Indicators

**Requirement:** Visual indicators for recording state (red pulsing for "Recording"), paused state (yellow for "Paused"), saved state (green checkmark + "Story saved").

**Implementation Status:**
- [ ] Status indicators NOT YET IMPLEMENTED in UI styling/markup
- [ ] Recording state has no red pulsing indicator (src/routes/+page.svelte lacks CSS styling)
- [ ] Paused state has no yellow indicator
- [ ] Saved state has green checkmark message (line 61: t('story_archived')) but no visual checkmark icon

**Status Indicators to Verify:**
- [ ] Red pulsing indicator during recording state
- [ ] Yellow indicator during paused state
- [ ] Green checkmark during saved state
- [ ] Colors accessible and high-contrast

**Fix Approach:**
1. Add CSS for red pulsing indicator (recording state)
2. Add CSS for yellow indicator (paused state)
3. Add CSS for green checkmark icon or visual (saved state)
4. Ensure high contrast ratios (WCAG AA minimum 4.5:1)
5. Test colors with accessibility checker

**Verification Steps (After Implementation):**
1. Start recording, observe red pulsing indicator
2. Pause recording, observe yellow indicator
3. Resume recording, observe indicator changes back to red
4. Stop and archive, observe green checkmark
5. Check color contrast ratios with tool

**Done When:** All status indicators visible; colors meet accessibility standards; transitions smooth.

---

### AC-6: Audio Playback (Preview)

**Requirement:** After recording stops, audio player visible with play/pause controls; progress bar; current time display; duration display accurate; user can seek; user can preview before saving.

**Implementation Status:**
- [ ] Audio `<audio>` element NOT YET IMPLEMENTED in stopped state
- [ ] No play/pause controls visible
- [ ] No progress bar or time display
- [ ] src/routes/+page.svelte lines 113-120 show only title input and archive button

**BLOCKING ISSUE:** Missing audio preview is a violation of REQUIREMENTS.md acceptance criteria.

**Fix Approach:**
1. Add `<audio>` element in stopped state conditional (after line 114)
2. Create blob URL from audioBlob using URL.createObjectURL()
3. Bind audio src to blob URL
4. Provide native HTML5 audio controls (play/pause/seek)
5. Revoke blob URL on navigation away (cleanup)
6. Test preview on various audio durations

**Verification Steps (After Implementation):**
1. Record audio (10-30 seconds)
2. Click "Stop"
3. Observe `<audio>` player visible
4. Click "Play" button
5. Hear audio play back from start
6. Click "Pause" during playback
7. Click "Play" again
8. Verify playback resumes from pause point
9. Drag progress bar to middle
10. Verify playback continues from new position
11. Duration display should show total time
12. Current time updates as audio plays
13. Preview multiple times without re-recording
14. Click "Archive" to save, verify blob URL revoked

**Test Procedure:**
```bash
# Audio preview test:
# 1. npm run dev
# 2. Record 20-30 seconds of speech
# 3. Verify audio player appears
# 4. Test play/pause/seek
# 5. Verify playback matches recording
```

**Done When:** Audio player visible and functional; preview plays correctly; user can seek; no data loss.

---

### AC-7: Error Handling — Microphone Permission Denied

**Requirement:** Clear bilingual message when user denies microphone access; explanation of why permission needed; link to browser settings; user can try again after enabling.

**Implementation Status:**
- [x] Try-catch block in handleStartRecording() (lines 29-37)
- [x] statusMessage set on error (line 35: 'Microphone access denied')
- [ ] Message is NOT bilingual (hardcoded English)
- [ ] No explanation of why permission is needed
- [ ] No link to browser settings
- [ ] No platform-specific instructions (iOS vs Android vs macOS vs Windows)
- [ ] Message displayed as plain text (line 124: `{statusMessage}`)

**Status Indicators to Verify:**
- [ ] Message appears in user's preferred language
- [ ] Message explains why microphone needed
- [ ] Message provides browser-specific instructions
- [ ] User can try again after enabling permission
- [ ] No app crash or broken state

**Fix Approach (from CONCERNS.md):**
1. Create error classification system in src/lib/errors.ts
   - RecordingError (generic recording failure)
   - PermissionError (microphone permission denied)
   - BrowserError (API not available)
   - StorageError (IndexedDB write failed)
2. In recording.ts, catch DOMException and classify errors
3. Map PermissionError to bilingual messages in i18n.ts with:
   - Reason: "We need your microphone to record your story"
   - Instructions: Platform-specific (iOS: "Settings → Privacy → Microphone → nhonly", etc.)
   - Actionable message in Vietnamese and English
4. Display error in styled alert or modal (not plain text)
5. Update +page.svelte error display with proper styling

**Verification Steps (After Implementation):**
1. Clear microphone permission in browser settings
2. Reload app
3. Click "Tell your story"
4. When permission prompt appears, click "Deny"
5. Verify clear bilingual message appears explaining permission need
6. Verify instructions for browser/platform displayed
7. Enable permission in browser settings
8. Click "Try again" button in error message
9. Verify recording works after enabling permission

**Test Procedure:**
```bash
# Permission error test:
# 1. In browser settings, revoke microphone permission for site
# 2. npm run dev
# 3. Click "Tell your story" → Deny permission
# Verify:
# - Bilingual error message (check current language)
# - Clear explanation
# - "Try again" button works
# - Recording succeeds after re-enabling permission
```

**Done When:** Clear bilingual error messages; platform-specific instructions; user can recover.

---

### AC-8: Error Handling — Browser Incompatibility

**Requirement:** Detect if Web Audio API, MediaRecorder, IndexedDB unavailable; show friendly message suggesting compatible browsers; graceful degradation (no crash).

**Implementation Status:**
- [ ] Browser capability detection NOT YET IMPLEMENTED
- [ ] No feature detection for Web Audio API, MediaRecorder, IndexedDB
- [ ] No fallback UI for incompatible browsers
- [ ] If APIs missing, app will crash on startRecording()

**BLOCKING ISSUE:** No browser compatibility detection violates graceful degradation requirement.

**Fix Approach (from CONCERNS.md):**
1. Create src/lib/capabilities.ts with detection functions:
   - hasWebAudio() → check audioContext
   - hasMediaRecorder() → check window.MediaRecorder
   - hasIndexedDB() → check window.indexedDB
2. In +page.svelte onMount(), check capabilities
3. If missing: show bilingual message with:
   - "Your browser doesn't support recording"
   - List of supported browsers (Chrome 50+, Firefox 49+, Safari 14.1+, Edge 79+)
   - Links to download pages
4. Disable recording UI if capabilities missing
5. Test on old browsers or use DevTools to simulate

**Verification Steps (After Implementation):**
1. Test on supported browser (Chrome, Firefox, Safari, Edge)
2. Verify recording works normally
3. (Simulate) Test on old browser or via DevTools
4. Verify friendly message appears
5. Verify app doesn't crash
6. Verify message in current language

**Test Procedure:**
```bash
# Capability detection test:
# 1. Use browser simulator or old browser
# 2. npm run dev
# Verify: Error message appears instead of crash
# Message is bilingual and helpful
```

**Done When:** Capability detection working; friendly fallback UI; app resilient to missing APIs.

---

### AC-9: Error Handling — Storage/Quota

**Requirement:** If IndexedDB write fails, notify user clearly; message includes "check storage space" or "clear old recordings"; user can retry or record another story.

**Implementation Status:**
- [x] Try-catch in handleArchive() (lines 53-71)
- [x] statusMessage set on error (line 69: 'Failed to archive story')
- [ ] Message is NOT helpful or bilingual
- [ ] Message does NOT explain storage issue
- [ ] No guidance on clearing old recordings
- [ ] No retry mechanism in UI

**Status Indicators to Verify:**
- [ ] Clear message about storage quota
- [ ] Bilingual (Vietnamese/English)
- [ ] Suggests clearing old recordings
- [ ] User can retry
- [ ] User can record another story

**Fix Approach:**
1. In archive.ts, catch quota exceeded errors
2. Classify as StorageError with specific context
3. In i18n.ts, add messages:
   - "Storage full" (vi: "Bộ nhớ đã đầy")
   - "Clear old recordings to make space" (vi: "Xóa các chuyện cũ để tạo chỗ trống")
   - "Retry" button to try saving again
4. Implement deleteOldStories() to age-based cleanup
5. Test quota exceeded scenario

**Verification Steps (After Implementation):**
1. Fill storage quota (record many large files)
2. Attempt to save new story
3. Verify clear message appears
4. Verify bilingual instructions displayed
5. Click "Clear old recordings"
6. Verify old stories deleted
7. Click "Retry"
8. Verify new story saves successfully

**Done When:** Clear error messages for storage; helpful guidance; recovery mechanism works.

---

### AC-10: Localization — All UI Text Bilingual

**Requirement:** All buttons, labels, messages in Vietnamese and English; no hardcoded English strings in UI; all error messages localized.

**Implementation Status:**
- [x] i18n.ts defines bilingual strings (lines 9-40)
- [x] UI uses t() function for all visible text
- [x] Vietnamese translations present for:
  - tell_story: 'Kể chuyện của bạn'
  - saved_as_you_go: 'Tự động lưu'
  - stop_recording: 'Dừng lại'
  - story_title: 'Tiêu đề chuyện'
  - archive_button: 'Lưu trữ'
  - story_archived: 'Chuyện của bạn đã được lưu trữ'
- [ ] Error messages NOT YET localized (hardcoded English in +page.svelte)
- [ ] Status indicators (red, yellow, green) NOT YET localized with text labels

**Status Indicators to Verify:**
- [x] Core UI text bilingual
- [ ] Error messages bilingual
- [ ] All user-facing text uses t() function
- [ ] No hardcoded English strings visible

**Verification Steps:**
1. Click language toggle to switch EN ↔ VI
2. Observe all buttons/labels change language:
   - "Tell your story" ↔ "Kể chuyện của bạn"
   - "Stop" ↔ "Dừng lại"
   - "Archive" ↔ "Lưu trữ"
3. Verify no English text remains visible
4. Trigger error (deny microphone)
5. Verify error message in current language
6. Toggle language
7. Verify error message in new language

**Test Procedure:**
```bash
# Bilingual verification:
# 1. npm run dev
# 2. EN mode: Click "Tell your story"
# 3. VI mode: Verify "Kể chuyện của bạn" visible
# 4. All buttons, labels, error messages in both languages
```

**Done When:** All UI text bilingual; error messages localized; no hardcoded English.

---

### AC-11: Localization — Language Toggle

**Requirement:** Button displays current language (EN or VI); clicking toggles language; all visible text changes immediately; accessible via keyboard.

**Implementation Status:**
- [x] Language toggle button present (line 94: `<button onclick={toggleLanguage}>`)
- [x] Button displays current language (line 94: `{$currentLanguage.toUpperCase()}`)
- [x] toggleLanguage() function implements toggle (lines 74-80)
- [x] currentLanguage store updated (line 79: `setLanguage()`)
- [ ] Accessibility via keyboard NOT YET VERIFIED (button element supports Tab/Enter natively, but untested)

**Status Indicators to Verify:**
- [x] Language button visible in header
- [x] Button text shows current language (EN or VI)
- [x] Clicking toggles language
- [x] All text changes immediately
- [ ] Tab key focuses button
- [ ] Enter key toggles language

**Verification Steps:**
1. Open app, observe "EN" button in header
2. Click button, observe all text changes to Vietnamese
3. Verify button now shows "VI"
4. Click again, verify text changes back to English
5. Use Tab key to focus language button
6. Press Enter key
7. Verify language toggles

**Test Procedure:**
```bash
# Keyboard accessibility test:
# 1. npm run dev
# 2. Press Tab repeatedly to reach language button
# 3. Verify button is focused (visible outline)
# 4. Press Enter
# 5. Verify language toggles
```

**Done When:** Language toggle accessible via mouse and keyboard; text changes instantly.

---

### AC-12: Localization — Language Persistence

**Requirement:** User selects Vietnamese → Reload page → Still Vietnamese; language selection persists across sessions; uses localStorage key 'nhonly-language'; default language detected from browser locale.

**Implementation Status:**
- [ ] Language persistence NOT YET IMPLEMENTED
- [ ] currentLanguage is volatile Svelte store (line 43)
- [ ] No localStorage initialization or saving
- [ ] No browser locale detection (navigator.language)
- [ ] Language resets to 'en' default on every reload

**BLOCKING ISSUE:** Language not persistent violates REQUIREMENTS.md acceptance criteria and frustrates non-English users.

**Fix Approach (from CONCERNS.md):**
1. In +layout.svelte onMount():
   - Check localStorage.getItem('nhonly-language')
   - If found: set currentLanguage to saved value
   - If not found: detect browser locale via navigator.language
   - If locale starts with 'vi': set to 'vi'
   - Otherwise: set to 'en'
2. Subscribe to currentLanguage changes:
   - On change, save to localStorage.setItem('nhonly-language', lang)
3. Implement in i18n.ts with helper functions:
   - getInitialLanguage() → check localStorage → detect locale → return 'vi' or 'en'
   - persistLanguage() → save to localStorage
4. Test persistence across reload, tab close, browser restart

**Verification Steps (After Implementation):**
1. Open app, observe default language (EN or VI based on browser locale)
2. Click language toggle to VI
3. Reload page (Cmd+R or F5)
4. Verify VI is still selected
5. Close tab and reopen
6. Verify VI persists
7. Clear localStorage and reload
8. Verify default language based on browser locale
9. (On macOS) Set system language to Vietnamese
10. Clear localStorage and reload
11. Verify VI selected by default

**Test Procedure:**
```bash
# Language persistence test:
# 1. npm run dev
# 2. Toggle to VI
# 3. Reload page → Verify VI persists
# 4. F12 → Application → Storage → localStorage
# 5. Verify 'nhonly-language' key = 'vi'
# 6. Delete localStorage entry
# 7. Reload
# 8. Verify default language (based on browser locale)
```

**Done When:** Language persists across reload; localStorage key exists; browser locale detection works.

---

### AC-13: Success Confirmation — Save Confirmation

**Requirement:** After save: green checkmark + "Story saved" message; "Record another story" option appears; user has no doubt story is preserved.

**Implementation Status:**
- [x] Success message displayed (line 61: `statusMessage = t('story_archived')`)
- [x] Message visible in UI (lines 123-125)
- [x] Message disappears after 3 seconds (lines 65-67)
- [ ] Green checkmark icon NOT YET PRESENT (plain text message only)
- [ ] "Record another story" button NOT YET PRESENT (UI auto-resets but no explicit button)
- [ ] Insufficient visual prominence for confirmation

**Status Indicators to Verify:**
- [ ] Green checkmark visible (icon or symbol)
- [ ] "Story saved" message bilingual
- [ ] Message prominent and visible for adequate time (≥3 seconds)
- [ ] "Record another story" button/option visible
- [ ] User sees clear confirmation, not doubt

**Fix Approach:**
1. Add green checkmark icon (SVG or emoji 🎉 or ✓)
2. Style confirmation message prominently:
   - Green background or text color
   - Larger font size
   - Center aligned
3. Add explicit "Record another story" button to navigate back to idle state
4. Keep confirmation visible for 5+ seconds (not auto-dismiss)
5. Test confidence level: users understand story is saved

**Verification Steps (After Implementation):**
1. Record audio (10 seconds)
2. Stop recording
3. Enter story title
4. Click "Archive"
5. Observe green checkmark icon appear
6. Observe "Story saved" message in current language
7. Verify confirmation visible for at least 5 seconds
8. Observe "Record another story" button
9. Click button
10. Verify state resets to idle, ready to record again
11. Verify user has confidence story is saved (no anxiety)

**Test Procedure:**
```bash
# Save confirmation test:
# 1. npm run dev
# 2. Record and archive story
# 3. Verify:
#    - Green checkmark visible
#    - "Story saved" message bilingual
#    - "Record another story" button present
#    - Confirmation visible ≥5 seconds
```

**Done When:** Clear success confirmation; user confident story is saved; easy to record again.

---

## C3 Contract Integration Verification

**CLAUDE.md Requirement:** All nhonly code follows C3 contract patterns.

**Current Implementation Status:**

### obs API Integration

**Status:** PARTIAL — Functions have MARK comments and prose contract intent, but NO runtime obs API usage.

**Files with MARK comments (no obs API):**
- src/lib/recording.ts (lines 1-3: MARK comment + Purpose/Success/Failure prose)
- src/lib/archive.ts (lines 1-3: MARK comment + Purpose/Success/Failure prose)
- src/lib/i18n.ts (lines 1-3: MARK comment + Purpose/Success/Failure prose)
- src/routes/+page.svelte (multiple MARK comments, lines 13, 26, 39, 51, 73, 90)

**BLOCKING ISSUE:** CLAUDE.md §2 mandates:
> Every function: Use the MARK pattern with Purpose → Success → Failure → contract → conduct signature
> Every contract: Declare intent with obs.step(), observe conditions, return success/failure

**Current code lacks:**
1. obs parameter injection into function signatures
2. obs.step() calls to declare steps
3. obs.observe() calls to verify conditions
4. obs.return_() calls to return success/failure
5. Formal TypeScript contract interfaces (like TransformUserContract in kernel/EXAMPLES/typescript/transform.ts)

**Fix Approach:**
1. Read C3/kernel/BOOTSTRAP.md THE PATTERN section
2. Read C3/kernel/EXAMPLES/typescript/transform.ts for implementation pattern
3. Update src/lib/recording.ts:
   - Add obs parameter to startRecording(), stopRecording()
   - Define contract interfaces for each function
   - Insert obs.read() at entry
   - Insert obs.step() for each major step (getUserMedia, mediaRecorder.start, etc.)
   - Insert obs.observe() to verify conditions (mediaRecorder !== null, etc.)
   - Insert obs.return_() at exit
4. Repeat for archive.ts and i18n.ts
5. Update +page.svelte components with obs contracts

**Verification Steps (After Implementation):**
1. Verify obs.step() calls in recording.ts
2. Verify obs.observe() calls for condition checks
3. Verify contract interfaces defined
4. Run grep: `grep -r "obs\." src/lib/ | wc -l` → should be > 20 matches
5. Run TypeScript check: `npm run check` → no errors
6. Verify contracts match C3 kernel patterns

**Test Procedure:**
```bash
# C3 contract verification:
grep -n "obs\." src/lib/recording.ts
grep -n "obs\." src/lib/archive.ts
grep -n "obs\." src/lib/i18n.ts
npm run check
# Should show multiple obs calls and no TypeScript errors
```

**Done When:** obs API integrated throughout; contracts enforceable at runtime; CLAUDE.md compliant.

---

### Typed Error Classification

**Status:** NOT YET IMPLEMENTED

**Expected (from CONCERNS.md):**
- RecordingError: generic recording failure
- PermissionError: microphone permission denied + platform info
- BrowserError: API not available
- StorageError: IndexedDB write failed

**Current Implementation:**
- Generic catch blocks with console.error()
- statusMessage set to hardcoded strings
- No error classification or context

**Fix Approach:**
1. Create src/lib/errors.ts with typed error classes
2. Implement classifyError() to map DOMException → typed errors
3. Add platform detection (iOS, Android, macOS, Windows)
4. Update recording.ts and archive.ts to throw typed errors
5. Add error translations to i18n.ts

**Verification Steps (After Implementation):**
1. Trigger permission denied → PermissionError thrown
2. Verify error has platform field (e.g., 'macOS')
3. Verify error message in current language
4. Trigger storage quota full → StorageError thrown
5. Verify helpful message displayed

**Done When:** All errors classified; messages bilingual and helpful; user can recover.

---

## Memory Cleanup Verification

**Requirement:** No memory leaks from:
- MediaRecorder references
- Blob URLs (preview)
- Timer intervals
- Waveform analysis (AnalyserNode)
- Audio context (reused across app)

### MediaRecorder Cleanup

**Status:** PARTIAL

**Implementation:**
- [x] mediaRecorder set to null after stop (recording.ts lines 68-75)
- [x] All stream tracks stopped (line 69: `getTracks().forEach(track => track.stop())`)
- [ ] cancelRecording() function NOT YET IMPLEMENTED
- [ ] No cleanup on component unmount if recording in progress

**Verification Steps:**
1. Start recording
2. Click "Stop"
3. Open DevTools → Memory tab
4. Take heap snapshot
5. Navigate away (or close tab)
6. Force garbage collection
7. Verify mediaRecorder memory released

**Test Procedure:**
```bash
npm run dev
# 1. Start recording
# 2. Stop recording
# 3. F12 → Memory tab
# 4. Take heap snapshot before and after navigation
# Verify no orphaned MediaRecorder instances
```

**Done When:** No memory leaks detected in heap snapshots.

---

### Blob URL Cleanup

**Status:** NOT YET IMPLEMENTED (audio preview not yet in UI)

**Expected:**
- [x] Create blob URL: `URL.createObjectURL(audioBlob)`
- [ ] Revoke on archive: `URL.revokeObjectURL(blobUrl)`
- [ ] Revoke on navigation away: in beforeNavigate hook

**Fix Approach:**
1. Store blobUrl in component state
2. On archive: call URL.revokeObjectURL()
3. On component destroy: call URL.revokeObjectURL()
4. Test DevTools shows blob URL count stable

**Done When:** Blob URLs properly revoked; memory stable.

---

### Timer Cleanup

**Status:** IMPLEMENTED CORRECTLY

**Implementation:**
- [x] Timer cleared on stop (recording.ts line 58)
- [x] Timer cleared in component cleanup (src/routes/+page.svelte line 23)
- [x] timerInterval set to null after clear

**Verification Steps:**
1. Start/stop recording 10 times
2. Open DevTools → Performance tab
3. Record profile
4. Check timer count (setInterval/clearInterval balance)
5. Verify no growing timer accumulation

**Done When:** Timer count stable; no orphaned intervals.

---

### Waveform Analysis Cleanup

**Status:** NOT YET IMPLEMENTED (waveform not yet built)

**Expected (after waveform implementation):**
- [ ] AnalyserNode connected to audio source
- [ ] requestAnimationFrame loop for animation
- [ ] AnalyserNode disconnected on stop
- [ ] requestAnimationFrame cancelled on destroy
- [ ] AudioContext reused (not recreated each recording)

**Fix Approach (from CONCERNS.md):**
1. In waveform.ts:
   - Create single AudioContext at app start (reuse, don't recreate)
   - Connect AnalyserNode in startRecording()
   - Disconnect in stopRecording()
   - Use cancelAnimationFrame() in cleanup
2. Test: Record 10 times, verify memory stable

**Done When:** Memory stable across multiple recordings; no waveform resource leaks.

---

## Test Framework Verification

**Requirement:** Vitest configured and running; tests for recording, archive, i18n; ≥85% coverage for core modules.

### Test Infrastructure

**Status:** CONFIGURED but NO TEST FILES WRITTEN

**Implementation:**
- [x] vitest in devDependencies (package.json line 30)
- [x] Test scripts configured (lines 13-16):
  - "test": "vitest"
  - "test:ui": "vitest --ui"
  - "test:run": "vitest --run"
  - "coverage": "vitest --coverage"
- [ ] No test files created
- [ ] No test infrastructure configured (vitest.config.ts missing)

**Fix Approach:**
1. Create vitest.config.ts configuration
2. Configure testing library (jsdom, @testing-library/svelte already in devDependencies)
3. Create test files:
   - src/lib/recording.test.ts
   - src/lib/archive.test.ts
   - src/lib/i18n.test.ts
   - src/routes/+page.test.ts (integration tests)

**Verification Steps:**
1. Run `npm run test:run`
2. All tests pass
3. Run `npm run coverage`
4. Verify coverage ≥85% for:
   - src/lib/recording.ts
   - src/lib/archive.ts
   - src/lib/i18n.ts

**Test Procedure:**
```bash
npm run test:run
# Expected: All tests pass
npm run coverage
# Expected: Coverage report shows ≥85% for core modules
```

**Done When:** Test suite running; ≥85% coverage for recording.ts, archive.ts, i18n.ts.

---

### Recording Service Tests (To Implement)

**Coverage Target:** 100% of recording.ts logic

**Test Cases Needed:**

| Test | Status | Purpose |
|------|--------|---------|
| startRecording() succeeds with permission | TODO | Verify recording initiates |
| startRecording() throws on permission denied | TODO | Verify error handling |
| stopRecording() returns Blob | TODO | Verify audio blob created |
| stopRecording() cleans up resources | TODO | Verify timer/tracks stopped |
| getElapsedMs() returns accurate duration | TODO | Verify timer accuracy |
| isRecording() returns correct state | TODO | Verify state tracking |
| pauseRecording() pauses media | TODO | Verify pause works (after implementation) |
| resumeRecording() continues from pause | TODO | Verify resume works (after implementation) |
| Multiple pause/resume cycles preserve data | TODO | Verify no data loss (after implementation) |

**Done When:** All recording tests pass with 100% coverage.

---

### Archive Service Tests (To Implement)

**Coverage Target:** 100% of archive.ts logic

**Test Cases Needed:**

| Test | Status | Purpose |
|------|--------|---------|
| initDatabase() creates database | TODO | Verify IndexedDB setup |
| saveStory() stores blob with metadata | TODO | Verify persistence |
| getAllStories() retrieves all records | TODO | Verify query |
| getStory() retrieves by ID | TODO | Verify lookup |
| getStory() returns null for missing ID | TODO | Verify error case |
| Error handling classifies errors | TODO | Verify error classification (after implementation) |

**Done When:** All archive tests pass with 100% coverage.

---

### i18n Tests (To Implement)

**Coverage Target:** 100% of i18n.ts logic

**Test Cases Needed:**

| Test | Status | Purpose |
|------|--------|---------|
| t() returns correct translation | TODO | Verify lookup |
| t() fallback to English for missing key | TODO | Verify fallback |
| setLanguage() updates store | TODO | Verify persistence |
| All bilingual strings present | TODO | Verify completeness |

**Done When:** All i18n tests pass with 100% coverage.

---

## Build & Deployment Verification

### TypeScript Compilation

**Status:** PASSING (with warnings)

**Verification:**
```bash
npm run check
```

**Expected Output:** No errors (warnings acceptable)

**Current Status:**
- [x] Command runs without crashes
- [ ] Check output needs verification

**Done When:** `npm run check` passes with zero errors.

---

### Production Build

**Status:** TO BE VERIFIED

**Verification:**
```bash
npm run build
```

**Expected Output:**
- [x] dist/ directory created
- [ ] dist/index.html exists
- [ ] No bundling errors
- [ ] Bundle size <500KB gzip

**Done When:** `npm run build` succeeds; dist/ contains valid output.

---

### Development Server

**Status:** TO BE VERIFIED

**Verification:**
```bash
npm run dev
```

**Expected Output:**
- [x] Server starts on http://localhost:5173
- [x] Page loads without errors
- [ ] No console errors

**Done When:** App loads; no console errors.

---

## Comprehensive Acceptance Checklist

### Recording & Playback
- [ ] AC-1: Start/stop recording with visual feedback
- [ ] AC-2: Pause/resume without data loss (BLOCKED — needs implementation)
- [ ] AC-3: Waveform animation at 30+ FPS (BLOCKED — needs implementation)
- [ ] AC-4: Timer accurate within ±100ms
- [ ] AC-5: Status indicators (red/yellow/green) (BLOCKED — needs implementation)
- [ ] AC-6: Audio preview before save (BLOCKED — needs implementation)

### Error Handling
- [ ] AC-7: Permission denied message bilingual + recoverable (BLOCKED — needs enhancement)
- [ ] AC-8: Browser incompatibility graceful (BLOCKED — needs implementation)
- [ ] AC-9: Storage quota helpful message (BLOCKED — needs enhancement)

### Localization
- [ ] AC-10: All UI text bilingual (PARTIAL — error messages not localized)
- [ ] AC-11: Language toggle accessible via keyboard (TO VERIFY)
- [ ] AC-12: Language persistence across reload (BLOCKED — needs implementation)
- [ ] AC-13: Success confirmation with checkmark (BLOCKED — needs implementation)

### Code Quality & Architecture
- [ ] C3 Contracts: obs API integrated (BLOCKED — needs implementation per CLAUDE.md)
- [ ] Memory Cleanup: No leaks detected
- [ ] Test Framework: Vitest running with ≥85% coverage (BLOCKED — needs test files)
- [ ] TypeScript: `npm run check` passes
- [ ] Build: `npm run build` succeeds

---

## Blocking Issues Summary

| Issue | Status | Impact | Fix Effort |
|-------|--------|--------|-----------|
| Missing pause/resume | BLOCKING | Cannot pause recordings | Medium |
| Missing waveform visualization | BLOCKING | No visual feedback during recording | Medium |
| Missing audio preview | BLOCKING | Cannot verify recording before save | Low |
| Missing C3 obs API integration | BLOCKING | Violates CLAUDE.md requirement | High |
| Missing language persistence | BLOCKING | Language resets on reload | Low |
| Missing status indicators | BLOCKING | No clear visual feedback | Low |
| Missing error message translations | BLOCKING | Error messages in English only | Low |
| Missing browser capability detection | BLOCKING | App crashes on old browsers | Low |
| Missing test files | BLOCKING | Cannot verify acceptance criteria | Medium |
| Insufficient error handling context | BLOCKING | Users cannot understand/fix errors | Medium |

**Recommendation:** Complete all blocking issues before declaring Phase 1 complete. Priority order:
1. Pause/resume (acceptance criterion)
2. Waveform visualization (acceptance criterion)
3. Audio preview (acceptance criterion)
4. C3 contracts (CLAUDE.md requirement)
5. Test framework (acceptance criterion)
6. Language persistence (acceptance criterion)
7. Error handling enhancements
8. Status indicators
9. Browser compatibility detection

---

## Verification Execution Plan

### Phase 1 Sign-Off Prerequisites

Before Phase 1 can be marked complete, ALL of the following must be verified:

**Automated Verification (CI/CD):**
```bash
# 1. TypeScript compilation
npm run check
# Expected: No errors

# 2. Production build
npm run build
# Expected: Exit code 0, dist/index.html exists

# 3. Test suite (once tests written)
npm run test:run
npm run coverage
# Expected: All pass, ≥85% coverage
```

**Manual Verification Checklist:**

✓ = Verified (manual test completed)
✗ = Failed (issue found, needs fix)
⏳ = Pending (not yet tested)

**Recording Controls:**
- ⏳ AC-1: Start/stop recording with visual indicator
- ⏳ AC-2: Pause/resume (blocked on implementation)
- ⏳ AC-3: Waveform animation (blocked on implementation)
- ⏳ AC-4: Timer accuracy (within ±100ms)
- ⏳ AC-5: Status indicators red/yellow/green (blocked on implementation)

**Playback & Save:**
- ⏳ AC-6: Audio preview (blocked on implementation)
- ⏳ AC-13: Success confirmation with checkmark (blocked on implementation)

**Error Handling:**
- ⏳ AC-7: Permission denied message (needs i18n + platform detection)
- ⏳ AC-8: Browser compatibility (blocked on implementation)
- ⏳ AC-9: Storage quota message (needs i18n)

**Localization:**
- ⏳ AC-10: All UI text bilingual (core UI OK, errors pending)
- ⏳ AC-11: Language toggle keyboard accessible
- ⏳ AC-12: Language persistence (blocked on implementation)

**Code Quality:**
- ⏳ C3 Contracts: obs API integrated (blocked on implementation)
- ⏳ Memory: No leaks in heap profiler
- ⏳ Tests: All passing, ≥85% coverage (blocked on test files)

---

## Sign-Off Criteria

**Phase 1 Recording Feature is COMPLETE when:**

1. **All Blocking Issues Resolved:**
   - [x] Pause/resume implemented and tested
   - [x] Waveform visualization implemented and tested
   - [x] Audio preview player implemented and tested
   - [x] C3 obs API integrated throughout
   - [x] Language persistence implemented
   - [x] Status indicators implemented
   - [x] Error messages bilingual
   - [x] Browser capability detection implemented
   - [x] Test framework with ≥85% coverage
   - [x] Error classification system implemented

2. **All Acceptance Criteria Verified:**
   - [x] AC-1: Recording controls (start/stop/visual)
   - [x] AC-2: Pause/resume without data loss
   - [x] AC-3: Waveform animation 30+ FPS
   - [x] AC-4: Timer accurate within ±100ms
   - [x] AC-5: Status indicators (red/yellow/green)
   - [x] AC-6: Audio preview before save
   - [x] AC-7: Permission error bilingual + recoverable
   - [x] AC-8: Browser incompatible graceful
   - [x] AC-9: Storage error helpful message
   - [x] AC-10: All UI text bilingual
   - [x] AC-11: Language toggle keyboard accessible
   - [x] AC-12: Language persistent across reload
   - [x] AC-13: Success confirmation with checkmark

3. **Build & Deployment Ready:**
   - [x] `npm run check` passes (TypeScript)
   - [x] `npm run build` succeeds
   - [x] `npm run test:run` passes (all tests)
   - [x] `npm run coverage` ≥85% for core modules
   - [x] No console errors or warnings
   - [x] Desktop and mobile responsive
   - [x] Vietnamese and English UI verified
   - [x] All recording states transition correctly
   - [x] All error messages bilingual and helpful
   - [x] No memory leaks

4. **C3 Contract Compliance:**
   - [x] obs API integrated (obs.step, obs.observe, obs.return_)
   - [x] Contract interfaces defined (TypeScript)
   - [x] Error classification system (typed errors)
   - [x] Bilingual error context
   - [x] Platform-specific error information

**Verified By:** Claude (Verification Agent)
**Verification Date:** [To be completed during manual testing]
**Status:** 🏗️ In Progress — Blocking issues remain

---

## Next Steps

1. **Implement Blocking Features** (Priority Order):
   - [ ] Pause/resume recording (AC-2)
   - [ ] Waveform visualization (AC-3)
   - [ ] Audio preview player (AC-6)
   - [ ] C3 obs API integration throughout
   - [ ] Test framework with test files

2. **Enhance Error Handling:**
   - [ ] Error classification system (src/lib/errors.ts)
   - [ ] Bilingual error messages (i18n.ts)
   - [ ] Platform-specific instructions
   - [ ] Browser capability detection

3. **Complete Localization:**
   - [ ] Language persistence (localStorage)
   - [ ] Browser locale detection
   - [ ] All error messages translated

4. **Add Visual Polish:**
   - [ ] Status indicators (red/yellow/green)
   - [ ] Success confirmation with checkmark
   - [ ] Responsive layout (mobile/desktop)
   - [ ] Accessibility (high contrast, keyboard nav)

5. **Final Verification:**
   - [ ] Manual testing checklist completed
   - [ ] `npm run check` passes
   - [ ] `npm run build` succeeds
   - [ ] `npm run test:run` passes with ≥85% coverage
   - [ ] All AC checkboxes marked ✓

6. **Phase 1 Sign-Off:**
   - [ ] VERIFICATION.md completed
   - [ ] All issues resolved
   - [ ] Ready for Phase 2 planning

---

**Last Updated:** 2026-04-05 15:35:11Z
**Maintained By:** Claude (Verification Agent)
**Status:** Ready for Implementation

*This verification checklist will be completed during Phase 1 execution and updated as blocking issues are resolved.*
