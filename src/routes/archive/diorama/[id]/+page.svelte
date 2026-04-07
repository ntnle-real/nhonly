<!-- MARK: SCENE(Diorama) -> Living Memory Render -->
<!-- Purpose: Render the boy-on-beach memory as a vertical scroll sequence of witnessed fragments. -->
<!-- Success: 8 fragments surface one at a time through scroll; background warms toward golden hour; silence state leaves only ocean. -->
<!-- Failure: Invalid diorama id redirects to /archive. -->

<script lang="ts">
	/**
	 * @component DioramaScene
	 * @serves "witnessed memory sequence — The Boy on the Beach, Nhơn Lý, 1976"
	 * @declares "diorama_id" "memory_scene"
	 * @succeeds_if "fragments surface through vertical scroll" "silence state is scroll-earned"
	 */

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { currentLanguage } from '$lib/i18n';
	import { getDioramaById } from '$lib/diorama.catalog';

	// MARK: DATA — Locked fragment sequence
	const FRAGMENTS = [
		'Nhơn Lý, 1976...',
		'The water holds the golden light...',
		'Fish smell comes up from the sand...',
		'Thúng chai of bamboo float in the waves...',
		'Houses sit close to the water...',
		'Women crouch beside baskets of fish...',
		'A naked boy runs toward the ocean...',
		'He jumps...',
	] as const;

	// ZONE_COUNT: 8 fragment zones + 1 text-fade zone + 1 silence zone
	const ZONE_COUNT = FRAGMENTS.length + 2;

	// MARK: STATE
	let outerEl: HTMLDivElement;
	let scrollTop = $state(0);
	let zoneHeight = $state(500); // px per zone; calibrated on mount from element height

	const dioramaId = $derived($page.params.id ?? '');
	const diorama = $derived(getDioramaById(dioramaId));

	// Scroll progress in zone units (0 = start, ZONE_COUNT = complete)
	const progress = $derived(scrollTop / zoneHeight);

	// Warmth 0→1: background warms as memory progresses through the 8 fragment zones
	const warmth = $derived(Math.min(Math.max(progress / FRAGMENTS.length, 0), 1));

	// Active fragment: current zone text, last fragment held through fade zone, null in silence
	const activeFragment = $derived(
		progress < FRAGMENTS.length
			? FRAGMENTS[Math.min(Math.floor(progress), FRAGMENTS.length - 1)]
			: progress < FRAGMENTS.length + 1
				? FRAGMENTS[FRAGMENTS.length - 1] // "He jumps..." persists while fading out
				: null
	);

	// MARK: FUNCTION(calcTextOpacity) -> Per-zone text opacity
	// Fades in over first 13% of zone, holds, fades out over last 13%.
	// In the fade zone after the last fragment, fades from 1→0 continuously.
	function calcTextOpacity(p: number): number {
		const i = Math.floor(p);
		const t = p - i;
		if (p < 0) return 0;
		if (i < FRAGMENTS.length) {
			if (t < 0.13) return t / 0.13;
			if (t > 0.87) return (1 - t) / 0.13;
			return 1;
		}
		if (i === FRAGMENTS.length) return Math.max(0, 1 - t);
		return 0;
	}

	// MARK: FUNCTION(calcTextY) -> Entrance gravity: each fragment arrives gently from below
	function calcTextY(p: number): number {
		const i = Math.floor(p);
		const t = p - i;
		if (i >= FRAGMENTS.length || t >= 0.13) return 0;
		return (1 - t / 0.13) * 14;
	}

	const textOpacity = $derived(calcTextOpacity(progress));
	const textY = $derived(calcTextY(progress));

	onMount(() => {
		if (!diorama) { goto('/archive'); return; }

		// Zone height = 75% of the scroller's visible height; responsive to resize
		zoneHeight = outerEl.clientHeight * 0.75;

		const onScroll = () => { scrollTop = outerEl.scrollTop; };
		const onResize = () => { zoneHeight = outerEl.clientHeight * 0.75; };

		outerEl.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });

		return () => {
			outerEl.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<svelte:head>
	<title>{diorama ? ($currentLanguage === 'vi' ? diorama.titleVi : diorama.title) : 'Diorama'}</title>
</svelte:head>

{#if diorama}
	<!--
		Self-contained scroll viewport — fixed below nav, scrolls internally.
		scene-sticky and text-sticky both pin to top via position: sticky.
		scroll-space creates the scrollable height that drives fragment progression.
	-->
	<div
		class="diorama-outer"
		bind:this={outerEl}
		role="main"
		aria-label="Living memory: {diorama.title}"
	>
		<!-- Atmospheric background — sticky, covers the full content area -->
		<div class="scene-sticky" aria-hidden="true">
			<div class="layer-base"></div>
			<div class="layer-warm" style="opacity: {warmth * 0.85}"></div>
			<div class="layer-haze" style="opacity: {0.25 + warmth * 0.45}"></div>
		</div>

		<!-- Text overlay — sticky, pulled up to overlap scene via negative margin -->
		<div class="text-sticky" aria-live="polite" aria-atomic="true">
			<!-- Exit link — always reachable -->
			<div class="diorama-exit">
				<a href="/archive" class="exit-link">← Archive</a>
			</div>

			<!-- Fragment text — opacity and y-offset driven directly by scroll -->
			<div class="content-stage">
				{#if activeFragment !== null}
					<p
						class="fragment-text"
						style="opacity: {textOpacity}; transform: translateY({textY}px);"
					>
						{activeFragment}
					</p>
				{/if}
			</div>
		</div>

		<!-- Scroll spacer — creates scrollable height; no visual content -->
		<div
			class="scroll-space"
			style="height: {ZONE_COUNT * 75}vh;"
			aria-hidden="true"
		></div>
	</div>
{/if}

<style>
	/* MARK: STYLE — Self-contained scroll viewport */

	/* Fixed below nav, internal scroll, scrollbar hidden */
	.diorama-outer {
		position: fixed;
		top: 65px;
		left: 0;
		right: 0;
		bottom: 0;
		overflow-y: scroll;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.diorama-outer::-webkit-scrollbar {
		display: none;
	}

	/* Atmospheric stage — sticks to top of scroll container for the full scroll duration */
	.scene-sticky {
		position: sticky;
		top: 0;
		height: calc(100vh - 65px);
		overflow: hidden;
		z-index: 1;
	}

	/* Text overlay — same sticky behavior; negative margin pulls it up to overlap the scene */
	.text-sticky {
		position: sticky;
		top: 0;
		height: calc(100vh - 65px);
		margin-top: calc(-1 * (100vh - 65px));
		z-index: 2;
		pointer-events: none;
	}

	/* Scroll spacer — behind sticky layers, provides scrollable height */
	.scroll-space {
		position: relative;
		z-index: 0;
	}

	/* Stable deep ocean base */
	.layer-base {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(
				ellipse 160% 90% at 50% 115%,
				#163a32 0%,
				#0d2828 30%,
				#0a1f1f 65%,
				#071818 100%
			);
	}

	/* Golden-hour warmth — opacity driven by scene progress */
	.layer-warm {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(
				ellipse 95% 60% at 48% 105%,
				rgba(200, 151, 74, 0.55) 0%,
				rgba(212, 164, 58, 0.3) 22%,
				rgba(180, 95, 35, 0.14) 48%,
				transparent 75%
			),
			radial-gradient(
				ellipse 55% 28% at 78% 98%,
				rgba(196, 115, 44, 0.22) 0%,
				transparent 65%
			);
		transition: opacity 4s ease;
	}

	/* Atmospheric haze — slow drift, deepens toward golden hour */
	.layer-haze {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				to bottom,
				transparent 0%,
				rgba(38, 85, 72, 0.05) 35%,
				rgba(38, 85, 72, 0.12) 58%,
				rgba(24, 56, 46, 0.22) 80%,
				rgba(18, 44, 36, 0.32) 100%
			);
		animation: hazeDrift 10s ease-in-out infinite;
		transition: opacity 4s ease;
	}

	@keyframes hazeDrift {
		0%, 100% { transform: translateY(0) scaleX(1); }
		38% { transform: translateY(-5px) scaleX(1.004); }
		70% { transform: translateY(4px) scaleX(0.997); }
	}

	/* Exit link — restore pointer events (parent has pointer-events: none) */
	.diorama-exit {
		position: absolute;
		top: 1.5rem;
		left: 2rem;
		pointer-events: all;
		z-index: 10;
	}

	.exit-link {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		letter-spacing: 0.07em;
		color: rgba(255, 255, 255, 0.28);
		text-decoration: none;
		transition: color 0.4s ease;
	}

	.exit-link:hover {
		color: rgba(255, 255, 255, 0.58);
	}

	/* Fragment stage — centered in the pinned viewport area */
	.content-stage {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 5rem 2.5rem 4rem;
	}

	/* Fragment text — scroll drives opacity and y-offset directly via inline style */
	.fragment-text {
		font-family: var(--font-display);
		font-size: clamp(1.375rem, 3.8vw, 2.625rem);
		font-weight: 400;
		color: rgba(255, 255, 255, 0.88);
		text-align: center;
		max-width: 32rem;
		line-height: 1.5;
		margin: 0;
		padding: 0;
		will-change: opacity, transform;
	}
</style>
