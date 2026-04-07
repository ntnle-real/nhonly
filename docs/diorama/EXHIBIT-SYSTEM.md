# Diorama Exhibit System

## Overview

The exhibit system transforms the diorama into a museum-like experience where visitors encounter meaning-bearing objects and read supplemental context—like walking through a gallery.

**Architecture:**
- **Data Model** (`src/lib/diorama.exhibits.ts`) — Artifact metadata with bilingual support
- **Placard Component** (`ExhibitPlacard.svelte`) — Individual exhibit display
- **Panel Component** (`ExhibitPanel.svelte`) — Grouped exhibit surface for each fragment
- **Integration** (`src/routes/archive/diorama/[id]/+page.svelte`) — Wired into scroll sequence

## Data Model: DioramaExhibit

Each exhibit object holds structured metadata:

```typescript
export interface DioramaExhibit {
  // Identity
  id: string;                       // Stable ID ("thung-chai-01")
  nameEn: string;                  // Display name — English
  nameVi: string;                  // Display name — Vietnamese

  // Classification
  type: 'boat' | 'tool' | 'architecture' | 'livelihood' | 'landscape';

  // Positioning
  appearanceFragment: number;      // Which fragment window (0-indexed)
  context: 'in-scene' | 'supplemental' | 'both';

  // Content
  placarTextEn: string;            // Placard text — English
  placarTextVi: string;            // Placard text — Vietnamese

  // Optional metadata
  imageRef?: string;               // Image URL or local path
  confidence?: 'documented' | 'oral' | 'reconstructed';
  source?: string;                 // Provenance note
}
```

## Captured Objects (Nhơn Lý, 1976)

Initial asset set from the grounding document:

### 1. Thúng Chai (Basket Boat) — Fragment 3
- **Type:** boat
- **Context:** both (in-scene visual + placard info)
- **Content:** Origin during French colonial era as tax workaround
- **Confidence:** documented
- **Status:** ✓ Aligned with existing Pixi boat study

### 2. Fish Baskets — Fragment 5
- **Type:** tool
- **Context:** both
- **Content:** Essential to fish trade; women select, bargain, sell
- **Confidence:** documented

### 3. Houses Close to the Water — Fragment 4
- **Type:** architecture
- **Context:** in-scene
- **Content:** Built close to water; reflects villagers' sea connection
- **Confidence:** documented

### 4. Women of the Fish Trade — Fragment 5
- **Type:** livelihood
- **Context:** supplemental (placard only)
- **Content:** Women central to economy; lead community decisions
- **Confidence:** documented

### 5. The Shoreline as Workplace — Fragment 1
- **Type:** landscape
- **Context:** in-scene
- **Content:** Heart of village economic and social life
- **Confidence:** documented

### 6. The Rhythm of Fishing — Fragment 2
- **Type:** livelihood
- **Context:** supplemental (placard only)
- **Content:** Daily cycle around early morning docking and fish processing
- **Confidence:** documented

## Fragment Timeline

Exhibits appear during these memory phases:

```
Fragment 0: "Nhơn Lý, 1976..."
Fragment 1: "The water holds the golden light..." → Shoreline as workplace (placard)
Fragment 2: "Fish smell comes up from the sand..." → Rhythm of fishing (placard)
Fragment 3: "Thúng chai of bamboo float..." → Thúng chai (in-scene + placard)
Fragment 4: "Houses sit close to the water..." → Houses (in-scene)
Fragment 5: "Women crouch beside baskets..." → Fish baskets + Women (both + placard)
Fragment 6: "A naked boy runs..."
Fragment 7: "He jumps..."
```

## Component Integration

### ExhibitPanel (Right-side surface)
- Shows supplemental exhibits for current fragment
- Slides in with smooth transitions
- Bilingual title + exhibit count
- Scrollable when exhibits are numerous

### ExhibitPlacard (Individual artifact)
- Clean, museum-like styling
- Bilingual name + confidence badge
- Placard text (preserved from grounding doc)
- Optional source attribution

### Sticky Positioning
- Panel lives in `.exhibit-panel-sticky` (z-index 4)
- Stays visible during scroll, updates by fragment
- Positioned bottom-right (mirror of boat study on bottom-left)
- Pointer events enabled for scrolling and reading

## How to Add New Exhibits

1. **Add to the array** in `src/lib/diorama.exhibits.ts`:

```typescript
{
  id: 'object-id',
  nameEn: 'English Name',
  nameVi: 'Vietnamese Name',
  type: 'category',
  appearanceFragment: 3,
  placarTextEn: 'Placard text...',
  placarTextVi: 'Vietnamese text...',
  context: 'supplemental', // or 'in-scene' or 'both'
  confidence: 'documented',
  source: 'Where this came from',
}
```

2. **For in-scene objects**: Create a visual component and wire it to appear during the fragment window (similar to how PixiBoatStudy works)

3. **For supplemental-only**: Just add the object data; the panel will surface it automatically

## Future Slots for Images/References

Each exhibit has an optional `imageRef` field ready for:
- Photography from the location
- Historical documents
- Archival references
- Drawings or reconstructions

When images are collected, update the object:
```typescript
imageRef: '/images/thung-chai-study.jpg'
```

Then modify `ExhibitPlacard.svelte` to render the image:
```svelte
{#if exhibit.imageRef}
  <img src={exhibit.imageRef} alt={displayName} class="placard-image" />
{/if}
```

## Confidence Levels

Objects are tagged with confidence to reflect source quality:

- **documented** — From published sources, historical records
- **oral** — Family or community memory
- **reconstructed** — Inferred from context or contemporary practice

This badge appears on the placard and helps visitors understand the evidence basis.

## Museum Framing

The exhibit system reinforces the memorial/museum experience:

> Walk through the memory space (scroll).
> See concrete objects appear (in-scene or visual studies).
> Read about their significance (placards on the right).
> Understand how villagers lived (context from grounding doc).

Each object is a **meaning-bearing artifact** — not decoration, but evidence of the life being remembered.

## Files Changed

- ✓ Created `src/lib/diorama.exhibits.ts` — Asset catalog & queries
- ✓ Created `src/routes/archive/diorama/[id]/ExhibitPlacard.svelte` — Placard display
- ✓ Created `src/routes/archive/diorama/[id]/ExhibitPanel.svelte` — Grouped surface
- ✓ Updated `src/routes/archive/diorama/[id]/+page.svelte` — Integrated panel into scene

## Next Steps

1. **Collect images** — Find or create reference images for each object
2. **Extend in-scene visuals** — Build Pixi/Three.js studies for additional objects (e.g., houses, fishing boats)
3. **Add oral history notes** — Link family stories to specific objects
4. **Refine placard text** — Test readability and cultural appropriateness
