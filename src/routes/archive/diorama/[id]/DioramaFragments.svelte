<!-- MARK: FORCE(UI) -> DioramaFragments
	Purpose: Reveal one sentence at a time as user scrolls, text accumulates and eventually fades
	Success: Fragments visible based on scroll position, text persists until terminal fade, all text fades to opacity 0
	Failure: Wrong fragment visible, text jumps, fade doesn't work, or regressions in build
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { BEACH_FRAGMENTS, type DioramaFragment } from '$lib/diorama.fragments';
	import {
		initPacingState,
		computeNextPacing,
		computeFragmentOpacity,
		type PacingState
	} from '$lib/diorama.pacing';

	// Props: the scroll container element (passed from parent)
	let { scrollContainer }: { scrollContainer: HTMLElement | null } = $props();

	// Pacing state: tracks which fragments are visible and fade progress
	let pacingState = $state<PacingState>(initPacingState());
	let reducedMotion = false;

	onMount(() => {
		// Check prefers-reduced-motion
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// Listen for scroll events
		const scroller = scrollContainer ?? window;
		const handleScroll = () => {
			const scrollY = scroller === window ? window.scrollY : scrollContainer?.scrollTop ?? 0;
			pacingState = computeNextPacing(pacingState, scrollY);
		};

		scroller.addEventListener('scroll', handleScroll);

		return () => {
			scroller.removeEventListener('scroll', handleScroll);
		};
	});

	// Compute fragment style from data and pacing state
	function fragmentStyle(f: DioramaFragment, opacity: number): string {
		const xPercent = 50 + f.xOffset * 30; // Map -1..1 to 20%..80%
		const fontSize = f.fontSize === 'lg' ? '20px' : '16px';
		const finalOpacity = reducedMotion ? 1 : opacity;
		return [
			`position: absolute`,
			`left: ${xPercent}%`,
			`top: 50%`,
			`transform: translate(-50%, -50%)`,
			`max-width: min(600px, 80vw)`,
			`font-family: 'Lora', Georgia, serif`,
			`font-size: ${fontSize}`,
			`font-weight: ${f.fontWeight}`,
			`color: ${f.color}`,
			`line-height: ${f.lineHeight}`,
			`text-align: center`,
			`opacity: ${finalOpacity}`,
			`transition: opacity 100ms ease-out`,
			`pointer-events: none`,
			`padding: 0 16px`,
			`margin: 16px 0`
		].join('; ');
	}
</script>

<!-- Fragments render only if in visibleFragments set -->
{#each BEACH_FRAGMENTS as fragment (fragment.id)}
	{#if pacingState.visibleFragments.has(parseInt(fragment.id.split('-')[1]))}
		<p
			id={fragment.id}
			style={fragmentStyle(
				fragment,
				computeFragmentOpacity(parseInt(fragment.id.split('-')[1]), pacingState)
			)}
		>
			{fragment.text}
		</p>
	{/if}
{/each}

<style>
	p {
		will-change: opacity;
	}

	@media (max-width: 768px) {
		p {
			font-size: 16px !important; /* Slightly smaller on mobile */
		}
	}

	@media (prefers-reduced-motion: reduce) {
		p {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
