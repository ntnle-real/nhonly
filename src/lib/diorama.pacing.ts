// MARK: SYSTEM(Pacing) -> Experiential Progression Engine
// Purpose: Define when and how each sentence reveals as user scrolls or taps.
// Success: One sentence at a time, text accumulates, terminal fade after "He jumps..."
// Failure: Fragments jump, text disappears, no fade state, or wrong visibility logic.

/**
 * Pacing state tracks which fragments are visible and whether terminal fade is active.
 * Used by DioramaFragments.svelte to render only visible fragments and fade text.
 *
 * Interaction model: User scrolls to reveal one sentence at a time.
 * Text accumulates on screen (previous sentences stay visible).
 * After final sentence "He jumps...", text fades over 2 seconds, leaving only ocean.
 */
export interface PacingState {
	currentFragmentIndex: number; // 0–7, which sentence was most recently revealed
	visibleFragments: Set<number>; // indices of fragments currently on screen (0 onwards)
	isTerminalFading: boolean; // true once fragment 7 becomes visible, starts text fade
	fadeProgress: number; // 0–1, fade animation progress (only used when isTerminalFading)
	userAdvancedAt: number; // timestamp of last user action (ms), used to track fade timing
	lastScrollY: number; // last recorded scroll position, used to detect scroll events
}

/**
 * Contract for pacing computation.
 * Maps scroll position to visible fragment indices and terminal fade state.
 */
export interface PacingContract {
	serves: string;
	declares: {
		input: "pacing_state_scroll_position";
		output: "updated_pacing_state";
	};
	succeeds_if: {
		reads: ["pacing_state", "scroll_position"];
		steps: ["detect_scroll", "compute_next_index", "update_visibility", "check_terminal"];
		observes: ["scroll_detected", "fragment_revealed", "terminal_fade_started"];
		returns: ["updated_pacing_state"];
	};
	fails_if: {
		observes: ["no_scroll_change", "invalid_scroll_position"];
	};
}

/**
 * Initialize pacing state with fragment 0 visible.
 * Called on component mount.
 */
export function initPacingState(): PacingState {
	return {
		currentFragmentIndex: 0,
		visibleFragments: new Set([0]),
		isTerminalFading: false,
		fadeProgress: 0,
		userAdvancedAt: Date.now(),
		lastScrollY: 0,
	};
}

/**
 * Compute next pacing state based on current state and scroll position.
 *
 * Logic:
 * - Detect scroll changes (scroll > lastScrollY)
 * - Each scroll increment (>200px) reveals next fragment
 * - Accumulate visible fragments (don't remove old ones)
 * - When fragment 7 becomes visible, set isTerminalFading = true
 * - While fading, advance fadeProgress from 0 to 1 over 2000ms
 * - When fadeProgress >= 1.0, all fragments should be hidden (opacity 0)
 *
 * @param currentState - Current pacing state
 * @param scrollY - Current window.scrollY
 * @returns Updated pacing state
 */
export function computeNextPacing(currentState: PacingState, scrollY: number): PacingState {
	const newState = { ...currentState };

	// Detect scroll change
	if (scrollY === currentState.lastScrollY && !currentState.isTerminalFading) {
		// No scroll change and not fading, return unchanged
		return newState;
	}

	newState.lastScrollY = scrollY;

	// Calculate scroll steps: every 200px of scroll reveals next fragment
	const scrollStep = Math.floor(scrollY / 200);

	// Clamp to valid fragment range (0–7)
	const nextIndex = Math.min(scrollStep, 7);

	// Update visible fragments set: add fragments 0 through nextIndex
	const visibleSet = new Set<number>();
	for (let i = 0; i <= nextIndex; i++) {
		visibleSet.add(i);
	}
	newState.visibleFragments = visibleSet;
	newState.currentFragmentIndex = nextIndex;

	// Check if terminal fade should start (fragment 7 just became visible)
	if (nextIndex === 7 && !currentState.isTerminalFading) {
		newState.isTerminalFading = true;
		newState.userAdvancedAt = Date.now();
	}

	// Update fade progress if fading
	if (newState.isTerminalFading) {
		const elapsedMs = Date.now() - newState.userAdvancedAt;
		const fadeProgress = Math.min(elapsedMs / 2000, 1.0); // Fade over 2000ms
		newState.fadeProgress = fadeProgress;
	}

	return newState;
}

/**
 * Compute opacity for a fragment based on pacing state.
 * Used by DioramaFragments.svelte to style each fragment element.
 *
 * @param fragmentIndex - Index of the fragment (0–7)
 * @param pacingState - Current pacing state
 * @returns Opacity value (0–1)
 */
export function computeFragmentOpacity(
	fragmentIndex: number,
	pacingState: PacingState
): number {
	// If not visible, opacity 0
	if (!pacingState.visibleFragments.has(fragmentIndex)) {
		return 0;
	}

	// If terminal fading, fade all visible fragments
	if (pacingState.isTerminalFading) {
		return 1.0 - pacingState.fadeProgress;
	}

	// Otherwise, fragment is fully visible
	return 1.0;
}
