<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { currentLanguage, translate } from '$lib/i18n';
	import { getDioramaById } from '$lib/diorama.catalog';
	import DioramaCanvas from './DioramaCanvas.svelte';

	const dioramaId = $derived($page.params.id);
	const diorama = $derived(getDioramaById(dioramaId));

	function handleExit(): void {
		goto('/archive');
	}

	onMount(() => {
		if (!diorama) {
			goto('/archive');
		}
	});
</script>

<svelte:head>
	<title>{diorama?.title ?? 'Experience'}</title>
	<style>
		/* Hide navbar on diorama route */
		nav, header.site-header { display: none !important; }
		body { overflow: hidden; }
	</style>
</svelte:head>

<!-- Golden hour gradient background -->
<div class="diorama-bg" style="
	position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
	background: linear-gradient(180deg, #2a5a6b 0%, #4a7a8b 25%, #b8956a 50%, #9a7850 75%, #1a3a3f 100%);
"></div>

<!-- Three.js particle atmosphere (fixed, full-screen, pointer-events: none) -->
<DioramaCanvas />

<!-- Scroll container (GSAP fragments added in Plan 03) -->
<div class="scroll-container" style="
	position: relative; width: 100%; height: 5000px; overflow-y: scroll; overflow-x: hidden;
	z-index: 1;
">
	<!-- Text fragments injected here in Plan 03 -->
</div>

<!-- Exit button (">>" top-left) — always on top -->
<button
	onclick={handleExit}
	aria-label={translate($currentLanguage, 'diorama_exit_label')}
	style="
		position: fixed; top: 20px; left: 20px; z-index: 100;
		background: none; border: none; padding: 8px; cursor: pointer;
		font-family: 'Be Vietnam Pro', sans-serif; font-size: 14px; font-weight: 400;
		color: rgba(255, 255, 255, 0.4);
		transition: color 150ms ease;
	"
	onmouseenter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
	onmouseleave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
>
	{translate($currentLanguage, 'diorama_exit')}
</button>
