<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getFrequencyData, setRAFId } from './waveform';

	let { isRecording = false }: { isRecording?: boolean } = $props();

	let canvasElement: HTMLCanvasElement | undefined;
	let animationFrameId: number | null = null;

	onMount(() => {
		if (!canvasElement) return;

		const canvas = canvasElement;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Set canvas size (retina-aware)
		const dpr = window.devicePixelRatio || 1;
		canvas.width = canvas.clientWidth * dpr;
		canvas.height = canvas.clientHeight * dpr;
		ctx.scale(dpr, dpr);

		const draw = () => {
			if (!ctx || !isRecording) return;

			// Get frequency data from analyser
			const data = getFrequencyData();

			// Clear canvas
			ctx.fillStyle = '#fafafa';
			ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

			// Draw frequency bars
			const barWidth = canvas.clientWidth / data.length;
			const barHeight = canvas.clientHeight;

			for (let i = 0; i < data.length; i++) {
				const normalizedHeight = (data[i] / 255) * barHeight;

				// Color gradient: green (low) → red (high)
				const hue = (120 * (1 - data[i] / 255)) | 0; // 120=green, 0=red
				ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

				ctx.fillRect(i * barWidth, barHeight - normalizedHeight, barWidth * 0.8, normalizedHeight);
			}

			// Request next frame
			animationFrameId = requestAnimationFrame(draw);
			setRAFId(animationFrameId);
		};

		animationFrameId = requestAnimationFrame(draw);
		setRAFId(animationFrameId);
	});

	onDestroy(() => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<canvas bind:this={canvasElement} class="waveform-canvas"></canvas>

<style>
	.waveform-canvas {
		width: 100%;
		height: 200px;
		background: #fafafa;
		border-radius: 8px;
	}
</style>
