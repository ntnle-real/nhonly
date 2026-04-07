<!-- MARK: FUNCTION(ExhibitPlacard) -> Museum Placard Display -->
<!-- Purpose: Display exhibit metadata as minimal museum-style placard text. -->
<!-- Success: Placard renders with bilingual names and context text; styling is muted and readable. -->
<!-- Failure: Missing exhibit data rejected at component load; empty placard not rendered. -->

<script lang="ts">
	import { currentLanguage } from '$lib/i18n';
	import type { DioramaExhibit } from '$lib/diorama.exhibits';

	let { exhibit }: { exhibit: DioramaExhibit } = $props();

	const isVi = $derived($currentLanguage === 'vi');
	const displayName = $derived(isVi ? exhibit.nameVi : exhibit.nameEn);
	const displayText = $derived(isVi ? exhibit.placarTextVi : exhibit.placarTextEn);
</script>

<article class="placard">
	<header class="placard-header">
		<h3 class="placard-title">{displayName}</h3>
		{#if exhibit.confidence}
			<span class="placard-badge">{exhibit.confidence}</span>
		{/if}
	</header>

	<p class="placard-text">{displayText}</p>

	{#if exhibit.source}
		<footer class="placard-source">
			<span class="source-label">Source:</span> {exhibit.source}
		</footer>
	{/if}
</article>

<style>
	.placard {
		background: rgba(255, 255, 255, 0.95);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 4px;
		padding: 1.5rem;
		margin: 1.5rem 0;
		font-size: 0.95rem;
		line-height: 1.6;
		color: #333;
		transition: all 0.3s ease;
	}

	.placard-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 1rem;
		border-bottom: 2px solid rgba(0, 0, 0, 0.08);
		padding-bottom: 0.75rem;
	}

	.placard-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 500;
		color: #1a1a1a;
		font-family: var(--font-display);
	}

	.placard-badge {
		display: inline-block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.5rem;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 2px;
		color: #666;
	}

	.placard-text {
		margin: 0;
		color: #444;
		font-size: 0.95rem;
	}

	.placard-source {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		font-size: 0.85rem;
		color: #888;
		font-style: italic;
	}

	.source-label {
		font-weight: 500;
		color: #999;
	}

	@media (prefers-color-scheme: dark) {
		.placard {
			background: rgba(30, 30, 30, 0.95);
			border-color: rgba(255, 255, 255, 0.1);
			color: #ddd;
		}

		.placard-title {
			color: #fff;
		}

		.placard-badge {
			background: rgba(255, 255, 255, 0.08);
			color: #aaa;
		}

		.placard-text {
			color: #bbb;
		}

		.placard-source {
			border-top-color: rgba(255, 255, 255, 0.05);
			color: #888;
		}

		.source-label {
			color: #999;
		}
	}
</style>
