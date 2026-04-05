# Coding Conventions

**Analysis Date:** 2026-04-05

## Overview

This project uses **C3 contract patterns** as its primary convention. All code is written to follow the MARK → Purpose → Success → Failure → contract → conduct → binding spatial proof shape. See `C3/kernel/` for the complete kernel documentation.

## Naming Patterns

**Files:**
- TypeScript service/utility files: `camelCase.ts` — Example: `archive.ts`, `recording.ts`, `i18n.ts` in `src/lib/`
- Svelte components: `PascalCase.svelte` — Example: `FormValidator.svelte` in `C3/kernel/EXAMPLES/svelte/`
- Routes: `+page.svelte`, `+layout.svelte` (SvelteKit convention)

**Functions:**
- camelCase with action-oriented names — Examples: `startRecording()`, `saveStory()`, `initDatabase()`, `validateEmail()`
- Async functions: Same naming; async/await is implicit in TypeScript signature

**Variables:**
- Local variables: camelCase — Examples: `elapsedMs`, `audioBlob`, `storyTitle`, `mediaRecorder`
- Constants: SCREAMING_SNAKE_CASE for non-enum constants — Examples: `DB_NAME`, `DB_VERSION`, `STORE_NAME` in `archive.ts`
- Interfaces/Types: PascalCase — Examples: `ArchivedStory`, `RecordingSession`, `TransformUserContract`, `ValidateEmailContract`
- Private/internal module variables: Prefixed with underscore or plain camelCase — Example: `let db: IDBDatabase | null = null` in `archive.ts`

**Types:**
- Interface for contract declarations: `[FunctionName]Contract` — Examples: `TransformUserContract`, `ValidateEmailContract` in kernel examples
- Interface for data shapes: `[EntityName]` — Examples: `ArchivedStory`, `RecordingSession`, `RawUserData`, `User`
- Type aliases: PascalCase — Example: `type Language = 'vi' | 'en'` in `i18n.ts`
- Union types: Use literal strings for language codes (`'vi' | 'en'`), action states (`'idle' | 'recording' | 'stopped'`)

## C3 Contract Pattern (Mandatory)

**Every function must follow the C3 contract spatial proof shape.** This is the project's primary convention. The kernel is in `C3/kernel/`.

### Structure: MARK → Purpose → Success → Failure → contract → conduct → binding

1. **MARK** — Comment marking the region's name
   ```typescript
   // MARK: recording — Web Audio API capture with live feedback
   ```

2. **Purpose** — One sentence declaring what this region does
   ```typescript
   // Purpose: Record audio stream from microphone, provide timer and stop control
   ```

3. **Success** — Observable conditions that define winning
   ```typescript
   // Success: microphone permission granted, stream captured, WAV blob returned
   ```

4. **Failure** — Observable conditions that define losing
   ```typescript
   // Failure: microphone not available, permission denied, or recording not started
   ```

5. **Contract** (TypeScript/JavaScript only) — Object defining the contract
   ```typescript
   const functionNameContract = {
     serves: "what this function serves",
     declares: { input: "INPUT_NOUN", output: "OUTPUT_NOUN" },
     succeeds_if: {
       reads: ["INPUT_NOUN"],
       steps: ["step_1", "step_2"],
       observes: ["success_observation"],
       returns: ["OUTPUT_NOUN"],
     },
     fails_if: {
       observes: ["failure_observation"],
     },
   };
   ```

6. **Conduct** — Implementation using obs.read(), obs.step(), obs.observe(), obs.return_()
   ```typescript
   function functionName(input: InputType, obs: ObservationSession): OutputType {
     obs.read("INPUT_NOUN", input);
     obs.step("step_1");
     // ... implementation ...
     obs.observe("success_observation");
     obs.step("step_2");
     // ... more implementation ...
     const result = computeResult();
     return obs.return_<OutputType>("OUTPUT_NOUN", result);
   }
   ```

7. **Binding** — Wire contract to function (for standalone functions)
   ```typescript
   functionName = bindContract(functionNameContract)(functionName);
   ```

### Real Examples from Project

**`src/lib/archive.ts` — initDatabase()**
- MARK: archive — IndexedDB persistence for recorded stories
- Declares purpose, success, failure in comments (contract-style)
- Functions use descriptive comments instead of formal contract objects (pre-binding)
- Success/failure conditions documented as inline comments

**`src/lib/recording.ts` — startRecording()**
- MARK: recording — Web Audio API capture with live feedback
- Purpose declared explicitly
- Success/failure outcomes documented
- Error handling shows clear failure paths

**`src/routes/+page.svelte` — handleStartRecording() et al.**
- MARK sections for each UI handler (tell-story button, stop-recording button, archive button)
- State machine pattern (idle → recording → stopped)
- Clear success/failure handling in try/catch blocks

## Observation API Usage

**All functions must use obs calls matching their contract.** Reference `C3/kernel/obs_api.md` for complete API.

**Four core methods (required in imperative code):**

1. `obs.read("INPUT_NAME", inputValue)` — Record input variable at start of function
2. `obs.step("step_name")` — Mark execution boundary before starting a phase
3. `obs.observe("observation_type", "optional detail")` — Record notable state or condition
4. `obs.return_<T>("OUTPUT_NAME", value)` — Return value and close gradient

**From kernel example `transform.ts`:**
```typescript
obs.read("raw_user", rawUser);      // Record input
obs.step("extract_fields");          // Boundary
if (!userId || !email || !name) {
  obs.observe("missing_required_field", "...details...");
  throw new Error("...");
}
obs.step("validate_user");           // Next boundary
obs.observe("transformation_complete", `user_id=${userId}...`);
return obs.return_<User>("normalized_user", normalizedUser);
```

## Code Style

**Formatting:**
- 2-space indentation (detected from project files)
- Line length: No hard limit detected; follow readability
- Semicolons: Required in TypeScript/JavaScript code
- Trailing commas: Used in multi-line objects/arrays

**Brace Style:**
- Opening braces on same line (K&R style) — `function foo() { ... }`
- Single-line conditionals may omit braces if clear, but braces preferred for clarity

**Linting:**
- No ESLint or Prettier config detected
- Type checking: Strict TypeScript enabled (`strict: true` in `tsconfig.json`)
- JSDoc: Use for function documentation, especially for contract details
- JSDoc tags: `@param`, `@returns`, `@throws` for function contracts (see kernel examples)

## Import Organization

**Order (no formal linting enforced, but observed pattern):**
1. Standard library imports (Node.js)
2. Third-party imports (svelte, libraries)
3. Local imports (from `$lib/`, relative paths)

**Path Aliases:**
- `$lib/` — Points to `src/lib/` (SvelteKit convention)
- `$lib/assets/` — Static assets (favicon in layout)
- Configured in SvelteKit automatically; no manual alias setup needed

**Relative imports:**
Example from `+page.svelte`:
```typescript
import { t, setLanguage, currentLanguage } from '$lib/i18n';
import { startRecording, stopRecording, getElapsedMs, isRecording } from '$lib/recording';
import { initDatabase, saveStory } from '$lib/archive';
```

## Error Handling

**Pattern: Try/catch with clear failure branching**

From `+page.svelte` — handleStartRecording():
```typescript
async function handleStartRecording() {
  try {
    await startRecording();
    recordingState = 'recording';
    // ... success state updates ...
  } catch (error) {
    statusMessage = 'Microphone access denied';  // Failure message
  }
}
```

**Guidelines:**
- Always catch and handle async errors
- Provide user-facing failure messages
- Log errors for debugging (console.error() observed in `recording.ts`)
- Never silently fail; contract includes failure observation

## Logging

**Framework:** `console` (native browser API)

**Pattern from `recording.ts`:**
```typescript
console.error('Failed to start recording:', error);
```

**Guidelines:**
- Use `console.error()` for exceptions/failures
- Use `console.assert()` for runtime assertions (seen in kernel examples)
- No structured logging framework; plain console suitable for browser context

## Comments

**When to Comment:**
- MARK boundaries — Every major region gets a MARK comment
- Purpose, Success, Failure — Always include these before contracts
- Complex logic — Inline comments for non-obvious operations
- State machine transitions — Document state changes (e.g., recordingState updates)

**JSDoc/TSDoc:**
- Use for function contracts and public APIs
- Pattern: `@param`, `@returns`, `@throws`, `@component` (for Svelte)

Example from kernel `transform.ts`:
```typescript
function transformUser(
  rawUser: RawUserData,
  obs: ObservationSession
): User {
  /**
   * Transform raw user data into normalized User.
   *
   * @param rawUser - Raw user data
   * @param obs - Observation session (injected)
   * @returns normalized_user - Normalized User instance
   * @throws {Error} If required fields are missing or invalid
   */
  // ... implementation ...
}
```

Example from Svelte — `FormValidator.svelte`:
```svelte
/**
 * Email Validator Component
 *
 * @component
 * Validates email input and provides feedback.
 *
 * @event {object} validation - Dispatched with { isValid, email, message }
 */
```

## Function Design

**Size:** No strict limit; keep functions focused on one contract boundary. Observed range: 15–60 lines typical.

**Parameters:**
- Explicit parameter declaration
- obs parameter is required for contract-driven functions (injected or passed)
- Use destructuring for complex objects (not observed in current code, but TypeScript supports it)

**Return Values:**
- Single return value (primitives, objects, Promises)
- Async functions return Promise<T>
- Contract declares return type in `declares.output`

Example from `archive.ts`:
```typescript
export async function saveStory(title: string, audioBlob: Blob): Promise<number> {
  // ... returns archive ID (number) on success
}

export async function getStory(id: number): Promise<ArchivedStory | null> {
  // ... returns story or null on failure
}
```

## Module Design

**Exports:**
- Explicit named exports preferred
- Example from `archive.ts`: `export interface ArchivedStory { ... }`
- Example from kernel `transform.ts`:
  ```typescript
  export {
    transformUserBound as transformUser,
    User,
    transformUserContract,
    RawUserData,
  };
  ```

**Barrel Files:**
- `src/lib/index.ts` exists but is empty (no barrel exports)
- Each module is imported directly by its path (`$lib/archive`, `$lib/recording`, etc.)

**Encapsulation:**
- Module-level variables private by default (not exported)
- Example from `archive.ts`: `let db: IDBDatabase | null = null` is private
- Public API is function exports only

## TypeScript Strictness

**Compiler Options in `tsconfig.json`:**
- `strict: true` — All strict checks enabled
- `forceConsistentCasingInFileNames: true` — Enforces naming consistency
- `resolveJsonModule: true` — Allows importing JSON
- `esModuleInterop: true` — Seamless import compatibility
- `allowJs: true` and `checkJs: true` — Type-check all files
- `sourceMap: true` — Debugging support

**Implications:**
- No implicit `any` types
- All types must be explicit or inferred
- Null/undefined must be handled explicitly
- Strict initialization required

Example from `i18n.ts` — Type-safe language handling:
```typescript
export type Language = 'vi' | 'en';
const currentLanguage = writable<Language>('en');
```

## Svelte 5 Runes and Reactivity

**Runes Mode Enabled:** `svelte.config.js` configures rune mode globally except in `node_modules`.

**State Declaration (Svelte 5 rune syntax):**
From `+page.svelte`:
```typescript
let recordingState: 'idle' | 'recording' | 'stopped' = $state('idle');
let elapsedMs = $state(0);
let audioBlob: Blob | null = $state(null);
```

**Reactive Statements:**
```typescript
$: {
  if (isRecording()) {
    elapsedMs = getElapsedMs();
  }
}
```

**Event Dispatching (Svelte):**
From kernel `FormValidator.svelte`:
```typescript
const dispatch = createEventDispatcher();
dispatch("validation", { isValid, email, message: errorMessage });
```

## SvelteKit Conventions

**Page Routes:**
- `src/routes/+page.svelte` — Root page (index)
- `src/routes/+layout.svelte` — Root layout (shared head, favicon)

**Imports:**
- `$lib/` alias for `src/lib/` absolute imports (SvelteKit built-in)

**Lifecycle:**
- `onMount` hook for initialization — Used in `+page.svelte` to init database and timer
- Component destructuring: `let { children } = $props()` — SvelteKit 5 rune syntax in `+layout.svelte`

---

*Convention analysis: 2026-04-05*
