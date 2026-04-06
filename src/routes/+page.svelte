<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentLanguage, translate, setLanguage } from '$lib/i18n';
	import { classifyError } from '$lib/errors';
	import { startRecording, pauseRecording, resumeRecording, stopRecording, cancelRecording } from '$lib/recording';
	import { startWaveformAnalysis, stopWaveformAnalysis } from '$lib/waveform';
	import { createPreviewURL, revokePreviewURL } from '$lib/preview';
	import { saveStory, initDatabase } from '$lib/archive';
	import Waveform from '$lib/waveform.svelte';

	type Scene = 'landing' | 'recording' | 'paused' | 'stopped' | 'saving' | 'saved' | 'error';
	let scene: Scene = $state('landing');
	let errorMessage: string = $state('');

	let mediaStream: MediaStream | null = $state(null);
	let elapsedMs: number = $state(0);
	let savedDurationMs: number = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = $state(null);
	let audioBlob: Blob | null = $state(null);
	let previewURL: string | null = $state(null);
	let storyTitle: string = $state('');
	let savedTitle: string = $state('');
	let savedAt: Date | null = $state(null);
	let formattedTime: string = $state('00:00');

	function formatTime(ms: number): string {
		const s = Math.floor(ms / 1000);
		return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
	}

	function formatSavedDate(date: Date, lang: string): string {
		return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
			month: 'long', day: 'numeric', year: 'numeric'
		}).format(date);
	}

	function startTimer(): void {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			elapsedMs += 100;
			formattedTime = formatTime(elapsedMs);
		}, 100);
	}

	function stopTimer(): void {
		if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
	}

	function toggleLanguage(): void {
		setLanguage($currentLanguage === 'en' ? 'vi' : 'en');
	}

	async function handleBeginRecording(): Promise<void> {
		scene = 'recording';
		errorMessage = '';
		elapsedMs = 0;
		formattedTime = '00:00';
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
			savedDurationMs = elapsedMs;
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
			await saveStory(storyTitle, audioBlob, savedDurationMs);
			savedTitle = storyTitle;
			savedAt = new Date();
			revokePreviewURL();
			scene = 'saved';
			setTimeout(() => {
				scene = 'landing';
				storyTitle = '';
				audioBlob = null;
				previewURL = null;
				elapsedMs = 0;
			}, 4000);
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

	onMount(async () => { await initDatabase(); });
	onDestroy(async () => { await cleanup(); });
</script>

<svelte:head>
	<title>Nhơn Lý</title>
</svelte:head>

<div class="relative w-full min-h-screen">

	<!-- ─── SCENE: Landing ─────────────────────────────────── -->
	<div
		class="absolute inset-0 flex items-center justify-center min-h-screen transition-opacity duration-[450ms]"
		class:opacity-100={scene === 'landing'}
		class:opacity-0={scene !== 'landing'}
		class:pointer-events-none={scene !== 'landing'}
		style="background: linear-gradient(160deg, #0d3b3b 0%, #1b6b7b 45%, #c8974a 100%)"
	>
		<!-- overlay -->
		<div class="absolute inset-0 bg-black/35"></div>

		<!-- lang toggle -->
		<button
			onclick={toggleLanguage}
			class="absolute top-6 right-6 z-10 px-3 py-1.5 text-xs font-semibold tracking-widest text-white border border-white/40 rounded backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
		>
			{$currentLanguage === 'en' ? 'VI' : 'EN'}
		</button>

		<!-- content -->
		<div class="relative z-10 text-center text-white px-8 max-w-xl">
			<p class="font-display text-xs tracking-[0.4em] uppercase text-sand/90 mb-5">Nhơn Lý</p>
			<h1 class="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
				{translate($currentLanguage, 'landing_headline')}
			</h1>
			<p class="font-body text-base md:text-lg font-light text-white/80 leading-relaxed mb-10">
				{translate($currentLanguage, 'landing_sub')}
			</p>
			<div class="flex flex-col gap-4 w-full max-w-xs mx-auto">
				<button
					onclick={handleBeginRecording}
					class="font-body text-base font-semibold text-white bg-rust hover:bg-[#e8642a] px-10 py-4 rounded-md min-h-[52px] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
				>
					{translate($currentLanguage, 'landing_cta')}
				</button>
				<a
					href="/archive"
					class="font-body text-base font-semibold text-white bg-white/10 hover:bg-white/15 px-6 py-4 rounded-md min-h-[52px] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer inline-block text-center"
				>
					{translate($currentLanguage, 'archive_nav')}
				</a>
			</div>
		</div>
	</div>

	<!-- ─── SCENE: Recorder ────────────────────────────────── -->
	<div
		class="absolute inset-0 flex flex-col min-h-screen bg-teal-deep transition-opacity duration-[450ms]"
		class:opacity-100={scene !== 'landing'}
		class:opacity-0={scene === 'landing'}
		class:pointer-events-none={scene === 'landing'}
	>
		<!-- header -->
		<header class="flex justify-between items-center px-6 py-4 border-b border-white/8">
			<span class="font-display text-sm font-semibold tracking-[0.12em] text-teal-light">Nhơn Lý</span>
			<button
				onclick={toggleLanguage}
				class="px-3 py-1 text-xs font-semibold tracking-widest text-white/50 border border-white/20 rounded hover:text-white/80 hover:border-white/40 transition-colors cursor-pointer"
			>
				{$currentLanguage === 'en' ? 'VI' : 'EN'}
			</button>
		</header>

		<!-- main -->
		<main class="flex-1 flex flex-col items-center justify-center px-6 py-8">

			{#if scene === 'recording' || scene === 'paused'}
				<!-- Status -->
				<div class="flex items-center gap-2 mb-8">
					{#if scene === 'recording'}
						<span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
					{:else}
						<span class="w-2.5 h-2.5 rounded-full bg-amber"></span>
					{/if}
					<span class="font-body text-xs font-semibold tracking-[0.18em] uppercase text-white/50">
						{translate($currentLanguage, scene === 'recording' ? 'recording' : 'paused')}
					</span>
				</div>

				<!-- Waveform — centrepiece -->
				<div class="w-full max-w-md mb-6">
					<Waveform isRecording={scene === 'recording'} />
				</div>

				<!-- Timer — secondary -->
				<p class="font-body text-2xl tabular-nums text-white/40 mb-10 tracking-tight">
					{formattedTime}
				</p>

				<!-- Controls -->
				<div class="flex gap-3 w-full max-w-xs">
					{#if scene === 'recording'}
						<button
							onclick={handlePause}
							class="flex-1 font-body font-semibold text-sm text-white/70 bg-white/8 hover:bg-white/14 py-3.5 rounded-lg min-h-[52px] transition-colors cursor-pointer"
						>
							⏸ &nbsp;{translate($currentLanguage, 'pause')}
						</button>
					{:else}
						<button
							onclick={handleResume}
							class="flex-1 font-body font-semibold text-sm text-white/70 bg-white/8 hover:bg-white/14 py-3.5 rounded-lg min-h-[52px] transition-colors cursor-pointer"
						>
							▶ &nbsp;{translate($currentLanguage, 'resume')}
						</button>
					{/if}
					<button
						onclick={handleStop}
						class="flex-1 font-body font-semibold text-sm text-white bg-teal hover:bg-teal-light py-3.5 rounded-lg min-h-[52px] transition-colors cursor-pointer"
					>
						⏹ &nbsp;{translate($currentLanguage, 'stop_recording')}
					</button>
				</div>

			{:else if scene === 'stopped'}
				<div class="w-full max-w-sm">
					<p class="font-display text-xs tracking-[0.2em] uppercase text-white/40 mb-4">
						{translate($currentLanguage, 'preview')}
					</p>
					{#if previewURL}
						<audio controls src={previewURL} class="w-full rounded-lg mb-5"></audio>
					{/if}
					<input
						type="text"
						bind:value={storyTitle}
						placeholder={translate($currentLanguage, 'enter_title')}
						maxlength="100"
						class="font-body w-full bg-white/6 border border-white/15 focus:border-teal-light text-white placeholder-white/30 rounded-lg px-4 py-3 text-base mb-4 outline-none transition-colors"
					/>
					<div class="flex gap-3">
						<button
							onclick={handleRecordAgain}
							class="flex-1 font-body font-semibold text-sm text-white/60 bg-white/6 hover:bg-white/12 py-3.5 rounded-lg min-h-[52px] transition-colors cursor-pointer"
						>
							🔄 &nbsp;{translate($currentLanguage, 'record_again')}
						</button>
						<button
							onclick={handleSave}
							disabled={!storyTitle.trim()}
							class="flex-1 font-body font-semibold text-sm text-white bg-teal hover:bg-teal-light py-3.5 rounded-lg min-h-[52px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
						>
							{translate($currentLanguage, 'archive_button')}
						</button>
					</div>
				</div>

			{:else if scene === 'saving'}
				<div class="flex flex-col items-center gap-4">
					<div class="w-10 h-10 border-2 border-white/20 border-t-teal-light rounded-full animate-spin"></div>
					<p class="font-body text-sm text-white/50 tracking-wide">
						{translate($currentLanguage, 'saving_story')}
					</p>
				</div>

			{:else if scene === 'saved'}
				<!-- Log entry moment -->
				<div class="text-center">
					<div class="font-body text-5xl text-teal-light mb-6">✓</div>
					<p class="font-body text-xs tracking-[0.2em] uppercase text-white/35 mb-3">
						{translate($currentLanguage, 'saved_log')}
					</p>
					<p class="font-display text-xl font-semibold text-white mb-2">{savedTitle}</p>
					{#if savedAt}
						<p class="font-body text-sm text-white/40 tabular-nums">
							{formatSavedDate(savedAt, $currentLanguage)} · {formatTime(savedDurationMs)}
						</p>
					{/if}
				</div>

			{:else if scene === 'error'}
				<div class="text-center max-w-xs">
					<p class="text-3xl mb-4">⚠</p>
					<p class="font-display text-lg font-semibold text-white mb-2">
						{translate($currentLanguage, 'error_occurred')}
					</p>
					<p class="font-body text-sm text-white/50 mb-6 leading-relaxed">{errorMessage}</p>
					<button
						onclick={handleReturnToLanding}
						class="font-body font-semibold text-sm text-white bg-teal hover:bg-teal-light px-8 py-3.5 rounded-lg min-h-[52px] transition-colors cursor-pointer"
					>
						{translate($currentLanguage, 'try_again')}
					</button>
				</div>
			{/if}

		</main>
	</div>

</div>
