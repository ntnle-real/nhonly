<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { currentLanguage, translate } from '$lib/i18n';
	import { getDioramaById } from '$lib/diorama.catalog';
	import DioramaCanvas from './DioramaCanvas.svelte';
	import DioramaFragments from './DioramaFragments.svelte';
	import TapToBegin from './TapToBegin.svelte';
	import { initAudio, type AudioHandle } from '$lib/diorama.audio';
	import { triggerJumpHaptic, triggerWaterHaptic } from '$lib/diorama.haptics';

	const dioramaId = $derived($page.params.id);
	const diorama = $derived(getDioramaById(dioramaId));

	let audioHandle: AudioHandle | null = $state(null);

	// Haptic fire-once flags
	let jumpHapticFired = false;
	let waterHapticFired = false;
	let impactFired = false;
	let murmurStarted = false;

	onMount(() => {
		if (!diorama) {
			goto('/archive');
			return;
		}
		audioHandle = initAudio();
		window.addEventListener('scroll', handleScroll, { passive: true });
	});

	onDestroy(() => {
		window.removeEventListener('scroll', handleScroll);
		audioHandle?.destroy();
		audioHandle = null;
	});

	function handleBegin(): void {
		// Called when user taps TapToBegin overlay
		audioHandle?.resume();
	}

	function handleExit(): void {
		audioHandle?.destroy();
		goto('/archive');
	}

	function handleScroll(): void {
		const scrollY = window.scrollY;

		// Fragment 3 (~1400px): start market murmur
		if (!murmurStarted && scrollY >= 1200) {
			audioHandle?.setMarketMurmurVolume(0.15);
			murmurStarted = true;
		}

		// Fragment 4 (~2200px): jump haptic
		if (!jumpHapticFired && scrollY >= 2200) {
			triggerJumpHaptic();
			jumpHapticFired = true;
			// Peak market murmur at jump
			audioHandle?.setMarketMurmurVolume(0.2);
		}

		// Fragment 5 (~3200px): water impact — haptic + sound
		if (!waterHapticFired && scrollY >= 3200) {
			triggerWaterHaptic();
			audioHandle?.triggerImpact();
			waterHapticFired = true;
			impactFired = true;
			// Fade murmur after impact
			audioHandle?.setMarketMurmurVolume(0.1);
		}
	}
</script>

<svelte:head>
	<title>{diorama?.title ?? 'Experience'}</title>
	<style>
		nav, header.site-header { display: none !important; }
		body { background: #0d0d0d; }
	</style>
</svelte:head>

<!-- Background -->
<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background: #0d0d0d;"></div>

<!-- Three.js particle atmosphere (fixed, full-screen) -->
<DioramaCanvas />

<!-- Tap-to-begin overlay -->
<TapToBegin onBegin={handleBegin} />

<!-- Scrollable content — body scrolls normally, canvas stays fixed behind -->
<div style="position: relative; height: 5000px; width: 100%; z-index: 2;">
	<DioramaFragments scrollContainer={null} />
</div>

<!-- Exit button (">>" top-left, always visible) -->
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
