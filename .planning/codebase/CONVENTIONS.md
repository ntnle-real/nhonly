# Code Style & Conventions

## General Principles

- **Clarity over cleverness** - Code is explicit and readable
- **Inline comments** - Key sections marked with `// MARK:` comments
- **Type safety** - All TypeScript files use strict typing
- **Error messages** - User-facing errors in `statusMessage` state variable
- **Functional approach** - Services are functions, not classes

## TypeScript Conventions

### Type Definitions
```typescript
// Interfaces in PascalCase
export interface RecordingSession {
  isRecording: boolean;
  elapsedMs: number;
  audioBlob: Blob | null;
}

export interface ArchivedStory {
  id: number;
  title: string;
  audioBlob: Blob;
  timestamp: number;
}

export type Language = 'vi' | 'en';
```

### Function Definitions
```typescript
// Async functions for browser API operations
export async function startRecording(): Promise<void>
export async function saveStory(title: string, audioBlob: Blob): Promise<number>

// Synchronous getters
export function getElapsedMs(): number
export function t(key: string): string
```

### Error Handling
```typescript
try {
  await operation()
} catch (error) {
  // Always provide user-friendly message
  statusMessage = 'Readable error message';
  console.error('Developer message:', error);
  throw error; // Re-throw if upstream should handle
}
```

### Comments
```typescript
// MARK: [Section Name] — Major logical section header
// Used in +page.svelte to delineate component sections

// Regular comments — explanation of non-obvious logic
// Success: [outcome] — describes happy path
// Failure: [outcome] — describes error case
```

## Svelte Component Conventions

### Component Structure
```svelte
<script lang="ts">
  // 1. Imports (services, types, stores)
  import { t, setLanguage } from '$lib/i18n';

  // 2. Type declarations
  type State = 'idle' | 'recording' | 'stopped';

  // 3. State declarations (Svelte 5 runes)
  let recordingState: State = $state('idle');
  let statusMessage = $state('');

  // 4. Lifecycle hooks
  onMount(() => {
    // ...
  });

  // 5. Event handlers
  function handleStartRecording() { }

  // 6. Utilities
  function formatTime(ms: number): string { }
</script>

<!-- Markup section with MARK comments -->
<div>
  <!-- MARK: section-name -->
</div>

<style>
  /* Component-scoped styles */
</style>
```

### Reactive Declarations (Svelte 5 Runes)
```typescript
// State variables use $state rune
let recordingState = $state('idle');

// Props use $props rune
let { children } = $props();

// Stores with $ prefix
import { currentLanguage } from '$lib/i18n';
$currentLanguage // Reactive reference
```

### Event Binding
```svelte
<!-- Inline onclick attributes -->
<button onclick={handleStartRecording}>Text</button>

<!-- Data binding -->
<input type="text" bind:value={storyTitle} />

<!-- Conditional rendering -->
{#if recordingState === 'idle'}
  <!-- content -->
{/if}

<!-- For loops -->
{#each items as item}
  <!-- content -->
{/each}
```

## File & Naming Conventions

### Files
- **Components:** `.svelte` extension
- **Services:** `.ts` extension
- **Type definitions:** Inline in `.ts` files or `.svelte`
- **Route files:** `+page.svelte`, `+layout.svelte` (SvelteKit)

### Naming
```typescript
// Functions: camelCase, verb-first
startRecording()      // ✓ Correct
recordStart()         // ✗ Avoid

// Variables: camelCase
let elapsedMs = 0;    // ✓ Correct
let ms_elapsed = 0;   // ✗ Avoid

// Constants: UPPER_SNAKE_CASE
const DB_NAME = 'nhonly_archive';
const STORE_NAME = 'stories';

// React event handlers: handleVerbNoun
function handleStartRecording() { }
function handleStopRecording() { }
function handleArchive() { }

// Types: PascalCase
type Language = 'vi' | 'en';
interface ArchivedStory { }

// Svelte stores: camelCase
export const currentLanguage = writable<Language>('en');
```

## State Management Pattern

### Component State
```typescript
let recordingState = $state('idle');  // UI state machine
let elapsedMs = $state(0);            // Simple value
let audioBlob = $state(null);         // Can be null
let statusMessage = $state('');       // Transient messages
```

### Module-Level State
```typescript
// recording.ts
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let startTime: number = 0;
let timerInterval: number | null = null;
```

### Store State
```typescript
// i18n.ts
export const currentLanguage = writable<Language>('en');

// Usage
$currentLanguage // Reactive in Svelte components
```

## Error Handling Conventions

### Service Layer
```typescript
export async function startRecording(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // SUCCESS: acquired media stream
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => { /* ... */ };
    mediaRecorder.start();
    // SUCCESS: timer started
  } catch (error) {
    // FAILURE: microphone access denied
    console.error('Failed to start recording:', error);
    throw error;
  }
}
```

### Component Layer
```typescript
async function handleStartRecording() {
  try {
    await startRecording();
    recordingState = 'recording';
    elapsedMs = 0;
    statusMessage = '';
  } catch (error) {
    statusMessage = 'Microphone access denied';  // User-friendly
  }
}
```

## Async/Await Patterns

```typescript
// Promises wrapped in async/await
export function stopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('Recording not started'));
      return;
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      resolve(audioBlob);
    };

    mediaRecorder.stop();
  });
}

// Usage with await
const blob = await stopRecording();
```

## Comments & Documentation

### Section Headers (MARK Comments)
```typescript
// MARK: initialization
// Code that runs on component mount

// MARK: tell-story button
// Handler for recording start

// MARK: stop-recording button
// Handler for recording stop
```

### Inline Comments
```typescript
// SUCCESS: acquired media stream
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// FAILURE: database open failed
reject(new Error('Failed to open IndexedDB'));

// Last resort: return key itself
return key;
```

## CSS Conventions

### Inline Styles in Components
```svelte
<style>
  /* Component-scoped (automatically scoped by Svelte compiler) */
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .timer {
    font-size: 3rem;
    font-weight: bold;
    text-align: center;
  }

  button {
    padding: 0.75rem 1.5rem;
    margin: 0.5rem 0.25rem;
    cursor: pointer;
  }
</style>
```

### No CSS Classes for States
Current convention uses element selectors (`button`, `section`) rather than utility classes or BEM.

## Dependencies & Imports

### Service Imports
```typescript
import { startRecording, stopRecording } from '$lib/recording';
import { initDatabase, saveStory } from '$lib/archive';
import { t, setLanguage, currentLanguage } from '$lib/i18n';
```

### Lifecycle Imports
```typescript
import { onMount } from 'svelte';
```

### Store Imports
```typescript
import { writable } from 'svelte/store';
```

## Testing Conventions

Currently **NO tests** in the codebase.

Recommended patterns if tests added:
- Test files: `.test.ts` or `.spec.ts`
- Location: `src/lib/__tests__/`
- Framework: Vitest (recommended for Vite projects)

## Build & Dev Conventions

### Scripts
```json
"dev":        "vite dev"              // Start dev server
"build":      "vite build"            // Optimize production build
"preview":    "vite preview"          // Test production build locally
"check":      "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
```

### TypeScript Checking
- Run `npm run check` before commits
- `svelte-check` validates `.svelte` files with TypeScript

## Code Organization Principles

1. **Keep it simple** - Current MVP scope doesn't require patterns
2. **Explicit over implicit** - Avoid clever tricks
3. **Fail gracefully** - Always provide user feedback on errors
4. **Functional decomposition** - Services as functions, not classes
5. **Local scope** - Minimize global state (except stores)

## Anti-Patterns to Avoid

- Global variables (except module-level state in services)
- Deeply nested logic (keep handlers simple)
- Silent failures (always set statusMessage on error)
- Type `any` (use proper types)
- Hardcoded strings (use i18n.ts)
