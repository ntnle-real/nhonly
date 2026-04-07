---
phase: quick
task: 260407-ikk
type: execute
autonomous: true
description: Mount Pixi boat study (thúng chai) as sticky layer in diorama route
files_modified:
  - src/routes/archive/diorama/[id]/+page.svelte
output_dir: .planning/quick/260407-ikk-mount-thung-chai-pixi-boat-study-in-dior/
---

<objective>
Integrate the Pixi boat study (PixiBoatStudy.svelte) into the living diorama route as a third sticky layer, visible during fragment 3 ("Thúng chai of bamboo float in the waves...") at scroll progress 3-5. The boat should fade in at progress ~2.5, peak at 3-4, and fade out by 5.5.

Purpose: Create a visual anchor for the thúng chai moment in the narrative — a living presence that surfaces at the precise narrative beat when the boat is mentioned, then recedes.

Output: Diorama route with three sticky layers (scene < boat < text), boat study fading in/out with scroll progress, proper z-index and pointer-events isolation.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/260407-ikk-mount-thung-chai-pixi-boat-study-in-dior/

## Existing Code

From `src/routes/archive/diorama/[id]/+page.svelte`:
- Three sticky layers: `.scene-sticky` (z-index:1) renders Three.js DioramaCanvas
- `.text-sticky` (z-index:2) renders GSAP-animated fragment text with margin-top:-100vh
- `.scroll-space` (z-index:0) drives ScrollTrigger with height = ZONE_COUNT * 100vh
- `sceneState.progress` is animated 0 → ZONE_COUNT (currently 10) via GSAP ScrollTrigger scrub
- Fragment 3 (index 3) is "Thúng chai of bamboo float in the waves..." (EN) or "Thúng chai tre dập dềnh trên sóng..." (VI)

From `src/routes/archive/diorama/[id]/PixiBoatStudy.svelte`:
- Self-contained wrapper around `createThungChaiStudy(host)` from `src/lib/pixi/thungChaiStudy.ts`
- Mounts Pixi Application to a host div, handles init errors, cleans up on destroy
- Renders water field (dark teal bg, golden horizon glow, shimmering reflections) and animated thúng chai hull
- No C3 contracts yet (to be added if extended)

## Requirements

1. Mount PixiBoatStudy.svelte as a new sticky layer between scene and text
2. Calculate `boatOpacity` from `sceneState.progress`:
   - progress < 2.5: opacity 0 (hidden)
   - progress 2.5-3.5: fade in (opacity 0 → 1)
   - progress 3.5-4.5: peak visibility (opacity 1)
   - progress 4.5-5.5: fade out (opacity 1 → 0)
   - progress > 5.5: opacity 0 (hidden)
3. Set z-index properly: scene(1) < boat(2) < text(3)
4. Apply pointer-events:none to boat container (experimental, non-interactive)
5. Preserve all existing diorama functionality
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add boat-study-sticky layer with opacity control to diorama route</name>
  <files>src/routes/archive/diorama/[id]/+page.svelte</files>
  <action>
1. Import PixiBoatStudy at the top of the script block (after other imports, before onMount):
   ```svelte
   import PixiBoatStudy from './PixiBoatStudy.svelte';
   ```

2. Create a derived `boatOpacity` function using the progress-based fade window:
   ```ts
   function calcBoatOpacity(p: number): number {
     if (p < 2.5) return 0;
     if (p < 3.5) return (p - 2.5) / 1.0;      // fade in over 1 zone
     if (p < 4.5) return 1;                     // fully visible for 1 zone
     if (p < 5.5) return 1 - (p - 4.5) / 1.0;  // fade out over 1 zone
     return 0;
   }
   ```

   Add a derived value after the `textOpacity = $derived(...)` line:
   ```ts
   const boatOpacity = $derived(calcBoatOpacity(sceneState.progress));
   ```

3. In the template (inside the `#if diorama` block), add a new sticky layer AFTER `.scene-sticky` and BEFORE `.text-sticky`:
   ```svelte
   <!-- Pixi Boat Study — thúng chai near waterline (experimental) -->
   <div class="boat-study-sticky" style="opacity: {boatOpacity};">
     <PixiBoatStudy />
   </div>
   ```

4. Add CSS styling for `.boat-study-sticky` in the `<style>` block:
   ```css
   .boat-study-sticky {
     position: sticky;
     top: 0;
     height: 100vh;
     margin-top: -100vh;
     z-index: 2;
     pointer-events: none;
     will-change: opacity;
   }
   ```

5. Update `.text-sticky` z-index from 2 to 3 (to keep text above the boat):
   ```css
   .text-sticky {
     /* ... existing styles ... */
     z-index: 3;  /* was 2, now 3 to layer above boat */
   }
   ```

Reasoning:
- The boat layer is sandwiched visually between the Three.js scene (z:1) and the text overlay (z:3), allowing it to feel like a memory surfacing from the environment.
- pointer-events:none keeps the boat layer non-interactive (it's a study, not a control).
- will-change:opacity optimizes the repeated opacity animations from GSAP/scroll.
- The opacity fade window (2.5-5.5) aligns the boat's arrival with the thúng chai fragment, creating narrative synchronization.
  </action>
  <verify>
Visual verification and automated test:
1. Navigate to the diorama route: `curl -s http://localhost:5173/archive/diorama/beach-boy-nhon-ly | grep -q 'boat-study-sticky'` (should match the new class)
2. Verify no TypeScript errors: `npm run build 2>&1 | grep -E "(error TS|error in)" | head -5` (should return nothing)
3. Manually test in browser: scroll through fragments, visually confirm the Pixi boat appears around fragment 3, is visible during 3-4, fades by 5
  </verify>
  <done>
- PixiBoatStudy.svelte imported and mounted in diorama route
- boatOpacity derived from progress with correct fade window (2.5-5.5)
- .boat-study-sticky layer added with correct z-index (2) and pointer-events:none
- .text-sticky z-index updated to 3
- No TypeScript errors, no regressions in existing functionality
- Boat study visually surfaces at thúng chai fragment and fades by progress 5.5
  </done>
</task>

</tasks>

<verification>
1. Build passes: `npm run build` succeeds with no TypeScript errors
2. Dev server runs: `npm run dev` starts without errors
3. Diorama route loads: navigate to /archive/diorama/beach-boy-nhon-ly
4. Boat appears correctly: scroll to fragment 3, observe Pixi boat fade in, peak, fade out by fragment 5
5. Layers stack correctly: text overlay on top of boat (pointer-events work), boat over Three.js scene
6. No console errors: check browser DevTools console for init/lifecycle errors in PixiBoatStudy
</verification>

<success_criteria>
- Diorama route compiles without errors
- PixiBoatStudy.svelte mounts and renders the thúng chai boat study
- Boat opacity animates smoothly based on scroll progress
- Boat fades in at progress ~2.5, peaks 3-4.5, fades out by 5.5
- Text layer remains on top (pointer-events functional)
- Three.js scene visible behind boat
- No regressions to existing diorama features (exit link, fragment text, scroll behavior)
- Responsive and works on mobile viewport
</success_criteria>

<output>
After completion, create `.planning/quick/260407-ikk-mount-thung-chai-pixi-boat-study-in-dior/260407-ikk-SUMMARY.md`
</output>
