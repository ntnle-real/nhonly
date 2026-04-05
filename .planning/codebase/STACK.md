# Technology Stack

## Languages & Runtime

- **Primary Language:** TypeScript 5.9.3
- **Runtime:** Node.js (via SvelteKit)
- **Module System:** ES6 modules (`"type": "module"` in package.json)

## Framework & Build Tools

### Frontend Framework
- **Svelte 5.54.0** - Latest reactive component framework with runes-based reactivity
  - Uses Svelte 5 runes (`$state`, `$props`) instead of previous reactive declarations
  - Compiled component approach (not runtime dependencies)

### Meta-Framework
- **SvelteKit 2.50.2** - Full-stack framework for Svelte
  - File-based routing in `src/routes/`
  - SSR-capable (currently configured for static adapter)
  - Built-in dev server with HMR

### Build & Dev Tools
- **Vite 7.3.1** - Lightning-fast build tool
  - `vite dev` - Development server with hot reload
  - `vite build` - Production build
  - `vite preview` - Local production preview
  - Configured via `vite.config.ts`

- **svelte-check 4.4.2** - Type checking for Svelte components
  - Integrated with TypeScript (`tsconfig.json`)
  - Validates `.svelte` files for type correctness

### Adapters
- **@sveltejs/adapter-auto 7.0.0** - Auto-detect deployment platform
  - Enables platform-agnostic deployment (Vercel, Netlify, Node, etc.)
  - Currently configured as the default adapter

## Client-Side Storage

- **IndexedDB (browser native)** - No external dependency
  - Used for persisting recorded audio stories with metadata
  - Database name: `nhonly_archive`
  - Object store: `stories` with auto-incrementing IDs

## Web APIs Used

- **Web Audio API**
  - `navigator.mediaDevices.getUserMedia()` - Microphone access
  - `MediaRecorder` - Audio recording and encoding
  - Records audio as WAV blobs

- **IndexedDB API**
  - Browser-native key-value database
  - Async API with promises

## Package Management

- **npm** - Dependency manager
- **Lock file:** `package-lock.json`
- **Total dev dependencies:** 7 (lean stack)

## Development Environment

- **TypeScript:** 5.9.3
  - Configured via `tsconfig.json`
  - Strict mode for type safety

## Configuration Files

- `svelte.config.js` - SvelteKit configuration
- `vite.config.ts` - Vite build configuration (TypeScript)
- `tsconfig.json` - TypeScript compiler options
- `.svelte-kit/` - Generated types and config

## Notable Absence (By Design)

- **No runtime dependencies** for business logic - all UI logic is vanilla TypeScript/Svelte
- **No backend framework** - purely browser-based with IndexedDB
- **No external HTTP clients** - leveraging Fetch API when needed
- **No CSS framework** - inline CSS in components for minimal footprint
- **No state management library** - Svelte stores and local component state
