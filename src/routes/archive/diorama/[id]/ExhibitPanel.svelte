<!-- MARK: COMPONENT(ExhibitPanel) -> Exhibit Grouping and Display -->
<!-- Purpose: Surface related exhibits for the current memory fragment as a museum panel. -->
<!-- Success: Exhibits load for fragment; placards render with smooth transitions; bilingual support works. -->
<!-- Failure: No exhibits for fragment; panel hidden gracefully. -->

<script lang="ts">
	import { currentLanguage } from '$lib/i18n';
	import {
		type DioramaExhibit,
		getSupplementalExhibits,
	} from '$lib/diorama.exhibits';
	import ExhibitPlacard from './ExhibitPlacard.svelte';

	let {
		fragmentIndex = 0,
		isVisible = true,
	}: {
		fragmentIndex: number;
		isVisible: boolean;
	} = $props();

	const exhibits = $derived(getSupplementalExhibits(fragmentIndex));
	const hasExhibits = $derived(exhibits.length > 0);
	const panelTitle = $derived(
		$currentLanguage === 'vi' ? 'Tạo tác trưng bày' : 'Exhibit Objects'
	);
</script>

{#if hasExhibits && isVisible}
	<aside class="exhibit-panel" aria-label="Exhibit information">
		<div class="panel-header">
			<h2 class="panel-title">{panelTitle}</h2>
			<span class="panel-count">({exhibits.length})</span>
		</div>

		<div class="exhibit-list">
			{#each exhibits as exhibit (exhibit.id)}
				<div class="exhibit-item">
					<ExhibitPlacard {exhibit} />
				</div>
			{/each}
		</div>
	</aside>
{/if}

<style>
	.exhibit-panel {
		position: absolute;
		bottom: 2.5rem;
		right: 2.5rem;
		width: min(420px, 90vw);
		max-height: 70vh;
		overflow-y: auto;
		pointer-events: all;
		z-index: 4;
	}

	.panel-header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 0.75rem;
	}

	.panel-title {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 400;
		color: rgba(255, 255, 255, 0.9);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.panel-count {
		font-family: var(--font-body);
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.exhibit-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.exhibit-item {
		opacity: 1;
		animation: fadeInUp 0.6s ease;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Scrollbar styling for the panel */
	.exhibit-panel::-webkit-scrollbar {
		width: 6px;
	}

	.exhibit-panel::-webkit-scrollbar-track {
		background: transparent;
	}

	.exhibit-panel::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	.exhibit-panel::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	@media (max-width: 768px) {
		.exhibit-panel {
			bottom: 1.5rem;
			right: 1.5rem;
			width: min(380px, 85vw);
			max-height: 50vh;
		}

		.panel-title {
			font-size: 1rem;
		}
	}
</style>
