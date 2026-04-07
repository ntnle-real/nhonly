// MARK: SYSTEM(Fragments) -> Experiential Narrative Framework
// Purpose: One sentence at a time, user-driven progression, continuous evolution, final fade to ocean.
// Success: All 8 locked sentences reveal sequentially; text accumulates; final sentence triggers fade.
// Failure: Text jumps/scattered; sentences disappear; no fade state.

/**
 * Fragment data structure for mindful narrative reveal in diorama experience.
 * Each fragment represents one line of the story, centered and timed for pacing.
 *
 * Pacing intent: Witness, not narrate. One element at a time. Continuous evolution, not scene swaps.
 * Terminal state: After "He jumps...", text fades and only ocean remains.
 */
export interface DioramaFragment {
	id: string; // "fragment-0" through "fragment-7"
	text: string; // Content of the fragment (locked text ending with ellipses)
	xOffset: number; // Horizontal offset: -1 (left) to 1 (right), 0 = center (all centered)
	advanceMode: 'automatic' | 'user-triggered'; // 'automatic' = auto-reveal, 'user-triggered' = waits for user action
	holdDurationMs: number; // How long fragment stays visible before fading (if auto-advancing)
	fadeOutDurationMs: number; // Duration of fade-out (0 for fragments 0-6, > 0 for fragment 7)
	fontSize: 'base' | 'lg'; // 'base' = 16px, 'lg' = 20px
	fontWeight: 400 | 600; // Regular or semibold
	color: string; // Hex color of fragment text (muted, concrete)
	lineHeight: number; // 1.4 for short, 1.6 for multi-line
}

/**
 * The Boy on the Beach, Nhơn Lý, 1976: Eight locked sentences revealing the memory.
 * Each sentence ends with ellipses. User scrolls to reveal one at a time.
 * Text accumulates on screen. After "He jumps...", all text fades to reveal ocean alone.
 *
 * Fragment 0: Location and year
 * Fragment 1: Water and light
 * Fragment 2: Sensory detail (smell)
 * Fragment 3: Cultural detail (bamboo thúng chai)
 * Fragment 4: Setting (houses and people)
 * Fragment 5: More detail (women and fish)
 * Fragment 6: The protagonist
 * Fragment 7: The moment (terminal — triggers fade)
 */
export const BEACH_FRAGMENTS: DioramaFragment[] = [
	{
		id: 'fragment-0',
		text: 'Nhơn Lý, 1976...',
		xOffset: 0,
		advanceMode: 'user-triggered',
		holdDurationMs: 0,
		fadeOutDurationMs: 0,
		fontSize: 'lg',
		fontWeight: 400,
		color: '#d4d4d0', // Muted gray
		lineHeight: 1.4,
	},
	{
		id: 'fragment-1',
		text: 'The water holds the golden light...',
		xOffset: 0,
		advanceMode: 'user-triggered',
		holdDurationMs: 0,
		fadeOutDurationMs: 0,
		fontSize: 'base',
		fontWeight: 400,
		color: '#d4a76a', // Muted gold
		lineHeight: 1.4,
	},
	{
		id: 'fragment-2',
		text: 'Fish smell comes up from the sand...',
		xOffset: 0,
		advanceMode: 'user-triggered',
		holdDurationMs: 0,
		fadeOutDurationMs: 0,
		fontSize: 'base',
		fontWeight: 400,
		color: '#9a8b6a', // Muted brown-gray
		lineHeight: 1.4,
	},
	{
		id: 'fragment-3',
		text: 'Thúng chai of bamboo float in the waves...',
		xOffset: 0,
		advanceMode: 'user-triggered',
		holdDurationMs: 0,
		fadeOutDurationMs: 0,
		fontSize: 'base',
		fontWeight: 400,
		color: '#6a9a8b', // Muted teal-gray
		lineHeight: 1.4,
	},
	{
		id: 'fragment-4',
		text: 'Houses sit close to the water...',
		xOffset: 0,
		advanceMode: 'user-triggered',
		holdDurationMs: 0,
		fadeOutDurationMs: 0,
		fontSize: 'base',
		fontWeight: 400,
		color: '#8b8b8b', // Muted gray
		lineHeight: 1.4,
	},
	{
		id: 'fragment-5',
		text: 'Women crouch beside baskets of fish...',
		xOffset: 0,
		advanceMode: 'user-triggered',
		holdDurationMs: 0,
		fadeOutDurationMs: 0,
		fontSize: 'base',
		fontWeight: 400,
		color: '#8b8b8b', // Muted gray
		lineHeight: 1.4,
	},
	{
		id: 'fragment-6',
		text: 'A naked boy runs toward the ocean...',
		xOffset: 0,
		advanceMode: 'user-triggered',
		holdDurationMs: 0,
		fadeOutDurationMs: 0,
		fontSize: 'base',
		fontWeight: 400,
		color: '#d4d4d0', // Muted gray
		lineHeight: 1.4,
	},
	{
		id: 'fragment-7',
		text: 'He jumps...',
		xOffset: 0,
		advanceMode: 'user-triggered',
		holdDurationMs: 2000, // Hold for 2 seconds before fade
		fadeOutDurationMs: 2000, // Fade over 2 seconds
		fontSize: 'lg',
		fontWeight: 400,
		color: '#d4d4d0', // Muted gray
		lineHeight: 1.4,
	},
];
