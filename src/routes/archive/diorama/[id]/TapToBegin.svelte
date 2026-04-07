<script lang="ts">
	import { currentLanguage, translate } from '$lib/i18n';

	interface Props {
		onBegin: () => void; // Called after user taps — parent resumes AudioContext
	}

	let { onBegin }: Props = $props();
	let visible = $state(true);

	function handleTap(): void {
		visible = false;
		onBegin();
	}
</script>

{#if visible}
	<button
		onclick={handleTap}
		style="
			position: fixed; top: 0; left: 0;
			width: 100%; height: 100%;
			z-index: 200;
			background: rgba(0, 0, 0, 0.6);
			display: flex; align-items: center; justify-content: center;
			cursor: pointer;
			border: none;
		"
		aria-label={translate($currentLanguage, 'diorama_tap_to_begin')}
	>
		<span style="
			font-family: 'Lora', Georgia, serif;
			font-size: 18px;
			font-weight: 400;
			color: rgba(255, 255, 255, 0.7);
			letter-spacing: 0.05em;
			pointer-events: none;
		">
			{translate($currentLanguage, 'diorama_tap_to_begin')}
		</span>
	</button>
{/if}
