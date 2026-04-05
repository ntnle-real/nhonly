# nhonly Phase 1: Recording Feature — Requirements

## Phase Goal
Build a functional audio recording experience that feels safe, simple, and respectful. Users should be able to record, preview, and confirm their story is saved with minimal friction and maximum clarity.

---

## Functional Requirements

### 1. Recording Controls
- **Record Button (Start/Stop)**
  - Single tap to start recording
  - Single tap to stop recording
  - Visual state change (red indicator while recording)
  - C3 contract: `recordingState → "idle" | "recording" | "paused"`

- **Pause/Resume**
  - Pause button appears during active recording
  - Resume continues from pause point without losing audio
  - C3 contract: `pauseState → "active" | "paused" | "stopped"`

### 2. Visual Feedback
- **Live Waveform Display**
  - Real-time audio visualization while recording
  - Shows amplitude/frequency in simple, clear format
  - No technical jargon

- **Recording Duration**
  - Timer showing elapsed time (MM:SS format)
  - Clear, readable font size

- **Recording Status Indicators**
  - Active recording: Red/pulsing indicator
  - Paused: Yellow/pause icon
  - Saved: Green checkmark + "Story saved" confirmation
  - C3 contract: `uiState → { status: string, color: string }`

### 3. Audio Playback (Preview)
- **Play Recorded Audio**
  - Preview button after recording stops
  - Play/pause controls
  - Progress bar with current time
  - Can play back before saving

### 4. Error Handling
- **Microphone Permissions**
  - Detect if user denies microphone access
  - Clear, bilingual message explaining why access is needed
  - Link to browser settings to enable permission
  - C3 contract: `permissionState → "granted" | "denied" | "pending"`

- **Browser Compatibility**
  - Detect if Web Audio API unavailable
  - Friendly message suggesting compatible browsers
  - Graceful degradation (don't crash)

- **Storage Errors**
  - If IndexedDB write fails, notify user clearly
  - Offer to retry or clear old recordings
  - C3 contract: `storageState → { status: string, error?: string }`

---

## Non-Functional Requirements

### Language & Localization
- **Vietnamese & English UI**
  - All buttons, labels, messages in both languages
  - Language toggle accessible on all screens
  - Default language: detect from browser locale
  - C3 contract: `i18n → { language: "vi" | "en", t: (key: string) => string }`

### Performance
- Recording latency < 50ms
- Waveform updates at 30+ FPS
- No memory leaks during long recordings (30+ min)

### Accessibility
- All buttons keyboard accessible (Tab, Enter)
- High contrast mode support
- Audio cues for state changes (optional, bilingual)

### User Experience
- Entire flow doable with one hand
- Large touch targets (min 44×44px)
- No confusing technical terminology

---

## Technical Contracts (C3 Patterns)

### RecordingState Contract
```typescript
interface RecordingState {
  status: "idle" | "recording" | "paused" | "stopped";
  duration: number; // ms
  audioBuffer?: AudioBuffer;
  error?: string;
}
```

### UIState Contract
```typescript
interface UIState {
  status: "idle" | "recording" | "paused" | "saving" | "saved" | "error";
  recordingTime: string; // "MM:SS"
  errorMessage?: string;
  language: "vi" | "en";
}
```

### PermissionState Contract
```typescript
interface PermissionState {
  microphone: "granted" | "denied" | "pending";
  error?: string;
}
```

### StorageState Contract
```typescript
interface StorageState {
  status: "idle" | "writing" | "success" | "error";
  recordingId?: string;
  error?: string;
}
```

---

## Acceptance Criteria

### Recording
- [ ] Start recording with single button tap
- [ ] Pause/resume without losing audio content
- [ ] Stop recording and save to IndexedDB
- [ ] Timer displays accurate elapsed time (MM:SS)

### Visual Feedback
- [ ] Waveform animates smoothly during recording
- [ ] Recording status clearly indicated (color + text)
- [ ] Pause status clearly distinguished from recording

### Playback
- [ ] User can preview recorded audio before confirming save
- [ ] Play/pause controls work correctly
- [ ] Duration and current time display accurately

### Error Handling
- [ ] Permission denied: user sees clear bilingual message + browser settings link
- [ ] Browser incompatible: user sees supportive message
- [ ] Storage error: user notified with retry/clear options

### Localization
- [ ] All UI text in Vietnamese and English
- [ ] Language toggle accessible and persistent
- [ ] Messages culturally appropriate and clear

### Success Confirmation
- [ ] After save: green checkmark + "Story saved" message
- [ ] Record another audio option appears
- [ ] No doubt in user's mind that story is preserved

---

## Out of Scope (Phase 2+)
- Cloud storage / sync
- Family sharing
- Metadata (title, date, tags)
- Transcription
- Export formats
- Advanced editing

---

**Last Updated:** 2026-04-05
**Phase Lead:** Claude
**Status:** Ready for planning
