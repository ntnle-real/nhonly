# Testing Patterns

**Analysis Date:** 2026-04-05

## Test Framework

**Status:** No test framework configured or test files found.

**Current State:**
- No `jest.config.ts`, `vitest.config.ts`, or test runner configuration in project
- No test files (`*.test.ts`, `*.spec.ts`) in `src/` directory
- Project uses SvelteKit with Vite as build tool, but testing not yet integrated
- Only dependent library tests exist in `node_modules/`

**Implications:**
- New tests should be configured before writing
- No established test patterns to follow yet
- Testing is an opportunity for fresh pattern definition

## Recommended Testing Setup

For a SvelteKit + TypeScript project following C3 contract patterns, the recommended testing approach:

### Framework Choice

**Recommended: Vitest**
- Native ES module support (aligns with SvelteKit)
- Fast execution with Vite integration
- Excellent TypeScript support
- Compatible with C3 contract testing patterns

**Alternative: Jest** (if needed)
- Broader compatibility
- More mature ecosystem
- Requires additional config for ESM

### Testing Strategy for C3 Contracts

**Pattern: Contract-Driven Tests**

Every function with a C3 contract gets tests organized around success/failure conditions.

**Test Structure Template:**
```typescript
// test: function_name.test.ts
import { describe, it, expect } from 'vitest';
import { functionName, functionNameContract } from './function_name';

describe('functionName', () => {
  // SUCCESS PATH TESTS
  describe('success conditions', () => {
    it('succeeds with valid input', () => {
      const result = functionName(validInput, mockObs);
      expect(result).toBeDefined();
    });

    it('records success observations', () => {
      const observations = [];
      const mockObs = {
        read: (name, value) => {},
        step: (name) => {},
        observe: (type, detail) => observations.push({ type, detail }),
        return_: (name, value) => value,
      };
      functionName(validInput, mockObs);
      expect(observations).toContainEqual(
        expect.objectContaining({ type: 'success_observation' })
      );
    });
  });

  // FAILURE PATH TESTS
  describe('failure conditions', () => {
    it('throws on invalid input', () => {
      expect(() => functionName(invalidInput, mockObs)).toThrow();
    });

    it('records failure observations before throwing', () => {
      const observations = [];
      const mockObs = {
        read: (name, value) => {},
        step: (name) => {},
        observe: (type, detail) => observations.push({ type, detail }),
        return_: (name, value) => value,
      };
      try {
        functionName(invalidInput, mockObs);
      } catch {}
      expect(observations).toContainEqual(
        expect.objectContaining({ type: 'failure_observation' })
      );
    });
  });

  // CONTRACT VERIFICATION
  describe('contract compliance', () => {
    it('declares correct input/output nouns', () => {
      expect(functionNameContract.declares).toEqual({
        input: 'INPUT_NOUN',
        output: 'OUTPUT_NOUN',
      });
    });

    it('defines success conditions', () => {
      expect(functionNameContract.succeeds_if).toBeDefined();
      expect(functionNameContract.succeeds_if.reads).toContain('INPUT_NOUN');
      expect(functionNameContract.succeeds_if.returns).toContain('OUTPUT_NOUN');
    });

    it('defines failure conditions', () => {
      expect(functionNameContract.fails_if).toBeDefined();
      expect(functionNameContract.fails_if.observes).toBeDefined();
    });
  });
});
```

## Test File Organization

**Location:**
- Co-located with source: `src/lib/function_name.ts` → `src/lib/function_name.test.ts`
- Mirrors directory structure: `src/lib/` tests → `src/lib/` alongside implementation

**Naming:**
- `[module].test.ts` — Test file name matches module
- Example: `archive.test.ts` for `archive.ts`

**Structure:**
```
src/
├── lib/
│   ├── archive.ts
│   ├── archive.test.ts
│   ├── recording.ts
│   ├── recording.test.ts
│   ├── i18n.ts
│   └── i18n.test.ts
├── routes/
│   ├── +page.svelte
│   └── +page.test.ts
```

## Test Structure

**Organizing by contract elements:**

```typescript
describe('functionName', () => {
  // Contract definition (for reference)
  const contract = functionNameContract;

  // Input fixtures
  const validInputs = { /* ... */ };
  const invalidInputs = { /* ... */ };

  // Mock observation session
  const createMockObs = () => ({
    read: vi.fn(),
    step: vi.fn(),
    observe: vi.fn(),
    return_: vi.fn((name, value) => value),
  });

  // SUCCESS TESTS
  describe('success path', () => {
    it('reads declared inputs', () => {
      const mockObs = createMockObs();
      functionName(validInputs, mockObs);
      expect(mockObs.read).toHaveBeenCalledWith('INPUT_NOUN', expect.any(Object));
    });

    it('executes declared steps in order', () => {
      const mockObs = createMockObs();
      functionName(validInputs, mockObs);
      expect(mockObs.step).toHaveBeenNthCalledWith(1, 'step_1_name');
      expect(mockObs.step).toHaveBeenNthCalledWith(2, 'step_2_name');
    });

    it('records success observations', () => {
      const mockObs = createMockObs();
      functionName(validInputs, mockObs);
      expect(mockObs.observe).toHaveBeenCalledWith('success_observation', expect.any(String));
    });

    it('returns declared output', () => {
      const mockObs = createMockObs();
      const result = functionName(validInputs, mockObs);
      expect(mockObs.return_).toHaveBeenCalledWith('OUTPUT_NOUN', result);
    });
  });

  // FAILURE TESTS
  describe('failure path', () => {
    it('throws on missing required field', () => {
      const mockObs = createMockObs();
      expect(() => functionName(invalidInputs.missingField, mockObs)).toThrow();
    });

    it('records failure observation before throwing', () => {
      const mockObs = createMockObs();
      try {
        functionName(invalidInputs.invalid, mockObs);
      } catch {}
      expect(mockObs.observe).toHaveBeenCalledWith(
        'failure_observation_name',
        expect.any(String)
      );
    });
  });

  // CONTRACT VERIFICATION
  describe('contract verification', () => {
    it('has correct serves description', () => {
      expect(contract.serves).toMatch(/description/);
    });

    it('declares required input/output', () => {
      expect(contract.declares.input).toBe('INPUT_NOUN');
      expect(contract.declares.output).toBe('OUTPUT_NOUN');
    });

    it('specifies success conditions', () => {
      expect(contract.succeeds_if.reads).toContain('INPUT_NOUN');
      expect(contract.succeeds_if.steps).toContain('step_1_name');
      expect(contract.succeeds_if.observes).toContain('success_observation_name');
      expect(contract.succeeds_if.returns).toContain('OUTPUT_NOUN');
    });

    it('specifies failure conditions', () => {
      expect(contract.fails_if.observes).toContain('failure_observation_name');
    });
  });
});
```

## Mocking

**Mock Observation Session:**
```typescript
const createMockObs = () => ({
  read: vi.fn(),
  step: vi.fn(),
  observe: vi.fn(),
  return_: vi.fn((name, value) => value),  // Pass-through function
});
```

**Mock External Dependencies:**
- Browser APIs (IndexedDB, MediaRecorder): Use Vitest environment config or manual mocks
- Async operations: Use `async/await` in tests, Vitest auto-handles promises

**What to Mock:**
- Browser APIs (MediaRecorder, IndexedDB, getUserMedia)
- External services or APIs (if any exist)
- Svelte stores (use `readable()`, `writable()` test instances)
- Observation session (required for contract testing)

**What NOT to Mock:**
- Core logic (test actual function behavior)
- Contract validation (ensure contracts are actually verified)
- Svelte reactivity (`$:` blocks must run to test reactivity)

## Fixtures and Factories

**Test Data (not yet formalized, but recommended pattern):**

Create `src/lib/testing.fixtures.ts`:
```typescript
// Test fixtures for common data shapes
export const fixtures = {
  validStory: {
    title: 'My Story',
    audioBlob: new Blob(['audio data'], { type: 'audio/wav' }),
  },
  invalidStory: {
    title: '',  // Empty title fails contract
    audioBlob: null,
  },
  validUser: {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    active: true,
  },
  validEmail: 'user@example.com',
  invalidEmail: 'not-an-email',
};
```

**Factory Pattern (for complex objects):**
```typescript
export function createMockRecordingSession(overrides = {}): RecordingSession {
  return {
    isRecording: false,
    elapsedMs: 0,
    audioBlob: null,
    ...overrides,
  };
}
```

**Location:** `src/lib/testing.fixtures.ts` — Shared test utilities

## Coverage

**Targets (to establish):**
- Statement coverage: Aim for 80%+
- Branch coverage: Aim for 75%+ (contract success/failure paths)
- Function coverage: Aim for 90%+ (every exported function tested)

**View Coverage Command (once configured):**
```bash
npm run test:coverage
# or
vitest run --coverage
```

**Configuration (Vitest + c8):**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
});
```

## Test Types

**Unit Tests:**
- Scope: Individual functions (archive.ts exports, recording.ts exports)
- Approach: Test contract compliance, success/failure paths, observable outcomes
- Examples: `archive.test.ts` tests `saveStory()`, `getStory()`, `initDatabase()` in isolation

**Integration Tests:**
- Scope: Multiple modules working together (e.g., startRecording → saveStory → archive)
- Approach: Test full user workflows, state transitions, async coordination
- Example: "User records story, stops recording, archives with title" integration test

**Svelte Component Tests:**
- Framework: Svelte testing library (or vitest-dom for assertions)
- Pattern: Test props, reactive state, event dispatch
- Example: `+page.test.svelte` tests recording state machine transitions

**E2E Tests:**
- Not currently configured
- Could use Playwright or Cypress for browser automation
- Out of scope for initial test setup

## Common Patterns

**Async Testing:**
```typescript
it('saves story to database', async () => {
  const mockObs = createMockObs();
  const id = await saveStory('Story Title', audioBlob);
  expect(id).toBeGreaterThan(0);
  expect(mockObs.return_).toHaveBeenCalledWith('story_id', id);
});
```

**Error Testing:**
```typescript
it('throws when database not initialized', async () => {
  const mockObs = createMockObs();
  await expect(
    saveStory('Title', audioBlob)
  ).rejects.toThrow('Database not initialized');
});

it('records error observation before throwing', async () => {
  const mockObs = createMockObs();
  try {
    await functionWithError(invalidInput, mockObs);
  } catch (e) {}
  expect(mockObs.observe).toHaveBeenCalledWith('database_error', expect.any(String));
});
```

**Promise/Async Pattern:**
```typescript
// Test function that returns Promise<T>
it('resolves with story data', async () => {
  const story = await getStory(1);
  expect(story).toEqual(expect.objectContaining({ id: 1, title: '...' }));
});

// Test rejection
it('rejects when ID invalid', async () => {
  await expect(getStory(-1)).rejects.toThrow();
});
```

**Observation Sequence Testing:**
```typescript
it('executes steps in correct order', () => {
  const mockObs = createMockObs();
  const callOrder = [];
  mockObs.step.mockImplementation((name) => callOrder.push(name));
  
  transformUser(validUser, mockObs);
  
  expect(callOrder).toEqual(['extract_fields', 'normalize_email', 'validate_user']);
});
```

## Test Configuration (TODO)

**File: `vitest.config.ts` (to create)**
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,  // Use describe/it/expect without imports
    environment: 'jsdom',  // Browser environment for DOM tests
    include: ['src/**/*.test.ts', 'src/**/*.test.svelte'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html'],
    },
  },
});
```

**File: `package.json` scripts (to add)**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Next Steps

1. Install Vitest: `npm install -D vitest @vitest/ui c8`
2. Create `vitest.config.ts` with configuration above
3. Update `package.json` with test scripts
4. Create first test file following contract testing pattern
5. Run `npm test` to verify setup

---

*Testing analysis: 2026-04-05*
