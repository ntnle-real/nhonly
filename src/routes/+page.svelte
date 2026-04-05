<script lang="ts">
	import { t, setLanguage, currentLanguage } from '$lib/i18n';
	import { startRecording, stopRecording, getElapsedMs, isRecording } from '$lib/recording';
	import { initDatabase, saveStory } from '$lib/archive';
	import { onMount } from 'svelte';

	let recordingState: 'idle' | 'recording' | 'stopped' = $state('idle');
	let elapsedMs = $state(0);
	let audioBlob: Blob | null = $state(null);
	let storyTitle = $state('');
	let statusMessage = $state('');

	// MARK: initialization
	// Initialize database on mount
	onMount(() => {
		initDatabase();
		// Update elapsed time during recording
		const interval = setInterval(() => {
			if (isRecording()) {
				elapsedMs = getElapsedMs();
			}
		}, 100);
		return () => clearInterval(interval);
	});

	// MARK: tell-story button
	// Start recording when user taps "Tell your story"
	async function handleStartRecording() {
		try {
			await startRecording();
			recordingState = 'recording';
			elapsedMs = 0;
			statusMessage = '';
		} catch (error) {
			statusMessage = 'Microphone access denied';
		}
	}

	// MARK: stop-recording button
	// Stop recording and prepare for archival
	async function handleStopRecording() {
		try {
			audioBlob = await stopRecording();
			recordingState = 'stopped';
			storyTitle = '';
		} catch (error) {
			statusMessage = 'Failed to stop recording';
		}
	}

	// MARK: archive button
	// Save story to IndexedDB with title and timestamp
	async function handleArchive() {
		if (!audioBlob || !storyTitle.trim()) {
			statusMessage = 'Please enter a title';
			return;
		}

		try {
			await saveStory(storyTitle, audioBlob);
			statusMessage = t('story_archived');
			recordingState = 'idle';
			storyTitle = '';
			audioBlob = null;
			setTimeout(() => {
				statusMessage = '';
			}, 3000);
		} catch (error) {
			statusMessage = 'Failed to archive story';
		}
	}

	// MARK: language switcher
	function toggleLanguage() {
		let current: 'en' | 'vi' = 'en';
		currentLanguage.subscribe((lang) => {
			current = lang;
		})();
		setLanguage(current === 'en' ? 'vi' : 'en');
	}

	function formatTime(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<!-- MARK: main page -->
<div>
	<header>
		<h1>nhonly</h1>
		<button onclick={toggleLanguage}>{$currentLanguage.toUpperCase()}</button>
	</header>

	<!-- MARK: idle state — tell story button -->
	{#if recordingState === 'idle'}
		<section>
			<button onclick={handleStartRecording}>{t('tell_story')}</button>
		</section>
	{/if}

	<!-- MARK: recording state — timer and stop button -->
	{#if recordingState === 'recording'}
		<section>
			<div class="timer">{formatTime(elapsedMs)}</div>
			<p>{t('saved_as_you_go')}</p>
			<button onclick={handleStopRecording}>{t('stop_recording')}</button>
		</section>
	{/if}

	<!-- MARK: stopped state — playback, title input, archive button -->
	{#if recordingState === 'stopped'}
		<section>
			<p>{t('story_title')}</p>
			<input type="text" bind:value={storyTitle} placeholder={t('story_title')} />
			<button onclick={handleArchive}>{t('archive_button')}</button>
		</section>
	{/if}

	<!-- MARK: status message -->
	{#if statusMessage}
		<p>{statusMessage}</p>
	{/if}
</div>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	section {
		margin: 1rem 0;
	}

	.timer {
		font-size: 3rem;
		font-weight: bold;
		text-align: center;
		margin: 2rem 0;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		margin: 0.5rem 0;
	}

	button {
		padding: 0.75rem 1.5rem;
		margin: 0.5rem 0.25rem;
		cursor: pointer;
	}

	p {
		margin: 0.5rem 0;
	}
</style>
