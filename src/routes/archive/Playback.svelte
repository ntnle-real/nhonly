<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { translate } from '$lib/i18n';

	interface PlaybackStory {
		id: number;
		title: string;
		dateFormatted: string;
		durationFormatted: string;
		audioBlob: Blob;
	}

	let {
		story = null,
		currentLanguage = 'en',
		onClose = () => {},
		onPlaybackEnded = () => {}
	} = $props();

	let audioElement: HTMLAudioElement | null = $state(null);
	let audioURL: string | null = $state(null);
	let currentTime: number = $state(0);
	let duration: number = $state(0);
	let isPlaying: boolean = $state(false);
	let hasError: boolean = $state(false);
	let errorMessage: string = $state('');

	function formatTime(ms: number): string {
		const totalSeconds = Math.floor(ms);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}

	function handleTimeUpdate(): void {
		if (audioElement) {
			currentTime = audioElement.currentTime;
		}
	}

	function handlePlaybackEnded(): void {
		onPlaybackEnded();
	}

	function handlePlaybackError(): void {
		hasError = true;
		errorMessage = translate(currentLanguage, 'playback_error_body');
	}

	function handlePlayPause(): void {
		if (audioElement) {
			if (isPlaying) {
				audioElement.pause();
			} else {
				audioElement.play();
			}
		}
	}

	function handleReplay(): void {
		if (audioElement) {
			audioElement.currentTime = 0;
			audioElement.play();
		}
	}

	function handleProgressBarClick(e: MouseEvent): void {
		if (audioElement && duration > 0) {
			const bar = e.currentTarget as HTMLDivElement;
			const rect = bar.getBoundingClientRect();
			const percent = (e.clientX - rect.left) / rect.width;
			audioElement.currentTime = percent * duration;
		}
	}

	onMount(() => {
		if (!story) return;

		try {
			// Create blob URL
			audioURL = URL.createObjectURL(story.audioBlob);

			// Set up audio element
			if (audioElement) {
				audioElement.src = audioURL;
				audioElement.addEventListener('timeupdate', handleTimeUpdate);
				audioElement.addEventListener('ended', handlePlaybackEnded);
				audioElement.addEventListener('error', handlePlaybackError);
				audioElement.addEventListener('play', () => (isPlaying = true));
				audioElement.addEventListener('pause', () => (isPlaying = false));

				// Get duration
				audioElement.onloadedmetadata = () => {
					duration = audioElement?.duration || 0;
				};
			}
		} catch (err) {
			hasError = true;
			errorMessage = translate(currentLanguage, 'playback_error_body');
		}
	});

	onDestroy(() => {
		if (audioElement) {
			audioElement.pause();
			audioElement.removeEventListener('timeupdate', handleTimeUpdate);
			audioElement.removeEventListener('ended', handlePlaybackEnded);
			audioElement.removeEventListener('error', handlePlaybackError);
		}
		if (audioURL) {
			URL.revokeObjectURL(audioURL);
		}
	});
</script>

<!-- Invisible audio element -->
<audio bind:this={audioElement}></audio>

{#if hasError}
	<!-- Error State -->
	<div class="flex flex-col items-center justify-center min-h-[400px] text-center">
		<p class="text-3xl mb-4">⚠</p>
		<h2 class="font-display text-2xl text-white/90 mb-3">
			{translate(currentLanguage, 'playback_error_heading')}
		</h2>
		<p class="font-body text-base text-white/70 max-w-xs mb-8 leading-relaxed">
			{errorMessage}
		</p>
		<button
			onclick={onClose}
			class="font-body text-base font-semibold text-white bg-teal hover:bg-teal-light px-8 py-3 rounded-md min-h-[52px] transition-colors"
		>
			{translate(currentLanguage, 'playback_error_cta')}
		</button>
	</div>
{:else}
	<!-- Playback Content -->
	<div class="relative flex flex-col items-center justify-center min-h-[400px]">
		<!-- Close button (top-right) -->
		<button
			onclick={onClose}
			class="absolute top-0 right-0 w-8 h-8 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors text-xl"
			aria-label="Close playback"
		>
			✕
		</button>

		<!-- Story info (centered) -->
		<div class="text-center max-w-lg mb-12">
			<h2 class="font-display text-2xl text-white/90 mb-3">
				{story?.title || ''}
			</h2>
			<p class="font-body text-base text-sand/70">
				{story?.dateFormatted} · {story?.durationFormatted}
			</p>
		</div>

		<!-- Progress bar -->
		<div class="w-full max-w-sm mb-4">
			<div
				onclick={handleProgressBarClick}
				class="w-full h-1 bg-white/10 rounded-full cursor-pointer hover:h-1.5 transition-all"
			>
				<div
					class="h-full bg-teal-light rounded-full"
					style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
				></div>
			</div>
		</div>

		<!-- Time display -->
		<p class="font-mono text-sm text-white/60 mb-8 w-full max-w-sm text-center">
			{formatTime(currentTime)} / {formatTime(duration)}
		</p>

		<!-- Play/Pause button -->
		<button
			onclick={handlePlayPause}
			class="font-body text-2xl text-white bg-teal-light hover:bg-teal-light/90 w-14 h-14 rounded-lg flex items-center justify-center transition-colors mb-4"
		>
			{isPlaying ? '⏸' : '▶'}
		</button>

		<!-- Replay button -->
		<button
			onclick={handleReplay}
			class="font-body text-xl text-white bg-white/8 hover:bg-white/12 w-14 h-14 rounded-lg flex items-center justify-center transition-colors"
		>
			↻
		</button>
	</div>
{/if}
