# nhonly Project Roadmap

## Milestone 1: Recording & Local Archiving

### Phase 1: Recording Feature
**Goal:** Build functional audio recording with pause/resume, preview, visual feedback, and error handling.

**Key Deliverables:**
- Microphone access & permissions handling
- Record/pause/resume controls
- Live waveform visualization
- Recording duration timer
- Audio preview playback
- Comprehensive error handling (permissions, browser compat, storage)
- Full Vietnamese/English bilingual UI
- Save confirmation feedback

**Estimated Scope:** 1 session
**Success Criteria:**
- All acceptance criteria in REQUIREMENTS.md met
- No technical debt introduced
- C3 contracts enforced throughout

---

## Future Phases (Scope for Later)

### Phase 2: Cloud Archival
- Secure cloud storage integration
- End-to-end encryption
- Sync & backup

### Phase 3: Family Sharing
- Access controls & permissions
- Family member invitations
- Shared library view

### Phase 4: Story Metadata & Tagging
- Title & description
- Recording date/time
- Story tags & categorization
- Speaker name & bio

### Phase 5: Transcription & Translation
- Automatic transcription (Vietnamese/English)
- Translation support
- Search across story content

### Phase 6: Export & Preservation
- Multiple export formats (WAV, MP3, WebM)
- Batch export
- Archive format for long-term storage

---

## Architecture Decisions

### Web Audio API
- **Why:** Browser-native, no server needed, privacy-first (local recording)
- **Tradeoff:** Limited to browser support, offline-only until Phase 2

### IndexedDB Storage
- **Why:** Large storage quota, local persistence, no backend required
- **Tradeoff:** Browser-dependent, need migration strategy for cloud (Phase 2)

### C3 Contracts
- **Why:** Explicit contracts enforce UI ↔ Audio ↔ Storage consistency
- **Tradeoff:** More upfront definition, but prevents subtle bugs

### SvelteKit + TypeScript
- **Why:** Reactive components perfect for live waveform UI, strong typing
- **Tradeoff:** Build step required, learning curve for some patterns

### Vietnamese/English from Day 1
- **Why:** Respect for both user groups, no English-first bias
- **Tradeoff:** All strings must be managed in both languages

---

## Success Metrics (Overall Project)

### Phase 1 Launch
- ✅ Core recording feature works flawlessly
- ✅ Users feel confident their story is saved
- ✅ Bilingual interface feels natural
- ✅ Error handling is graceful & helpful

### Future Milestones
- Cloud-backed archival with encryption
- Family access to stories
- Searchable story library
- Cross-device sync

---

**Created:** 2026-04-05
**Next Step:** `/gsd:plan-phase 1` to start Phase 1 planning & execution
