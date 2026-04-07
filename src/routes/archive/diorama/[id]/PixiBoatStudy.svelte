<script lang="ts">
	import { onMount } from 'svelte';
	import { createThungChaiStudy, type ThungChaiStudyHandle } from '$lib/pixi/thungChaiStudy';

	let host: HTMLDivElement;
	let errorMessage = $state<string | null>(null);

	onMount(() => {
		let disposed = false;
		let handle: ThungChaiStudyHandle | null = null;

		createThungChaiStudy(host)
			.then((result) => {
				if (disposed) {
					result.destroy();
					return;
				}

				handle = result;
			})
			.catch((error) => {
				errorMessage = error instanceof Error ? error.message : 'Pixi study failed to initialize.';
			});

		return () => {
			disposed = true;
			handle?.destroy();
			handle = null;
		};
	});
</script>

<div class="study-shell">
	<div bind:this={host} class="study-canvas"></div>
	<div class="study-copy">
		<p class="study-label">Pixi Study</p>
		<h2>Thúng chai near the waterline</h2>
		<p>
			Isolated object study for the living diorama. This is intentionally narrow: one boat,
			one water field, one small rocking motion.
		</p>
		{#if errorMessage}
			<p class="study-error">{errorMessage}</p>
		{/if}
	</div>
</div>

<style>
	.study-shell {
		display: grid;
		gap: 1rem;
	}

	.study-canvas {
		min-height: 20rem;
		border-radius: 1.5rem;
		overflow: hidden;
		background: #071818;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
	}

	.study-copy {
		max-width: 36rem;
		color: rgba(255, 255, 255, 0.72);
	}

	.study-label {
		margin: 0 0 0.35rem;
		font-family: var(--font-body);
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgba(226, 215, 176, 0.72);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-family: var(--font-display);
		font-size: clamp(1.25rem, 2vw, 1.7rem);
		font-weight: 400;
		color: rgba(255, 255, 255, 0.92);
	}

	.study-copy p {
		margin: 0;
		font-family: var(--font-body);
		line-height: 1.55;
	}

	.study-error {
		margin-top: 0.75rem;
		color: #ffb88d;
	}
</style>
