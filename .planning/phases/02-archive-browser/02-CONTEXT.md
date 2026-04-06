# Phase 2: Archive Browser - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Source:** PRD Express Path (.planning/phases/02-archive-browser/02-UI-SPEC.md)

<domain>
## Phase Boundary

Phase 2 delivers the "other end" of the recording experience: a browse, playback, and delete interface for the IndexedDB-stored story archive. Completes the core loop: record → archive → revisit.

**What this phase delivers:**
- Archive browser accessible from landing page via secondary "Archive" button
- Story list view (title, date, duration) sorted newest-first from IndexedDB
- Full-screen audio playback with progress bar and controls
- Delete story with confirmation modal (no route change — overlay)
- Empty state (no stories yet) with CTA back to recording
- All new i18n strings in both Vietnamese and English
- New scene states in the SPA: `archive`, `playback`, `delete-confirm`

**What this phase does NOT deliver:**
- Cloud backup or sync (Phase 3)
- Family sharing (Phase 4)
- Search or tagging (Phase 5)
- Transcription/translation (Phase 6)

</domain>

<decisions>
## Implementation Decisions

### Architecture

- **SPA scene states:** Add `archive`, `playback`, and `delete-confirm` to the existing scene type. The app remains a single-page application — no new routes (or optionally `/archive` route if SvelteKit routing is preferred by planner).
- **Storage:** Read all stories from the existing IndexedDB store (`saveStory` is already implemented). Query all, sort newest-first by timestamp.
- **Audio playback:** Use HTML `<audio>` element (same as Phase 1 preview player). No new Web Audio API complexity needed for playback.

### Component Structure

- Create `src/routes/archive/+page.svelte` OR extend `src/routes/+page.svelte` with archive scenes — planner's discretion, but archive as its own route is cleaner.
- New components:
  - `StoryList.svelte` — list of story items
  - `Playback.svelte` — full-screen playback scene
  - `DeleteConfirm.svelte` — modal overlay

### Visual Design (Locked — from UI-SPEC)

- **Color palette:** Reuse Phase 1 tokens exactly (no new tokens). `teal-deep`, `teal`, `teal-light`, `sand`, `amber`, `rust`.
- **Typography:** Lora (Display) for reverent moments; Be Vietnam Pro (Body/Label) for all functional UI.
- **Touch targets:** 52px minimum height on all buttons (elderly users).
- **Transitions:** 450ms opacity fade (same as Phase 1 scene transitions).
- **Header:** Identical to Phase 1 recorder header — "Nhơn Lý" logo left, VI/EN toggle right, white/8 bottom border.

### Story List Item (Locked)

- Title: 20px/Heading, Be Vietnam Pro, white/90
- Metadata: 14px/Label, sand color (#e2d7b0), pattern: `{date} · {duration}`
- Play button: ▶ emoji, teal-light
- Delete button: 🗑 emoji, white/50
- Hover state: white/4 background, 150ms transition
- Border: top white/8
- Full row is touch target (minimum 64px height)

### Playback Scene (Locked)

- Story title: Display/Lora, 28px, white/90 (centered)
- Metadata: Body, 16px, sand/70
- Progress bar: linear bar (not waveform reuse — simpler for playback)
- Progress label: `{current} / {total}`, mono font, white/60
- Play/pause button: 52px, teal-light bg, centered
- Replay button: 52px, white/8 bg
- Close (✕): top right, 32px × 32px, white/50
- Auto-return after finish: 2 seconds delay, then return to archive list

### Delete Confirmation (Locked)

- Overlay: black/50 semi-transparent
- Modal card: max-width 400px, teal (#1b6b7b) bg, 24px padding, 8px border radius
- Heading: Lora/Display 28px, rust color — "Delete this story?"
- Body: 16px, white/70 — "This story will be permanently deleted. This action cannot be undone."
- Buttons: two equal-width (50% each):
  - "Delete": rust bg, white text
  - "Keep": white/10 bg, white text
- Focus trap in modal; Escape closes modal

### Empty State (Locked)

- Headline: Lora/Display, 28px, teal-light — "Your archive is empty"
- Body: 16px, white/70, max-width 300px, centered — (see copywriting contract)
- CTA: rust bg button, 52px — "Record your first story" → navigates back to landing/recording

### Landing Page Change (Locked)

- Add secondary "Archive" button below primary "Begin when you are ready" CTA
- Style: white/10 bg, white text, 52px height, 24px horizontal padding
- Navigates to archive route/scene

### Navigation Flow (Locked)

- Landing → Archive: via secondary CTA button
- Archive List → Playback: tap story title or ▶ button
- Playback → Archive List: tap ✕ button or audio finishes (2s delay)
- Archive → Delete Confirm: tap 🗑 button (modal overlay, no navigation)
- Empty State → Record: CTA button navigates to landing/recording

### i18n Strings (Locked — all must be added to src/lib/i18n.ts)

**New keys and values:**

| Key | English | Vietnamese |
|-----|---------|------------|
| `archive_nav` | Archive | Lưu trữ |
| `archive_empty_headline` | Your archive is empty | Kho lưu trữ của bạn còn trống |
| `archive_empty_body` | Stories you record will appear here. Begin by recording your first story. | Các chuyện bạn ghi âm sẽ xuất hiện ở đây. Hãy bắt đầu bằng cách ghi âm chuyện đầu tiên. |
| `archive_empty_cta` | Record your first story | Ghi âm chuyện đầu tiên |
| `archive_header` | Your stories | Các chuyện của bạn |
| `archive_count_singular` | {count} story | {count} chuyện |
| `archive_count_plural` | {count} stories | {count} chuyện |
| `playback_close` | ✕ | ✕ |
| `playback_replay` | ↻ | ↻ |
| `delete_heading` | Delete this story? | Xóa chuyện này? |
| `delete_body` | This story will be permanently deleted. This action cannot be undone. | Chuyện này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác. |
| `delete_confirm` | Delete | Xóa |
| `delete_cancel` | Keep | Giữ lại |
| `delete_success` | Story deleted | Chuyện đã bị xóa |
| `playback_error_heading` | Could not play story | Không thể phát chuyện |
| `playback_error_body` | The audio file may be corrupted. Try another story or re-record. | Tệp âm thanh có thể bị hỏng. Hãy thử một chuyện khác hoặc ghi âm lại. |
| `playback_error_cta` | Return to archive | Quay lại kho lưu trữ |

### Claude's Discretion

- Whether archive is a new SvelteKit route (`/archive`) or an extended scene state in `+page.svelte` — planner should choose based on code hygiene
- Whether to use `<audio>` element directly or create a thin AudioPlayer service wrapper
- Exact animation for delete toast (3s fade, then return to list)
- Whether loading state for IndexedDB read is shown (fast enough to skip, or show spinner)
- Error handling for IndexedDB read failure (show error state with retry)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Contract
- `.planning/phases/02-archive-browser/02-UI-SPEC.md` — Full visual/interaction spec, copywriting contract, component inventory, interaction contract

### Phase 1 Implementation (patterns to reuse)
- `src/routes/+page.svelte` — Scene-based SPA pattern, opacity transition implementation, header/footer structure
- `src/lib/i18n.ts` — i18n system, `translate()` function, string structure to extend
- `src/lib/archive.ts` — `saveStory()` — must read to understand story shape stored in IndexedDB
- `src/app.css` — Tailwind v4 theme tokens (colors, fonts) to reuse

### Project Context
- `.planning/STATE.md` — Architecture decisions, user base, accessibility requirements
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria
- `CLAUDE.md` — C3 contract patterns, MARK pattern, all code must follow

### C3 Contract Templates
- `C3/kernel/CONTRACTS.md` — Contract templates (read before writing any new lib files)
- `C3/kernel/EXAMPLES/svelte/` — Svelte-specific C3 patterns

</canonical_refs>

<specifics>
## Specific Ideas

### IndexedDB Read Contract
The `saveStory()` function in `src/lib/archive.ts` already stores stories. The planner must read this file to know the exact shape of stored objects (title, blob, timestamp, duration) to build the list reader correctly.

### Story Sort Order
Newest-first: sort by `savedAt` timestamp descending. IndexedDB doesn't auto-sort, so the read-all function must sort in memory.

### Audio MIME Type
Stories are stored as `audio/webm` blobs (from MediaRecorder). The playback `<audio>` element should handle this natively — no transcoding needed.

### Delete = IndexedDB Record Removal
Delete removes the story record from IndexedDB permanently. No soft-delete, no trash. Confirmation modal is the only safeguard.

### Archive → Landing Navigation
The "Record your first story" CTA (empty state) should navigate to the landing page and trigger recording, OR navigate to `/` and let the user press "Begin". The simpler path: navigate to `/` (landing page) and trust the user to tap "Begin".

</specifics>

<deferred>
## Deferred Ideas

- Cloud backup/sync — Phase 3
- Family sharing / access controls — Phase 4
- Story metadata editing (title rename, tags) — Phase 5
- Search across stories — Phase 5
- Transcription/translation — Phase 6
- Export formats (MP3, WAV) — Phase 7
- Waveform visualization during playback (optional upgrade — use simple progress bar for now)
- Story duration display during recording save — already captured in Phase 1

</deferred>

---

*Phase: 02-archive-browser*
*Context gathered: 2026-04-06 via PRD Express Path (02-UI-SPEC.md)*
