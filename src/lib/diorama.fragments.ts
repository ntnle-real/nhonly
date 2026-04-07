// MARK: SYSTEM(Fragments) -> Diorama Narrative Data
// Purpose: Define fragment data structure and the boy-on-beach story fragments
// Success: export typed BEACH_FRAGMENTS array used by DioramaFragments component
// Failure: none (pure data module)

/**
 * Fragment data structure for narrative reveal in diorama experience.
 * Each fragment represents one line of the story, with positioning, timing, and styling info.
 */
export interface DioramaFragment {
	id: string; // "fragment-1" through "fragment-5"
	triggerScrollPosition: number; // px from scroll start when fragment animates in
	text: string; // Content of the fragment
	xOffset: number; // Horizontal offset: -1 (left) to 1 (right), 0 = center
	yPercent: number; // Vertical position: 0 = top, 100 = bottom of viewport
	targetOpacity: number; // Final opacity (0.85–1.0)
	durationMs: number; // Animation in-duration in ms
	delayMs: number; // Delay before animation starts in ms
	fontSize: 'base' | 'lg'; // 'base' = 16px, 'lg' = 20px
	fontWeight: 400 | 600; // Regular or semibold
	color: string; // Hex color of fragment text
	lineHeight: number; // 1.4 for short, 1.6 for multi-line
}

/**
 * The Boy on the Beach: 5 narrative fragments revealing the story as reader scrolls.
 * Fragment 1: Establish the protagonist (naked, vulnerable)
 * Fragment 2: Establish setting (ocean everywhere)
 * Fragment 3: Establish sensory detail (salt smell)
 * Fragment 4: KEY MOMENT: He jumped (amber highlight, semibold)
 * Fragment 5: CONSEQUENCE: Water catches him (teal highlight)
 */
export const BEACH_FRAGMENTS: DioramaFragment[] = [
	{
		id: 'fragment-1',
		triggerScrollPosition: 200,
		text: 'The boy was naked.',
		xOffset: 0,
		yPercent: 40,
		targetOpacity: 1.0,
		durationMs: 1000,
		delayMs: 0,
		fontSize: 'lg',
		fontWeight: 400,
		color: '#ffffff',
		lineHeight: 1.4,
	},
	{
		id: 'fragment-2',
		triggerScrollPosition: 800,
		text: 'The ocean was everywhere.',
		xOffset: -0.3,
		yPercent: 55,
		targetOpacity: 0.9,
		durationMs: 800,
		delayMs: 0,
		fontSize: 'base',
		fontWeight: 400,
		color: '#f0e6d0',
		lineHeight: 1.4,
	},
	{
		id: 'fragment-3',
		triggerScrollPosition: 1400,
		text: 'Salt smell so thick you could taste it.',
		xOffset: 0.2,
		yPercent: 35,
		targetOpacity: 0.85,
		durationMs: 900,
		delayMs: 0,
		fontSize: 'base',
		fontWeight: 400,
		color: '#d4d4d0',
		lineHeight: 1.4,
	},
	{
		id: 'fragment-4',
		triggerScrollPosition: 2200,
		text: 'He jumped.',
		xOffset: 0,
		yPercent: 50,
		targetOpacity: 1.0,
		durationMs: 600,
		delayMs: 0,
		fontSize: 'lg',
		fontWeight: 600,
		color: '#ff6b4a',
		lineHeight: 1.4,
	},
	{
		id: 'fragment-5',
		triggerScrollPosition: 3200,
		text: 'The water rose up and caught him.',
		xOffset: -0.2,
		yPercent: 65,
		targetOpacity: 0.9,
		durationMs: 1200,
		delayMs: 0,
		fontSize: 'base',
		fontWeight: 400,
		color: '#a0d8e8',
		lineHeight: 1.6,
	},
];
