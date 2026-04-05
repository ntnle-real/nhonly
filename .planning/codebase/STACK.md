# Technology Stack

**Analysis Date:** 2026-04-05

## Languages

**Primary:**
- TypeScript 5.9.3 - Frontend components, utilities, and configuration
- Svelte 5.54.0 (with runes) - UI framework for reactive components

**Secondary:**
- JavaScript - Configuration files (svelte.config.js)
- HTML - Layout templates (src/app.html)
- CSS - Component styling (inline in .svelte files)

## Runtime

**Environment:**
- Node.js (version not specified, uses `engine-strict=true` in .npmrc)
- Browser (modern with Web Audio API, IndexedDB support)

**Package Manager:**
- npm (with package-lock.json present)
- Lockfile: Yes (`package-lock.json`)

## Frameworks

**Core:**
- SvelteKit 2.50.2 - Full-stack meta-framework for building web applications
- Svelte 5.54.0 - Reactive component framework (runes mode enabled by default)

**Build/Dev:**
- Vite 7.3.1 - Frontend build tool and dev server
- @sveltejs/vite-plugin-svelte 6.2.4 - Vite plugin for processing Svelte components
- @sveltejs/adapter-auto 7.0.0 - Automatic deployment adapter selection

**Code Quality:**
- svelte-check 4.4.2 - Type checking for Svelte components

## Key Dependencies

**Critical:**
- svelte/store - Reactive state management (used in `src/lib/i18n.ts` for language store)
- Web Audio API - Browser native, for microphone recording in `src/lib/recording.ts`
- IndexedDB - Browser native, for persistent story storage in `src/lib/archive.ts`

**No External Runtime Dependencies:**
This project has zero production dependencies. All functionality uses browser native APIs (MediaRecorder, IndexedDB, getUserMedia) and Svelte's built-in stores for state management.

## Configuration

**Environment:**
- `.npmrc` - npm configuration with `engine-strict=true` (enforces exact Node.js version)
- No `.env` files configured (application is client-only with no backend integration)

**Build:**
- `vite.config.ts` - Minimal Vite configuration with SvelteKit plugin
- `svelte.config.js` - SvelteKit configuration with:
  - Runes mode enabled globally (except node_modules)
  - Auto adapter for deployment target selection
- `tsconfig.json` - TypeScript configuration extending `.svelte-kit/tsconfig.json` with:
  - Strict mode enabled
  - Source maps enabled
  - Path rewriting for relative imports

## Platform Requirements

**Development:**
- Node.js with npm
- Modern code editor (VSCode configs present in `.vscode/`)

**Production:**
- Modern browser with:
  - Web Audio API (MediaRecorder, getUserMedia)
  - IndexedDB support
  - ES2020+ JavaScript support
  - Deployment via @sveltejs/adapter-auto (supports Node, Vercel, Cloudflare, AWS Lambda, etc.)

---

*Stack analysis: 2026-04-05*
