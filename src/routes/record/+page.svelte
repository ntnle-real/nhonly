<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentLanguage, t, translate, setLanguage } from '$lib/i18n';
	import { checkBrowserCapabilities, assertBrowserSupported } from '$lib/capabilities';
	import { classifyError } from '$lib/errors';
	import { startRecording, pauseRecording, resumeRecording, stopRecording, cancelRecording, getElapsedMs } from '$lib/recording';
	import { startWaveformAnalysis, stopWaveformAnalysis } from '$lib/waveform';
	import { createPreviewURL, revokePreviewURL } from '$lib/preview';
	import { saveStory } from '$lib/archive';
	import Waveform from '$lib/waveform.svelte';

	// UI State Machine
	type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'preview' | 'saving' | 'saved' | 'error';
	let recordingState: RecordingState = $state('idle');
	let errorMessage: string = $state('');
	let errorType: 'permission' | 'browser' | 'storage' | 'generic' | null = $state(null);

	// Recording State
	let mediaStream: MediaStream | null = $state(null);
	let elapsedMs: number = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = $state(null);
	let audioBlob: Blob | null = $state(null);
	let previewURL: string | null = $state(null);
	let storyTitle: string = $state('');
	let formattedTime: string = $state('00:00');

	// Format elapsed time as MM:SS
	function formatTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	// Start recording
	async function handleStartRecording(): Promise<void> {
		try {
			recordingState = 'recording';
			errorMessage = '';
			errorType = null;
			elapsedMs = 0;

			// Request microphone access
			mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

			// Start waveform analysis
			startWaveformAnalysis(mediaStream);

			// Start timer
			startTimer();

			// Also call startRecording from the service
			await startRecording();
		} catch (error) {
			const classified = classifyError(error, { operation: 'start recording', api: 'getUserMedia' });
			errorMessage = classified.message;
			errorType = classified.name === 'PermissionError' ? 'permission' :
						classified.name === 'BrowserError' ? 'browser' :
						classified.name === 'StorageError' ? 'storage' : 'generic';
			recordingState = 'error';
			await cleanupAfterError();
		}
	}

	function startTimer(): void {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			elapsedMs += 100;
			formattedTime = formatTime(elapsedMs);
		}, 100);
	}

	function stopTimer(): void {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	// Pause recording
	async function handlePauseRecording(): Promise<void> {
		try {
			await pauseRecording();
			recordingState = 'paused';
			stopTimer();
			stopWaveformAnalysis();
		} catch (error) {
			const classified = classifyError(error, { operation: 'pause recording' });
			errorMessage = classified.message;
			recordingState = 'error';
		}
	}

	// Resume recording
	async function handleResumeRecording(): Promise<void> {
		try {
			await resumeRecording();
			recordingState = 'recording';
			startTimer();
			if (mediaStream) {
				startWaveformAnalysis(mediaStream);
			}
		} catch (error) {
			const classified = classifyError(error, { operation: 'resume recording' });
			errorMessage = classified.message;
			recordingState = 'error';
		}
	}

	// Stop recording
	async function handleStopRecording(): Promise<void> {
		try {
			stopTimer();
			stopWaveformAnalysis();

			audioBlob = await stopRecording();
			if (!audioBlob) {
				throw new Error('Recording failed: no audio blob returned');
			}

			previewURL = createPreviewURL(audioBlob);
			recordingState = 'stopped';
		} catch (error) {
			const classified = classifyError(error, { operation: 'stop recording' });
			errorMessage = classified.message;
			recordingState = 'error';
			await cleanupAfterError();
		}
	}

	// Show preview
	function handleShowPreview(): void {
		recordingState = 'preview';
	}

	// Record again (discard current and start new)
	async function handleRecordAgain(): Promise<void> {
		try {
			// Cancel current recording and cleanup
			await cancelRecording();
			revokePreviewURL();
			audioBlob = null;
			previewURL = null;
			storyTitle = '';
			elapsedMs = 0;
			errorMessage = '';
			errorType = null;

			// Restart
			await handleStartRecording();
		} catch (error) {
			const classified = classifyError(error, { operation: 'record again' });
			errorMessage = classified.message;
			recordingState = 'error';
		}
	}

	// Archive story
	async function handleArchiveStory(): Promise<void> {
		if (!audioBlob || !storyTitle.trim()) {
			errorMessage = t('please_enter_title');
			return;
		}

		try {
			recordingState = 'saving';
			await saveStory(storyTitle, audioBlob);

			recordingState = 'saved';
			revokePreviewURL();

			// Reset after 2 seconds
			setTimeout(() => {
				recordingState = 'idle';
				storyTitle = '';
				audioBlob = null;
				previewURL = null;
			}, 2000);
		} catch (error) {
			const classified = classifyError(error, { operation: 'archive story', api: 'IndexedDB' });
			errorMessage = classified.message;
			errorType = classified.name === 'StorageError' ? 'storage' : 'generic';
			recordingState = 'error';
		}
	}

	// Cancel recording
	async function handleCancel(): Promise<void> {
		try {
			stopTimer();
			stopWaveformAnalysis();
			await cancelRecording();
			revokePreviewURL();
			recordingState = 'idle';
			audioBlob = null;
			previewURL = null;
			storyTitle = '';
			elapsedMs = 0;
			errorMessage = '';
			errorType = null;
		} catch (error) {
			const classified = classifyError(error, { operation: 'cancel recording' });
			errorMessage = classified.message;
			recordingState = 'error';
		}
	}

	async function cleanupAfterError(): Promise<void> {
		try {
			stopTimer();
			stopWaveformAnalysis();
			await cancelRecording();
			revokePreviewURL();
		} catch (_) {
			// Best effort cleanup
		}
	}

	function toggleLanguage(): void {
		const newLang = $currentLanguage === 'en' ? 'vi' : 'en';
		setLanguage(newLang);
	}

	// Verify browser capabilities on mount
	onMount(() => {
		try {
			const caps = checkBrowserCapabilities();
			assertBrowserSupported(caps);
		} catch (error) {
			const classified = classifyError(error, { operation: 'check browser capabilities' });
			errorMessage = classified.message;
			recordingState = 'error';
		}
	});

	// Cleanup on unmount
	onDestroy(async () => {
		stopTimer();
		stopWaveformAnalysis();
		revokePreviewURL();
		await cancelRecording();
	});
</script>

<div class="container">
	<!-- Header -->
	<header class="header">
		<h1>{translate($currentLanguage, 'app_title')}</h1>
		<button onclick={toggleLanguage} class="lang-toggle">
			{$currentLanguage === 'en' ? 'VI' : 'EN'}
		</button>
	</header>

	<!-- Main Content -->
	<main class="main">
		{#if recordingState === 'error'}
			<!-- Error State -->
			<div class="error-box">
				<div class="error-icon">⚠️</div>
				<h2>{translate($currentLanguage, 'error_occurred')}</h2>
				<p>{errorMessage}</p>
				{#if errorType === 'permission'}
					<p class="error-detail">{translate($currentLanguage, 'microphone_required')}</p>
				{:else if errorType === 'browser'}
					<p class="error-detail">{translate($currentLanguage, 'browser_old')}</p>
				{:else if errorType === 'storage'}
					<p class="error-detail">{translate($currentLanguage, 'storage_full')}</p>
				{/if}
				<button onclick={handleCancel} class="btn btn-primary">
					{translate($currentLanguage, 'try_again')}
				</button>
			</div>

		{:else if recordingState === 'idle' && !audioBlob}
			<!-- Idle State -->
			<div class="idle-box">
				<h2>{translate($currentLanguage, 'tell_story')}</h2>
				<p class="subtitle">Share your story with your family</p>
				<button onclick={handleStartRecording} class="btn btn-primary btn-large">
					🎤 {translate($currentLanguage, 'tell_story')}
				</button>
			</div>

		{:else if recordingState === 'recording'}
			<!-- Recording State -->
			<div class="recording-box">
				<div class="status-indicator recording-pulsing">
					<span>{translate($currentLanguage, 'recording')}</span>
				</div>

				<div class="timer">{formattedTime}</div>

				<Waveform isRecording={true} />

				<div class="controls">
					<button onclick={handlePauseRecording} class="btn btn-secondary">
						⏸ {translate($currentLanguage, 'pause')}
					</button>
					<button onclick={handleStopRecording} class="btn btn-danger">
						⏹ {translate($currentLanguage, 'stop_recording')}
					</button>
				</div>
			</div>

		{:else if recordingState === 'paused'}
			<!-- Paused State -->
			<div class="recording-box">
				<div class="status-indicator paused-indicator">
					<span>{translate($currentLanguage, 'paused')}</span>
				</div>

				<div class="timer">{formattedTime}</div>

				<Waveform isRecording={false} />

				<div class="controls">
					<button onclick={handleResumeRecording} class="btn btn-secondary">
						▶ {translate($currentLanguage, 'resume')}
					</button>
					<button onclick={handleStopRecording} class="btn btn-danger">
						⏹ {translate($currentLanguage, 'stop_recording')}
					</button>
				</div>
			</div>

		{:else if recordingState === 'stopped'}
			<!-- Stopped/Preview State -->
			<div class="preview-box">
				<h2>{translate($currentLanguage, 'preview')}</h2>
				<div class="preview-player">
					{#if previewURL}
						<audio controls src={previewURL}></audio>
					{/if}
				</div>

				<div class="controls">
					<button onclick={handleRecordAgain} class="btn btn-secondary">
						🔄 {translate($currentLanguage, 'record_again')}
					</button>
					<button onclick={handleShowPreview} class="btn btn-primary">
						✅ {translate($currentLanguage, 'preview')}
					</button>
				</div>
			</div>

		{:else if recordingState === 'preview'}
			<!-- Save Form State -->
			<div class="form-box">
				<h2>{translate($currentLanguage, 'story_title')}</h2>
				<input
					type="text"
					bind:value={storyTitle}
					placeholder={translate($currentLanguage, 'enter_title')}
					class="input-title"
					maxlength="100"
				/>

				<div class="controls">
					<button onclick={handleCancel} class="btn btn-secondary">
						✕ {translate($currentLanguage, 'cancel')}
					</button>
					<button onclick={handleArchiveStory} class="btn btn-primary">
						💾 {translate($currentLanguage, 'archive_button')}
					</button>
				</div>
			</div>

		{:else if recordingState === 'saving'}
			<!-- Saving State -->
			<div class="saving-box">
				<div class="spinner"></div>
				<h2>{translate($currentLanguage, 'saving_story')}</h2>
			</div>

		{:else if recordingState === 'saved'}
			<!-- Saved State -->
			<div class="saved-box">
				<div class="checkmark">✓</div>
				<h2>{translate($currentLanguage, 'save_confirmation')}</h2>
			</div>
		{/if}
	</main>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		background: #fff;
		border-bottom: 1px solid #eee;
	}

	.header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.lang-toggle {
		padding: 0.5rem 1rem;
		background: #f0f0f0;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 600;
	}

	.lang-toggle:hover {
		background: #e0e0e0;
	}

	.main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.idle-box, .error-box, .recording-box, .preview-box, .form-box, .saving-box, .saved-box {
		background: #fff;
		border-radius: 12px;
		padding: 2rem;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.idle-box h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.subtitle {
		color: #666;
		margin: 0 0 2rem 0;
	}

	.error-box {
		border: 2px solid #ff6b6b;
	}

	.error-icon {
		font-size: 3rem;
		text-align: center;
		margin-bottom: 1rem;
	}

	.error-detail {
		color: #666;
		font-size: 0.9rem;
		margin: 1rem 0;
	}

	.status-indicator {
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.recording-pulsing {
		background: #ffe0e0;
		color: #d92d2d;
		animation: pulse 1s ease-in-out infinite;
	}

	.paused-indicator {
		background: #fffacd;
		color: #b8860b;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.timer {
		font-size: 3rem;
		font-weight: 700;
		text-align: center;
		margin: 1rem 0;
		font-family: 'Courier New', monospace;
		color: #333;
	}

	.controls {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.btn {
		flex: 1;
		padding: 0.75rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #4CAF50;
		color: white;
	}

	.btn-primary:hover {
		background: #45a049;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
	}

	.btn-secondary {
		background: #2196F3;
		color: white;
	}

	.btn-secondary:hover {
		background: #0b7dda;
	}

	.btn-danger {
		background: #f44336;
		color: white;
	}

	.btn-danger:hover {
		background: #da190b;
	}

	.btn-large {
		padding: 1rem;
		font-size: 1.1rem;
	}

	.input-title {
		width: 100%;
		padding: 0.75rem;
		margin: 1rem 0 2rem 0;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
	}

	.input-title:focus {
		outline: none;
		border-color: #4CAF50;
	}

	.preview-player {
		margin: 1rem 0;
	}

	.preview-player audio {
		width: 100%;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #4CAF50;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.saving-box, .saved-box {
		text-align: center;
	}

	.checkmark {
		font-size: 4rem;
		color: #4CAF50;
		margin-bottom: 1rem;
	}

	/* Mobile responsiveness */
	@media (max-width: 600px) {
		.main {
			padding: 1rem;
		}

		.idle-box, .error-box, .recording-box, .preview-box, .form-box, .saving-box, .saved-box {
			padding: 1.5rem;
			max-width: 100%;
		}

		.timer {
			font-size: 2.5rem;
		}

		.controls {
			flex-direction: column;
		}
	}
</style>
