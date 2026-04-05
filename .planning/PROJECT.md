# nhonly — Ceremonial Audio Recording & Archiving System

**Named after:** Nhơn Lý village

## Vision
Enable elderly storytellers to record long audio narratives in their own language and have them preserved with dignity and care. A system designed with ceremony in mind—not just functionality, but respect for the voices being captured.

## Problem Statement
Oral histories from grandparents and community elders are being lost as they pass. Existing recording tools are either:
- Too technical (overwhelming buttons, confusing UI)
- Not in the right languages
- Don't provide reassurance that stories are actually saved
- Lack features for proper archival

## Users
- **Primary:** Elderly storytellers (Vietnamese/English speakers) recording personal narratives
- **Secondary:** Family members helping record and preserve oral history
- **Cultural Context:** Vietnamese-English bilingual from the ground up; respectful of traditional storytelling

## Core Insights
- Recording should feel **effortless and reassuring** — elderly users need confidence their story is saved
- **Bilingual design is essential** — Vietnamese and English speakers need equal voice
- **Visual feedback is critical** — show waveforms, recording progress, save confirmation
- **Error handling with dignity** — explain problems clearly in both languages

## Technical Stack
- **Frontend:** SvelteKit + TypeScript
- **Recording:** Web Audio API
- **Storage:** IndexedDB (local persistence)
- **Architecture:** C3 contract patterns throughout
- **Localization:** Vietnamese/English from ground up

## Success Metrics (Phase 1)
- User can record audio with one-tap start/stop
- Pause/resume works smoothly without audio corruption
- Visual feedback shows recording in progress
- Preview playback of recorded audio
- Graceful error handling for permission denial, browser issues
- UI fully bilingual Vietnamese/English

## Next Phase Considerations
- Cloud archival with encryption
- Family sharing and access controls
- Metadata (title, date, tags)
- Transcription/translation support
- Export formats for preservation

---

**Created:** 2026-04-05
**Status:** Initializing Phase 1 — Recording Feature
