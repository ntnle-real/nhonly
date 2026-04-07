<!-- MARK: FORCE(UI) -> DioramaFragments
	Purpose: Reveal 5 narrative text fragments as user scrolls, using GSAP ScrollTrigger
	Success: Fragments animate in at their trigger positions, persist on screen, respect prefers-reduced-motion
	Failure: Fragments don't animate, memory leaks from ScrollTrigger instances
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { BEACH_FRAGMENTS, type DioramaFragment } from '$lib/diorama.fragments';

	// Props: the scroll container element (passed from parent)
	let { scrollContainer }: { scrollContainer: HTMLElement | null } = $props();

	let fragmentEls: Record<string, HTMLElement> = {};
	let reducedMotion = false;

	onMount(() => {
		// Check prefers-reduced-motion
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (reducedMotion) {
			// Show all fragments immediately — no animation
			BEACH_FRAGMENTS.forEach((f) => {
				const el = fragmentEls[f.id];
				if (el) {
					el.style.opacity = String(f.targetOpacity);
				}
			});
			return;
		}

		// Register ScrollTrigger plugin
		gsap.registerPlugin(ScrollTrigger);

		// Set up scroll triggers for each fragment
		BEACH_FRAGMENTS.forEach((f) => {
			const el = fragmentEls[f.id];
			if (!el || !scrollContainer) return;

			// Start with opacity 0 (hidden)
			gsap.set(el, { opacity: 0, y: 20 });

			// Animate when scroll position reaches triggerScrollPosition
			gsap.to(el, {
				opacity: f.targetOpacity,
				y: 0,
				duration: f.durationMs / 1000,
				delay: f.delayMs / 1000,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: el,
					scroller: scrollContainer,
					start: 'top 80%',
					once: true, // Fire once, then stay visible
					markers: false
				}
			});
		});
	});

	onDestroy(() => {
		// Kill all ScrollTrigger instances to prevent memory leaks
		ScrollTrigger.getAll().forEach((st) => st.kill());
	});

	// Compute fragment style from data
	function fragmentStyle(f: DioramaFragment): string {
		const xPercent = 50 + f.xOffset * 30; // Map -1..1 to 20%..80%
		const fontSize = f.fontSize === 'lg' ? '20px' : '16px';
		return [
			`position: absolute`,
			`left: ${xPercent}%`,
			`top: ${f.triggerScrollPosition + 100}px`, // Place in scroll space slightly below trigger
			`transform: translateX(-50%)`,
			`max-width: min(600px, 80vw)`,
			`font-family: 'Lora', Georgia, serif`,
			`font-size: ${fontSize}`,
			`font-weight: ${f.fontWeight}`,
			`color: ${f.color}`,
			`line-height: ${f.lineHeight}`,
			`text-align: ${f.xOffset === 0 ? 'center' : 'left'}`,
			`opacity: 0`, // Start hidden; GSAP or reduced-motion logic sets final opacity
			`will-change: transform`,
			`pointer-events: none`,
			`padding: 0 16px`
		].join('; ');
	}
</script>

<!-- Fragments are absolutely positioned inside the 5000px scroll container -->
{#each BEACH_FRAGMENTS as fragment (fragment.id)}
	<p
		id={fragment.id}
		bind:this={fragmentEls[fragment.id]}
		style={fragmentStyle(fragment)}
	>
		{fragment.text}
	</p>
{/each}

<style>
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
