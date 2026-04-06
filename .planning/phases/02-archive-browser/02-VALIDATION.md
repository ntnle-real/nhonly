---
phase: 2
slug: archive-browser
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Svelte testing library (Phase 1 precedent) |
| **Config file** | `vitest.config.ts` (inherited from Phase 1) |
| **Quick run command** | `npm test -- src/lib/archive.service.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/lib/archive.service.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| readAndSortStories empty | 01 | 0 | ARCH-01 | unit | `npm test -- archive.service.test.ts -t "empty array"` | ❌ W0 | ⬜ pending |
| readAndSortStories sort | 01 | 0 | ARCH-01 | unit | `npm test -- archive.service.test.ts -t "sort descending"` | ❌ W0 | ⬜ pending |
| readAndSortStories dates | 01 | 0 | ARCH-01 | unit | `npm test -- archive.service.test.ts -t "date format"` | ❌ W0 | ⬜ pending |
| deleteStory removes | 01 | 0 | ARCH-03 | unit | `npm test -- archive.service.test.ts -t "delete story"` | ❌ W0 | ⬜ pending |
| Playback initializes | 02 | 0 | ARCH-02 | unit | `npm test -- playback.test.ts -t "audio duration"` | ❌ W0 | ⬜ pending |
| Playback progress | 02 | 0 | ARCH-02 | unit | `npm test -- playback.test.ts -t "currentTime tracks"` | ❌ W0 | ⬜ pending |
| Playback auto-return | 02 | 0 | ARCH-02 | unit | `npm test -- playback.test.ts -t "auto-return"` | ❌ W0 | ⬜ pending |
| Delete modal shows | 02 | 0 | ARCH-03 | unit | `npm test -- delete-confirm.test.ts -t "modal displays"` | ❌ W0 | ⬜ pending |
| Empty state render | 03 | 0 | ARCH-04 | unit | `npm test -- archive.test.ts -t "empty state"` | ❌ W0 | ⬜ pending |
| Archive nav button | 03 | 0 | ARCH-06 | unit | `npm test -- landing.test.ts -t "archive button navigation"` | ❌ W0 | ⬜ pending |
| i18n Phase 2 keys | 01 | 0 | ARCH-05 | unit | `npm test -- i18n.test.ts -t "phase 2 keys"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/archive.service.test.ts` — covers ARCH-01 (readAndSortStories), ARCH-03 (deleteStory)
- [ ] `src/routes/archive/Playback.test.ts` — covers ARCH-02 (audio playback, auto-return)
- [ ] `src/routes/archive/DeleteConfirm.test.ts` — covers ARCH-03 (modal confirmation)
- [ ] `src/routes/archive/+page.test.ts` — covers ARCH-04 (empty state), ARCH-06 (navigation)
- [ ] `src/lib/i18n.test.ts` — extends Phase 1 test to verify all Phase 2 keys exist in both languages
- [ ] Framework: Vitest already installed (Phase 1) — no additional setup needed
- [ ] Fixtures: Use existing patterns from Phase 1 test suite for IndexedDB mocking
