<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentLanguage, translate, setLanguage, initLanguage } from '$lib/i18n';
	import { classifyError } from '$lib/errors';
	import { startRecording, pauseRecording, resumeRecording, stopRecording, cancelRecording } from '$lib/recording';
	import { startWaveformAnalysis, stopWaveformAnalysis } from '$lib/waveform';
	import { createPreviewURL, revokePreviewURL } from '$lib/preview';
	import { saveStory } from '$lib/archive';
	import Waveform from '$lib/waveform.svelte';

	// MARK: Scene state machine
	// landing → recording → paused → stopped → saving → saved → landing
	type Scene = 'landing' | 'recording' | 'paused' | 'stopped' | 'saving' | 'saved' | 'error';
	let scene: Scene = $state('landing');
	let errorMessage: string = $state('');

	// Recording state
	let mediaStream: MediaStream | null = $state(null);
	let elapsedMs: number = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = $state(null);
	let audioBlob: Blob | null = $state(null);
	let previewURL: string | null = $state(null);
	let storyTitle: string = $state('');
	let formattedTime: string = $state('00:00');

	function formatTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

	function toggleLanguage(): void {
		setLanguage($currentLanguage === 'en' ? 'vi' : 'en');
	}

	// MARK: Scene transitions

	async function handleBeginRecording(): Promise<void> {
		scene = 'recording';
		errorMessage = '';
		elapsedMs = 0;
		try {
			mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			startWaveformAnalysis(mediaStream);
			startTimer();
			await startRecording();
		} catch (error) {
			const c = classifyError(error, { operation: 'start recording', api: 'getUserMedia' });
			errorMessage = c.message;
			scene = 'error';
			await cleanup();
		}
	}

	async function handlePause(): Promise<void> {
		try {
			await pauseRecording();
			stopTimer();
			stopWaveformAnalysis();
			scene = 'paused';
		} catch (error) {
			errorMessage = classifyError(error, { operation: 'pause' }).message;
			scene = 'error';
		}
	}

	async function handleResume(): Promise<void> {
		try {
			await resumeRecording();
			startTimer();
			if (mediaStream) startWaveformAnalysis(mediaStream);
			scene = 'recording';
		} catch (error) {
			errorMessage = classifyError(error, { operation: 'resume' }).message;
			scene = 'error';
		}
	}

	async function handleStop(): Promise<void> {
		try {
			stopTimer();
			stopWaveformAnalysis();
			audioBlob = await stopRecording();
			if (!audioBlob) throw new Error('No audio recorded');
			previewURL = createPreviewURL(audioBlob);
			scene = 'stopped';
		} catch (error) {
			errorMessage = classifyError(error, { operation: 'stop recording' }).message;
			scene = 'error';
			await cleanup();
		}
	}

	async function handleRecordAgain(): Promise<void> {
		revokePreviewURL();
		audioBlob = null;
		previewURL = null;
		storyTitle = '';
		elapsedMs = 0;
		await cancelRecording();
		await handleBeginRecording();
	}

	async function handleSave(): Promise<void> {
		if (!audioBlob || !storyTitle.trim()) return;
		try {
			scene = 'saving';
			await saveStory(storyTitle, audioBlob);
			revokePreviewURL();
			scene = 'saved';
			setTimeout(() => {
				scene = 'landing';
				storyTitle = '';
				audioBlob = null;
				previewURL = null;
				elapsedMs = 0;
			}, 3000);
		} catch (error) {
			errorMessage = classifyError(error, { operation: 'save story', api: 'IndexedDB' }).message;
			scene = 'error';
		}
	}

	async function handleReturnToLanding(): Promise<void> {
		await cleanup();
		scene = 'landing';
		errorMessage = '';
		storyTitle = '';
		audioBlob = null;
		previewURL = null;
		elapsedMs = 0;
	}

	async function cleanup(): Promise<void> {
		try {
			stopTimer();
			stopWaveformAnalysis();
			await cancelRecording();
			revokePreviewURL();
		} catch (_) { /* best effort */ }
	}

	onMount(() => {
		initLanguage();
	});

	onDestroy(async () => {
		await cleanup();
	});
</script>

<svelte:head>
	<title>Nhơn Lý</title>
</svelte:head>

<div class="app">

	<!-- ─── SCENE: Landing ──────────────────────────────────── -->
	<div class="scene hero-scene" class:visible={scene === 'landing'}>
		<button class="lang-btn hero-lang" onclick={toggleLanguage}>
			{$currentLanguage === 'en' ? 'VI' : 'EN'}
		</button>

		<div class="hero-content">
			<p class="village-label">Nhơn Lý</p>
			<h1 class="hero-headline">{translate($currentLanguage, 'landing_headline')}</h1>
			<p class="hero-sub">{translate($currentLanguage, 'landing_sub')}</p>
			<button class="cta-btn" onclick={handleBeginRecording}>
				{translate($currentLanguage, 'landing_cta')}
			</button>
		</div>
	</div>

	<!-- ─── SCENE: Recorder (all non-landing states) ─────────── -->
	<div class="scene recorder-scene" class:visible={scene !== 'landing'}>

		<header class="rec-header">
			<span class="rec-title">Nhơn Lý</span>
			<button class="lang-btn" onclick={toggleLanguage}>
				{$currentLanguage === 'en' ? 'VI' : 'EN'}
			</button>
		</header>

		<main class="rec-main">

			{#if scene === 'recording'}
				<div class="card">
					<div class="status-dot recording"></div>
					<p class="status-label">{translate($currentLanguage, 'recording')}</p>
					<div class="timer">{formattedTime}</div>
					<Waveform isRecording={true} />
					<div class="btn-row">
						<button class="btn btn-ghost" onclick={handlePause}>
							⏸&nbsp; {translate($currentLanguage, 'pause')}
						</button>
						<button class="btn btn-stop" onclick={handleStop}>
							⏹&nbsp; {translate($currentLanguage, 'stop_recording')}
						</button>
					</div>
				</div>

			{:else if scene === 'paused'}
				<div class="card">
					<div class="status-dot paused"></div>
					<p class="status-label">{translate($currentLanguage, 'paused')}</p>
					<div class="timer">{formattedTime}</div>
					<Waveform isRecording={false} />
					<div class="btn-row">
						<button class="btn btn-ghost" onclick={handleResume}>
							▶&nbsp; {translate($currentLanguage, 'resume')}
						</button>
						<button class="btn btn-stop" onclick={handleStop}>
							⏹&nbsp; {translate($currentLanguage, 'stop_recording')}
						</button>
					</div>
				</div>

			{:else if scene === 'stopped'}
				<div class="card">
					<p class="section-label">{translate($currentLanguage, 'preview')}</p>
					{#if previewURL}
						<audio class="audio-player" controls src={previewURL}></audio>
					{/if}
					<input
						class="title-input"
						type="text"
						bind:value={storyTitle}
						placeholder={translate($currentLanguage, 'enter_title')}
						maxlength="100"
					/>
					<div class="btn-row">
						<button class="btn btn-ghost" onclick={handleRecordAgain}>
							🔄&nbsp; {translate($currentLanguage, 'record_again')}
						</button>
						<button
							class="btn btn-save"
							onclick={handleSave}
							disabled={!storyTitle.trim()}
						>
							💾&nbsp; {translate($currentLanguage, 'archive_button')}
						</button>
					</div>
				</div>

			{:else if scene === 'saving'}
				<div class="card center">
					<div class="spinner"></div>
					<p class="status-label">{translate($currentLanguage, 'saving_story')}</p>
				</div>

			{:else if scene === 'saved'}
				<div class="card center">
					<div class="checkmark">✓</div>
					<p class="status-label">{translate($currentLanguage, 'save_confirmation')}</p>
				</div>

			{:else if scene === 'error'}
				<div class="card center">
					<p class="error-icon">⚠</p>
					<p class="status-label">{translate($currentLanguage, 'error_occurred')}</p>
					<p class="error-msg">{errorMessage}</p>
					<button class="btn btn-save" onclick={handleReturnToLanding}>
						{translate($currentLanguage, 'try_again')}
					</button>
				</div>
			{/if}

		</main>
	</div>

</div>

<style>
	/* ─── Layout ──────────────────────────────────────────── */
	.app {
		position: relative;
		width: 100%;
		min-height: 100vh;
		font-family: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;
	}

	.scene {
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.45s ease;
	}

	.scene.visible {
		opacity: 1;
		pointer-events: auto;
	}

	/* ─── Hero scene ──────────────────────────────────────── */
	.hero-scene {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: linear-gradient(160deg, #0d3b3b 0%, #1b6b7b 45%, #c8974a 100%);
	}

	.hero-scene::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.38);
	}

	.hero-lang {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 2;
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.4);
		color: #fff;
		backdrop-filter: blur(4px);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		text-align: center;
		color: #fff;
		padding: 2rem;
		max-width: 600px;
		width: 100%;
	}

	.village-label {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.35em;
		text-transform: uppercase;
		color: #e2d7b0;
		margin: 0 0 1.25rem;
		opacity: 0.9;
	}

	.hero-headline {
		font-size: clamp(1.9rem, 5vw, 3.1rem);
		font-weight: 700;
		line-height: 1.2;
		margin: 0 0 0.9rem;
	}

	.hero-sub {
		font-size: clamp(0.95rem, 2.5vw, 1.15rem);
		font-weight: 300;
		line-height: 1.65;
		color: rgba(255, 255, 255, 0.82);
		margin: 0 0 2.5rem;
	}

	.cta-btn {
		display: inline-block;
		background: #FF773E;
		color: #fff;
		border: none;
		font-family: inherit;
		font-size: 1.1rem;
		font-weight: 600;
		padding: 1rem 2.5rem;
		border-radius: 6px;
		min-height: 52px;
		cursor: pointer;
		transition: background 0.2s, transform 0.15s;
	}

	.cta-btn:hover {
		background: #e8642a;
		transform: translateY(-2px);
	}

	/* ─── Recorder scene ──────────────────────────────────── */
	.recorder-scene {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: #f8f7f4;
	}

	.rec-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		background: #fff;
		border-bottom: 1px solid #e8e4de;
	}

	.rec-title {
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: #1b6b7b;
	}

	.rec-main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
	}

	/* ─── Shared UI ───────────────────────────────────────── */
	.lang-btn {
		padding: 0.4rem 0.85rem;
		background: transparent;
		border: 1px solid currentColor;
		border-radius: 4px;
		font-family: inherit;
		font-weight: 600;
		font-size: 0.8rem;
		letter-spacing: 0.05em;
		cursor: pointer;
		color: #555;
		transition: background 0.2s;
	}

	.lang-btn:hover {
		background: rgba(0, 0, 0, 0.06);
	}

	.card {
		background: #fff;
		border-radius: 16px;
		padding: 2.5rem 2rem;
		max-width: 420px;
		width: 100%;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
	}

	.card.center {
		text-align: center;
	}

	/* Status dot */
	.status-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		margin: 0 auto 0.75rem;
	}

	.status-dot.recording {
		background: #e03e3e;
		animation: pulse 1.2s ease-in-out infinite;
	}

	.status-dot.paused {
		background: #c49a00;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(224, 62, 62, 0.4); }
		50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(224, 62, 62, 0); }
	}

	.status-label {
		font-size: 0.9rem;
		font-weight: 600;
		text-align: center;
		color: #555;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		margin: 0 0 0.5rem;
	}

	.timer {
		font-size: 3.5rem;
		font-weight: 700;
		text-align: center;
		color: #1b1b1b;
		letter-spacing: 0.04em;
		font-variant-numeric: tabular-nums;
		margin: 0.25rem 0 1.25rem;
		font-family: 'Be Vietnam Pro', monospace;
	}

	.section-label {
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #888;
		margin: 0 0 1rem;
	}

	/* Audio player */
	.audio-player {
		width: 100%;
		margin-bottom: 1.25rem;
		border-radius: 8px;
	}

	/* Title input */
	.title-input {
		width: 100%;
		padding: 0.8rem 1rem;
		margin-bottom: 1.5rem;
		border: 2px solid #e0ddd8;
		border-radius: 8px;
		font-family: inherit;
		font-size: 1rem;
		color: #1b1b1b;
		background: #fafaf8;
		box-sizing: border-box;
		transition: border-color 0.2s;
	}

	.title-input:focus {
		outline: none;
		border-color: #1b6b7b;
	}

	/* Buttons */
	.btn-row {
		display: flex;
		gap: 0.75rem;
	}

	.btn {
		flex: 1;
		padding: 0.85rem 1rem;
		min-height: 52px;
		border: none;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, transform 0.1s;
	}

	.btn:active {
		transform: scale(0.98);
	}

	.btn-ghost {
		background: #f0ece6;
		color: #444;
	}

	.btn-ghost:hover {
		background: #e4dfd8;
	}

	.btn-stop {
		background: #e03e3e;
		color: #fff;
	}

	.btn-stop:hover {
		background: #c43333;
	}

	.btn-save {
		background: #1b6b7b;
		color: #fff;
	}

	.btn-save:hover:not(:disabled) {
		background: #155a68;
	}

	.btn-save:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Saving / saved states */
	.spinner {
		width: 44px;
		height: 44px;
		border: 4px solid #e8e4de;
		border-top-color: #1b6b7b;
		border-radius: 50%;
		animation: spin 0.9s linear infinite;
		margin: 0 auto 1.25rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.checkmark {
		font-size: 4rem;
		color: #1b6b7b;
		margin-bottom: 0.75rem;
		line-height: 1;
	}

	/* Error */
	.error-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.error-msg {
		font-size: 0.9rem;
		color: #888;
		margin: 0.5rem 0 1.5rem;
		line-height: 1.5;
	}

	/* Mobile */
	@media (max-width: 480px) {
		.card {
			padding: 2rem 1.25rem;
			border-radius: 12px;
		}

		.timer {
			font-size: 3rem;
		}

		.btn-row {
			flex-direction: column;
		}

		.cta-btn {
			width: 100%;
		}
	}
</style>
