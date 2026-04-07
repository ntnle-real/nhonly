<!-- MARK: SCENE(Diorama) -> Living Memory Render -->
<!-- Purpose: Render the boy-on-beach memory as a vertical scroll sequence of witnessed fragments. -->
<!-- Success: 8 fragments surface through scroll; GSAP scrub provides weighted progression; Three.js renders abstract environment. -->
<!-- Failure: Invalid diorama id redirects to /archive. -->

<script lang="ts">
	/**
	 * @component DioramaScene
	 * @serves "witnessed memory sequence — The Boy on the Beach, Nhơn Lý, 1976"
	 * @declares "diorama_id" "memory_scene"
	 */

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { currentLanguage, translate } from '$lib/i18n';
	import { getDioramaById } from '$lib/diorama.catalog';
	import DioramaCanvas from './DioramaCanvas.svelte';
	import PixiBoatStudy from './PixiBoatStudy.svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
	import { createObservationSession } from '$lib/obs';

	// MARK: DATA — Locked fragment sequence (Bilingual)
	const FRAGMENTS_EN = [
		'Nhơn Lý, 1976...',
		'The water holds the golden light...',
		'Fish smell comes up from the sand...',
		'Thúng chai of bamboo float in the waves...',
		'Houses sit close to the water...',
		'Women crouch beside baskets of fish...',
		'A naked boy runs toward the ocean...',
		'He jumps...',
	] as const;

	const FRAGMENTS_VI = [
		'Nhơn Lý, 1976...',
		'Nước ôm lấy ánh sáng vàng...',
		'Mùi cá bốc lên từ cát...',
		'Thúng chai tre dập dềnh trên sóng...',
		'Những ngôi nhà nằm sát mép nước...',
		'Những người phụ nữ ngồi xổm bên rổ cá...',
		'Một cậu bé trần truồng chạy về phía đại dương...',
		'Cậu nhảy xuống...',
	] as const;

	const ZONE_COUNT = FRAGMENTS_EN.length + 2;

	// MARK: STATE
	let outerEl: HTMLDivElement;
	let scrollContent: HTMLDivElement;
	const obs = createObservationSession();

	// Proxy object for GSAP to animate
	let sceneState = $state({
		progress: 0,
		warmth: 0
	});

	const dioramaId = $derived($page.params.id ?? '');
	const diorama = $derived(getDioramaById(dioramaId));
	const fragments = $derived($currentLanguage === 'vi' ? FRAGMENTS_VI : FRAGMENTS_EN);

	const activeFragment = $derived(
		sceneState.progress < fragments.length
			? fragments[Math.min(Math.floor(sceneState.progress), fragments.length - 1)]
			: sceneState.progress < fragments.length + 1
				? fragments[fragments.length - 1]
				: null
	);

	// MARK: FUNCTION(calcTextOpacity) -> Per-zone text opacity
	function calcTextOpacity(p: number): number {
		const i = Math.floor(p);
		const t = p - i;
		if (p < 0) return 0;
		if (i < fragments.length) {
			if (t < 0.13) return t / 0.13;
			if (t > 0.87) return (1 - t) / 0.13;
			return 1;
		}
		if (i === fragments.length) return Math.max(0, 1 - t);
		return 0;
	}

	const textOpacity = $derived(calcTextOpacity(sceneState.progress));

	// MARK: FUNCTION(calcBoatOpacity) -> Thúng chai presence window
	// Purpose: Surface the thúng chai Pixi study during the waterline fragment only.
	// Success: Opacity peaks at fragment 3 (progress 3–4.5), zero elsewhere.
	// Failure: Returns 0 (safe default — study stays hidden).
	function calcBoatOpacity(p: number): number {
		if (p < 2.5) return 0;
		if (p < 3.2) return (p - 2.5) / 0.7;
		if (p < 4.5) return 1;
		if (p < 5.2) return 1 - (p - 4.5) / 0.7;
		return 0;
	}

	const boatOpacity = $derived(calcBoatOpacity(sceneState.progress));

	onMount(() => {
		obs.read("diorama_id", dioramaId);
		if (!diorama) { 
			obs.observe("invalid_diorama_redirect", dioramaId);
			goto('/archive'); 
			return; 
		}

		obs.step("init_gsap_scrolltrigger");
		gsap.registerPlugin(ScrollTrigger);

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: scrollContent,
				start: "top top",
				end: "bottom bottom",
				scrub: 1.5, // High viscosity for "effort of remembering"
				scroller: outerEl
			}
		});

		tl.to(sceneState, {
			progress: ZONE_COUNT,
			warmth: 1,
			ease: "none"
		});

		obs.observe("diorama_mounted", dioramaId);

		return () => {
			ScrollTrigger.getAll().forEach(t => t.kill());
		};
	});
</script>

<svelte:head>
	<title>{diorama ? ($currentLanguage === 'vi' ? diorama.titleVi : diorama.title) : 'Diorama'}</title>
</svelte:head>

{#if diorama}
	<div
		class="diorama-outer"
		bind:this={outerEl}
		role="main"
		aria-label="Living memory: {diorama.title}"
	>
		<!-- Atmospheric background — Three.js Scene -->
		<div class="scene-sticky" aria-hidden="true">
			<DioramaCanvas 
				progress={sceneState.progress} 
				warmth={sceneState.warmth} 
			/>
		</div>

		<!-- Pixi boat study — thúng chai experimental layer (fragment 3 window) -->
		<div class="boat-study-sticky" aria-hidden="true" style="opacity: {boatOpacity};">
			<div class="boat-study-panel">
				<PixiBoatStudy />
			</div>
		</div>

		<!-- Text overlay — pinned to top -->
		<div class="text-sticky" aria-live="polite" aria-atomic="true">
			<div class="diorama-exit">
				<a href="/archive" class="exit-link">← {translate($currentLanguage, 'archive_nav')}</a>
			</div>

			<div class="content-stage">
				{#if activeFragment !== null}
					<p
						class="fragment-text"
						style="opacity: {textOpacity};"
					>
						{activeFragment}
					</p>
				{/if}
			</div>
		</div>

		<!-- Scroll spacer — drives the ScrollTrigger -->
		<div
			class="scroll-space"
			bind:this={scrollContent}
			style="height: {ZONE_COUNT * 100}vh;"
			aria-hidden="true"
		></div>
	</div>
{/if}

<style>
	.diorama-outer {
		position: fixed;
		inset: 0;
		overflow-y: scroll;
		scrollbar-width: none;
		background: #071818;
	}

	.diorama-outer::-webkit-scrollbar {
		display: none;
	}

	.scene-sticky {
		position: sticky;
		top: 0;
		height: 100vh;
		overflow: hidden;
		z-index: 1;
	}

	.boat-study-sticky {
		position: sticky;
		top: 0;
		height: 100vh;
		margin-top: -100vh;
		z-index: 2;
		pointer-events: none;
		transition: opacity 0.9s ease;
	}

	.boat-study-panel {
		position: absolute;
		bottom: 2.5rem;
		left: 2.5rem;
		width: min(420px, 90vw);
	}

	.text-sticky {
		position: sticky;
		top: 0;
		height: 100vh;
		margin-top: -100vh;
		z-index: 3;
		pointer-events: none;
	}

	.scroll-space {
		position: relative;
		z-index: 0;
	}

	.diorama-exit {
		position: absolute;
		top: 2rem;
		left: 2rem;
		pointer-events: all;
		z-index: 10;
	}

	.exit-link {
		font-family: var(--font-body);
		font-size: 0.875rem;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.4);
		text-decoration: none;
		transition: color 0.4s ease;
	}

	.exit-link:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	.content-stage {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.fragment-text {
		font-family: var(--font-display);
		font-size: clamp(1.5rem, 4vw, 2.5rem);
		font-weight: 300;
		color: rgba(255, 255, 255, 0.9);
		text-align: center;
		max-width: 40rem;
		line-height: 1.4;
		margin: 0;
		text-shadow: 0 4px 12px rgba(0,0,0,0.3);
		will-change: opacity;
	}
</style>


