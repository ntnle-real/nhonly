# Testing Structure & Practices

## Current State

**No automated tests** in the codebase.

- No test files (`.test.ts`, `.spec.ts`)
- No test runner configured (Vitest, Jest, etc.)
- No test dependencies in `package.json`
- Testing is manual/exploratory only

## Testing Opportunities

The codebase is well-structured for testing, with clear service boundaries:

### 1. Service Unit Tests (High Priority)

#### `src/lib/recording.ts`
**What to test:**
- `startRecording()`
  - ✓ Successfully calls `getUserMedia()` with correct options
  - ✗ Handles microphone permission denied
  - ✓ Returns promise that resolves
  - ✗ Handles already-recording state

- `stopRecording()`
  - ✓ Returns WAV blob
  - ✗ Rejects if not recording
  - ✓ Stops all audio tracks
  - ✗ Handles mediaRecorder null state

- `getElapsedMs()`
  - ✓ Returns numeric value
  - ✗ Returns 0 if not recording
  - ✓ Reflects actual elapsed time

- `isRecording()`
  - ✓ Returns boolean
  - ✗ Returns false if never started
  - ✓ Returns true during recording

**Mock Strategy:**
```typescript
// Mock Web Audio API
vi.mock('navigator', () => ({
  mediaDevices: {
    getUserMedia: vi.fn(),
  }
}));

// Mock MediaRecorder
const mockMediaRecorder = {
  ondataavailable: null,
  onstop: null,
  start: vi.fn(),
  stop: vi.fn(),
  stream: {
    getTracks: vi.fn(() => [{ stop: vi.fn() }])
  }
};

global.MediaRecorder = vi.fn(() => mockMediaRecorder);
```

#### `src/lib/archive.ts`
**What to test:**
- `initDatabase()`
  - ✓ Opens IndexedDB connection
  - ✗ Handles database access denied
  - ✓ Creates object store on first use

- `saveStory(title, blob)`
  - ✓ Adds story with correct properties
  - ✓ Auto-generates ID
  - ✗ Rejects if database not initialized
  - ✓ Returns ID

- `getAllStories()`
  - ✓ Returns array of stories
  - ✗ Returns empty array if error
  - ✓ Returns all stored records

- `getStory(id)`
  - ✓ Returns matching story
  - ✓ Returns null if not found
  - ✗ Returns null on error

**Mock Strategy:**
```typescript
// Mock IndexedDB
const mockStore = {
  add: vi.fn(() => ({ result: 1 })),
  getAll: vi.fn(() => ({ result: [] })),
  get: vi.fn(() => ({ result: null }))
};

const mockTransaction = {
  objectStore: vi.fn(() => mockStore)
};

global.indexedDB = {
  open: vi.fn((name, version) => ({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null
  }))
};
```

#### `src/lib/i18n.ts`
**What to test:**
- `t(key)`
  - ✓ Returns English string for valid key
  - ✓ Returns English fallback for missing translation
  - ✓ Returns key itself as last resort
  - ✓ Respects current language setting

- `setLanguage(lang)`
  - ✓ Updates currentLanguage store
  - ✓ Rejects invalid language values

- `currentLanguage` store
  - ✓ Initializes to 'en'
  - ✓ Updates when setLanguage called
  - ✓ Can subscribe to changes

**Mock Strategy:**
```typescript
// Svelte store subscriptions
import { get } from 'svelte/store';

const lang = get(currentLanguage);
// Test that lang is 'en' or 'vi'
```

### 2. Component Integration Tests (Medium Priority)

#### `src/routes/+page.svelte`
**What to test:**
- Recording flow: idle → recording → stopped → archived
- State transitions on button clicks
- Timer updates during recording
- Title input validation
- Language toggle updates text
- Status messages appear/disappear
- Error states handled gracefully

**Testing Strategy:**
```typescript
// Using Vitest + @testing-library/svelte
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('+page.svelte', () => {
  it('renders Tell your story button', () => {
    render(Page);
    expect(screen.getByText(/Tell your story/i)).toBeInTheDocument();
  });

  it('transitions to recording state on click', async () => {
    render(Page);
    const button = screen.getByText(/Tell your story/i);
    await fireEvent.click(button);
    expect(screen.getByText(/Stop/i)).toBeInTheDocument();
  });

  it('displays timer during recording', async () => {
    render(Page);
    const button = screen.getByText(/Tell your story/i);
    await fireEvent.click(button);
    // Wait for timer display
    expect(screen.getByText(/0:0[0-9]/)).toBeInTheDocument();
  });
});
```

### 3. E2E Tests (Lower Priority)

**User Flows to Test:**
1. Record a story from start to finish
2. Archive multiple stories
3. Switch language mid-recording
4. Handle microphone permission denied
5. Recover from recording errors

**Tool:** Playwright or Cypress
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
});
```

## Recommended Test Setup

### 1. Install Test Dependencies
```bash
npm install --save-dev vitest @testing-library/svelte jsdom
```

### 2. Create `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
});
```

### 3. Create Test Files Structure
```
src/
├── lib/
│   ├── __tests__/
│   │   ├── recording.test.ts
│   │   ├── archive.test.ts
│   │   └── i18n.test.ts
│   ├── recording.ts
│   ├── archive.ts
│   └── i18n.ts
└── routes/
    └── __tests__/
        └── +page.test.ts
```

### 4. Add Test Scripts to `package.json`
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Testing Challenges

### 1. Browser APIs
- **Web Audio API** - Requires mocking MediaRecorder and getUserMedia
- **IndexedDB** - Requires fake-indexeddb or similar library
- **setTimeout/setInterval** - Use `vi.useFakeTimers()` for timer tests

### 2. Async Operations
- Recording state is async
- Database operations are async
- Use `await` in tests and handle promises properly

### 3. Browser Context
- Tests run in JSDOM or happy-dom (not real browser)
- Some Web Audio features may be unavailable
- Consider Playwright for browser E2E tests

## Code Coverage Targets

**Recommended coverage:**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**Current coverage:** 0% (no tests)

## Manual Testing Checklist

Until automated tests are added, manual testing should cover:

### Recording Flow
- [ ] Click "Tell your story" button
- [ ] Verify microphone permission prompt appears
- [ ] Verify timer starts and increments
- [ ] Click "Stop" button
- [ ] Verify recording stops and state changes
- [ ] Enter story title
- [ ] Click "Archive" button
- [ ] Verify success message appears

### Language Switching
- [ ] Click language toggle button
- [ ] Verify all text changes to Vietnamese/English
- [ ] Record story in Vietnamese
- [ ] Record story in English
- [ ] Verify title placeholder changes

### Error Cases
- [ ] Deny microphone permission → verify error message
- [ ] Click "Archive" without title → verify validation message
- [ ] Close browser console, check for unexpected errors

### Data Persistence
- [ ] Record and archive a story
- [ ] Refresh page with F5
- [ ] Verify story still exists in database
- [ ] Open DevTools → Application → IndexedDB → nhonly_archive

## Testing Best Practices

1. **Test behavior, not implementation** - Test what users see, not how it works
2. **Use meaningful test names** - Describe what's being tested and expected outcome
3. **Arrange-Act-Assert** - Organize tests into setup, action, verification
4. **Mock external APIs** - Isolate code under test from browser APIs
5. **Test error paths** - Not just happy path
6. **Keep tests independent** - No test should depend on another test's data
7. **Use factories for test data** - Create reusable test fixtures

## Future Testing Strategy

**Phase 1 (Critical):**
- Service unit tests (recording, archive, i18n)
- Mock browser APIs properly
- Aim for 80%+ coverage of services

**Phase 2 (Important):**
- Component integration tests
- Test UI state machine flows
- Test error handling in components

**Phase 3 (Nice-to-have):**
- E2E tests for critical user flows
- Performance tests for recording large files
- Accessibility tests (a11y)
