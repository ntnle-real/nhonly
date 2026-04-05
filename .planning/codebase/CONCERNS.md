# Technical Debt & Concerns

## Critical Issues (Must Fix Before MVP Release)

### 1. No Error Recovery for Recording Failures
**Severity:** High
**Location:** `src/lib/recording.ts`, `src/routes/+page.svelte`

**Issue:**
- If `startRecording()` fails, state stays `idle` but might be partially initialized
- If `stopRecording()` fails, mediaRecorder might be stuck in invalid state
- Multiple rapid clicks could create race conditions

**Risk:** User stuck in recording state, unable to recover without page refresh

**Fix:**
```typescript
// Add explicit cleanup on failure
export async function startRecording(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // ... setup
  } catch (error) {
    // Cleanup on failure
    if (mediaRecorder) {
      mediaRecorder = null;
    }
    throw error;
  }
}

// Debounce button clicks to prevent race conditions
let isProcessing = false;
async function handleStartRecording() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    await startRecording();
    recordingState = 'recording';
  } catch (error) {
    statusMessage = 'Microphone access denied';
  } finally {
    isProcessing = false;
  }
}
```

### 2. HTTPS Requirement for Microphone Access
**Severity:** High (Production)
**Location:** Web Audio API usage

**Issue:**
- `getUserMedia()` requires HTTPS in production
- Works on localhost in development only
- Will silently fail on HTTP URLs
- No clear error message to users

**Risk:** App non-functional when deployed to production without HTTPS

**Fix:**
- Ensure production deployment uses HTTPS
- Add feature detection and graceful fallback:
```typescript
if (window.isSecureContext) {
  // Safe to ask for microphone
} else {
  // Show error: "This app requires HTTPS"
}
```

### 3. Missing Audio Format Validation
**Severity:** Medium
**Location:** `src/lib/recording.ts`

**Issue:**
- Audio recorded as WAV blob type, but actual format depends on browser
- Some browsers might produce different codecs
- No validation that audio is actually valid

**Risk:** Corrupted audio files, playback failures on some browsers

**Fix:**
- Add audio validation before archiving
- Test playback before confirming save
```typescript
// Validate audio blob before returning
const audio = new Audio();
audio.onloadedmetadata = () => {
  // Valid audio
};
audio.onerror = () => {
  // Invalid audio
};
audio.src = URL.createObjectURL(audioBlob);
```

## Important Issues (Should Fix in v1)

### 4. No Test Coverage
**Severity:** Medium
**Location:** All services and components

**Issue:**
- Zero automated tests
- All validation manual/exploratory
- Regressions undetected

**Risk:** Breaking changes deployed unknowingly

**Fix:**
- Add unit tests for services (recording, archive, i18n)
- Add integration tests for component flows
- Target 80%+ code coverage
- Add to CI/CD pipeline

### 5. Language Selection Not Persistent
**Severity:** Low
**Location:** `src/lib/i18n.ts`, `src/routes/+page.svelte`

**Issue:**
- Language stored in Svelte store (session-only)
- Reloading page resets to English
- Stories are saved but language preference isn't

**Risk:** Poor UX for non-English speakers (must reset language every session)

**Fix:**
- Persist language to localStorage:
```typescript
// i18n.ts
function initLanguage() {
  const saved = localStorage.getItem('language') as Language || 'en';
  currentLanguage.set(saved);
}

export function setLanguage(lang: Language) {
  currentLanguage.set(lang);
  localStorage.setItem('language', lang);
}
```

### 6. No Input Validation
**Severity:** Low
**Location:** `src/routes/+page.svelte`

**Issue:**
- Story title accepts empty strings (checked at validation time, not input time)
- No max length on title
- No XSS protection (though title isn't rendered as HTML)

**Risk:** Confusing archives with empty titles, potential HTML injection

**Fix:**
- Add input validation:
```svelte
<input
  type="text"
  bind:value={storyTitle}
  maxlength="100"
  placeholder={t('story_title')}
/>

// In handler
if (!storyTitle.trim()) {
  statusMessage = 'Title cannot be empty';
  return;
}
```

### 7. No Data Export/Backup
**Severity:** Medium
**Location:** Archive service, no export mechanism

**Issue:**
- Stories only stored in browser IndexedDB
- No way to export or backup data
- IndexedDB can be cleared by browser (cache clearing, etc.)
- No way to move data between devices/browsers

**Risk:** Users lose valuable recordings

**Fix:**
- Add story export (download as audio files or JSON)
- Consider cloud backup option
```typescript
export async function exportStories(): Promise<Blob> {
  const stories = await getAllStories();
  // Create ZIP file with all audio files
  // Return as downloadable blob
}

export async function importStories(zip: Blob): Promise<void> {
  // Extract audio files from ZIP
  // Reimport to IndexedDB
}
```

## Minor Issues (Nice-to-Have Improvements)

### 8. No Playback Functionality
**Severity:** Low
**Location:** Archive service, not exposed in UI

**Issue:**
- Audio is recorded and stored but no playback UI
- `getAllStories()` and `getStory()` exist but aren't used
- Users can't review what they recorded

**Risk:** Users don't know if recording worked properly

**Fix:**
- Add story archive/playback page
- List saved stories with audio players
- Allow deletion of stories

### 9. Monolithic Component Structure
**Severity:** Low
**Location:** `src/routes/+page.svelte`

**Issue:**
- All UI logic in one 163-line component
- Hard to test individual features
- Difficult to add new routes

**Risk:** Code becomes harder to maintain as features grow

**Fix:**
- Break into smaller components:
  - `<RecordingButton />`
  - `<RecordingTimer />`
  - `<StoryForm />`
  - `<StorageList />`

### 10. No Accessibility (a11y) Considerations
**Severity:** Low
**Location:** All components

**Issue:**
- No ARIA labels
- No keyboard navigation
- No focus management
- Color contrast not verified
- No screen reader support

**Risk:** App unusable for users with disabilities

**Fix:**
- Add semantic HTML: `<button>`, `<form>`, `<input>`
- Add ARIA labels where needed
- Implement keyboard navigation (Tab key)
- Test with screen readers (NVDA, JAWS)
- Verify color contrast (WCAG AA standard)

### 11. Missing Favicon
**Severity:** Trivial
**Location:** `src/routes/+layout.svelte` references `src/lib/assets/favicon.svg` which doesn't exist

**Issue:**
- Favicon referenced but file not present
- Browser will 404 on favicon request
- No error, but messy dev experience

**Fix:**
- Create `src/lib/assets/favicon.svg` or remove reference

### 12. No Loading States
**Severity:** Low
**Location:** `src/routes/+page.svelte`

**Issue:**
- No visual feedback during async operations
- User doesn't know if recording is initializing
- Archive operation appears instant but involves I/O

**Risk:** Users might click again if no feedback received

**Fix:**
- Add loading state:
```typescript
let isLoading = $state(false);

async function handleStartRecording() {
  isLoading = true;
  try {
    await startRecording();
    recordingState = 'recording';
  } catch (error) {
    statusMessage = 'Error...';
  } finally {
    isLoading = false;
  }
}
```

### 13. No Rate Limiting
**Severity:** Low
**Location:** Recording and archive services

**Issue:**
- User could spam record/archive operations
- IndexedDB write operations could queue up
- Browser could become unresponsive

**Risk:** Poor performance under rapid clicking

**Fix:**
- Debounce/throttle handlers
- Lock state machine (add `isProcessing` flag)

## Browser Compatibility Concerns

### 14. Web Audio API Support
**Status:** Good
- Chrome, Firefox, Safari, Edge all support
- IE not supported (outdated browser anyway)

### 15. IndexedDB Support
**Status:** Good
- Supported in all modern browsers
- Older IE versions don't support

### 16. Svelte 5 Browser Support
**Status:** Good
- Works in all evergreen browsers
- ES6+ JavaScript required

## Performance Considerations

### 17. Large Audio Files
**Severity:** Low
**Location:** `src/lib/recording.ts`, `src/lib/archive.ts`

**Issue:**
- No file size limit on audio blobs
- Long recordings → large files → IndexedDB quota exceeded
- IndexedDB typically ~50MB quota per origin
- No progress indication during storage

**Risk:** "Quota exceeded" error if user records too much

**Fix:**
- Add file size validation:
```typescript
const MAX_RECORDING_SIZE = 50 * 1024 * 1024; // 50MB
if (audioBlob.size > MAX_RECORDING_SIZE) {
  throw new Error('Recording too large');
}
```

### 18. Memory Leaks on Rapid Recording Cycles
**Severity:** Low
**Location:** `src/lib/recording.ts`

**Issue:**
- `audioChunks` array could persist if cleanup fails
- `mediaRecorder` object could remain referenced
- `timerInterval` could pile up if not cleared

**Risk:** Memory usage grows if user starts/stops many times

**Fix:**
- Add explicit cleanup in error handlers
- Clear references on state transition

## Security Considerations

### 19. No CORS Headers (Not Applicable)
**Status:** Safe
- App is self-contained, no API calls
- No cross-origin requests

### 20. LocalStorage/IndexedDB Encryption
**Severity:** Low
**Location:** IndexedDB storage

**Issue:**
- User data stored unencrypted in browser
- Any script on page could access it
- If device stolen, data could be recovered

**Risk:** Privacy concern for sensitive recordings

**Fix:**
- Not typically done for web apps (browser model)
- Could use encryption library for sensitive data
- Better solution: cloud backup with server-side encryption

### 21. Content Security Policy (CSP)
**Status:** Not configured
**Recommendation:** Add to deployment (web server headers)

## Known Limitations (By Design)

### 22. Single-Device Only
- No cloud sync
- No cross-device access
- No backup (unless manually exported)

### 23. Browser Storage Dependent
- Data lost if user clears browser cache
- Subject to storage quotas
- Vulnerable to browser bugs/updates

### 24. Offline-Only (Currently)
- No server-side validation
- No user accounts
- No sharing capabilities

## Recommendations by Priority

**🔴 Critical (Before MVP Release):**
1. Add error recovery for recording failures
2. Ensure HTTPS requirement is documented
3. Test microphone access on target platforms

**🟡 Important (v1.0):**
1. Add unit tests for services
2. Persist language preference
3. Add data export/backup functionality
4. Implement story playback

**🟢 Nice-to-Have (v1.1+):**
1. Improve a11y (ARIA labels, keyboard nav)
2. Component refactoring
3. Loading states
4. Rate limiting/debouncing
5. File size validation

## Testing Your Fixes

Before deploying:
1. Test microphone access on target device
2. Test on both HTTP (localhost) and HTTPS (production)
3. Test with large recordings (~20-30 minutes)
4. Test language toggle persistence
5. Test error cases (deny permission, clear storage)
6. Verify accessibility with keyboard navigation
