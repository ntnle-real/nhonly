<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { initScene, type SceneHandle } from '$lib/diorama.scene';

	let canvasEl: HTMLCanvasElement;
	let sceneHandle: SceneHandle | null = null;

	onMount(() => {
		if (canvasEl) {
			sceneHandle = initScene(canvasEl);
		}
	});

	onDestroy(() => {
		sceneHandle?.dispose();
		sceneHandle = null;
	});
</script>

<canvas
	bind:this={canvasEl}
	style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  "
></canvas>
