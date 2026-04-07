# Quick Task 260407-ikk: Mount thúng chai Pixi Boat Study in Diorama Route

**Date:** 2026-04-07
**Commit:** 4ad9d86
**Status:** Complete

---

## What Was Done

Mounted the existing `PixiBoatStudy.svelte` scaffold into the diorama route as a scroll-triggered experimental layer tied to the thúng chai fragment (fragment 3: *"Thúng chai of bamboo float in the waves..."*).

## Files Changed

| File | Change |
|------|--------|
| `src/routes/archive/diorama/[id]/+page.svelte` | Added PixiBoatStudy import, `calcBoatOpacity()` function, `boatOpacity` derived, `.boat-study-sticky` layer, CSS |

**Not changed** (scaffold was already functional):
- `src/lib/pixi/thungChaiStudy.ts`
- `src/routes/archive/diorama/[id]/PixiBoatStudy.svelte`

## How the Study Is Mounted

1. **Import** — `PixiBoatStudy` is imported from `./PixiBoatStudy.svelte` in the `<script>` block.

2. **Opacity function** — `calcBoatOpacity(p: number)` (C3 MARK pattern) maps `sceneState.progress` to [0,1]:
   - Progress 0–2.5: hidden
   - 2.5–3.2: fade in (entering thúng chai fragment)
   - 3.2–4.5: fully visible (fragment 3 window)
   - 4.5–5.2: fade out
   - 5.2+: hidden

3. **Reactive binding** — `const boatOpacity = $derived(calcBoatOpacity(sceneState.progress));` reacts to GSAP's ScrollTrigger updates.

4. **Layer stack** — `.boat-study-sticky` sits between the Three.js scene (z:1) and the text overlay (z:3, raised from 2):
   - `.scene-sticky` z-index: 1 — Three.js atmospheric shader
   - `.boat-study-sticky` z-index: 2 — Pixi boat study (pointer-events: none)
   - `.text-sticky` z-index: 3 — fragment text (raised from 2)

5. **Panel position** — The study panel is absolutely positioned `bottom: 2.5rem; left: 2.5rem; width: min(420px, 90vw)` — visibly experimental, clearly labeled, not trying to seamlessly blend.

6. **CSS transition** — `transition: opacity 0.9s ease` on `.boat-study-sticky` smooths the fade in/out.

## What Is Still Placeholder

- **Hull shape** — The thúng chai hull in `thungChaiStudy.ts` is drawn as a generic quadratic curve ellipse. It does not yet reflect the actual basket-boat form (rounded bottom, woven bamboo rim, etc.).
- **Water integration** — The Pixi canvas renders its own dark teal water field, independent of the Three.js warmth shader. The two water representations are not synchronized. This is visible when the panel appears — two independent water moods exist simultaneously.
- **Scale/placement** — The boat is positioned at `(width * 0.56, height * 0.7)` in the Pixi canvas, which is near-center. Panel is left-anchored; the composition was not tuned for this integration.
- **Study copy** — The descriptive text in `PixiBoatStudy.svelte` ("Isolated object study for the living diorama...") is placeholder orientation text, not final narrative copy.

## Assessment: Is Pixi Right for Living Objects?

**Short answer:** Yes — strongly for boats and water-adjacent objects. More conditionally for houses and figures.

### What Pixi does well here

The thúng chai study demonstrates Pixi's key strength: **procedural presence**. The hull bobs (sine wave, 1.15Hz), sways (0.9Hz), and the reflection shimmers (1.4Hz) — all at different frequencies, so the motion never feels mechanical. This is qualitatively different from a CSS animation or a pasted graphic.

Critically, Pixi renders on a transparent canvas layered over the Three.js scene. The dark teal water field and golden glow are purely additive — they pull the boat into the same color space as the atmospheric shader without requiring any shared state. This works as-is.

### For boats specifically
**Very promising.** A boat near the waterline is exactly the object Pixi handles best:
- Physics-like micro-motion (bob, sway, drift) comes naturally from ticker + sine
- Water reflections and glow are cheap (blur filter, alpha modulation)
- The form is simple enough to draw procedurally (no texture atlas needed)
- Waterline interaction (partial submersion, shadow on water) is doable with clipping masks

### For houses
**Conditionally promising.** Houses are static by nature — a silhouette sitting on stilts. Pixi's value here would come from:
- Breathing light effects (windows, lantern glow)
- Weathering animation (subtle shader effects, smoke)
- Context integration (reflection in water below)
Without these, a house is just an SVG. Pixi earns its place only if the house is animated in meaning (light shifting, door open/closed) or if the house interacts with the water layer.

### For figures
**Less certain.** Human figures are hard to draw procedurally without becoming abstract to the point of illegibility. Options:
- SVG silhouette with Pixi animation (breathing, walking cycle) — workable but heavy
- Particle system as a figure impression — matches the abstracted, memory-like aesthetic
- Sprite sheet — goes against the "no pasted graphic" constraint

The memory-like, abstracted quality is actually better served by keeping figures as text or silence rather than Pixi objects. Pixi shines when the form can be reduced to geometry (water, boat, reflection, glow). Figures resist that reduction.

### Overall verdict
Pixi is the right layer for **water-adjacent living objects** — things that breathe, float, reflect, or have a material relationship with light and water. For the diorama's current object inventory:
- **Thúng chai**: strong yes
- **House on stilts**: yes, with lighting intent
- **Figure (boy running)**: more likely text/silence/particle impression than Pixi geometry
