<script lang="ts">
	import { onMount } from 'svelte';
	import { currentLanguage, translate, setLanguage } from '$lib/i18n';
	import { readAndSortStories, deleteStory } from '$lib/archive.service';
	import { initDatabase } from '$lib/archive';
	import StoryList from './StoryList.svelte';
	import Playback from './Playback.svelte';
	import DeleteConfirm from './DeleteConfirm.svelte';

	type Scene = 'list' | 'playback' | 'delete-confirm';

	interface Story {
		id: number;
		title: string;
		dateFormatted: string;
		durationFormatted: string;
		audioBlob: Blob;
		timestamp: number;
	}

	let scene: Scene = $state('list');
	let stories: Story[] = $state([]);
	let selectedStoryId: number | null = $state(null);
	let isLoading: boolean = $state(true);
	let error: string | null = $state(null);
	let deleteToastVisible: boolean = $state(false);

	function toggleLanguage(): void {
		setLanguage($currentLanguage === 'en' ? 'vi' : 'en');
	}

	async function loadStories(): Promise<void> {
		isLoading = true;
		error = null;
		try {
			const loaded = await readAndSortStories($currentLanguage);
			stories = loaded;
		} catch (err) {
			error = (err as Error).message || translate($currentLanguage, 'error_occurred');
			console.error('Failed to load stories:', err);
		} finally {
			isLoading = false;
		}
	}

	function handlePlayStory(id: number): void {
		selectedStoryId = id;
		scene = 'playback';
	}

	function handleDeleteStory(id: number): void {
		selectedStoryId = id;
		scene = 'delete-confirm';
	}

	function handlePlaybackClose(): void {
		scene = 'list';
		selectedStoryId = null;
	}

	function handlePlaybackEnded(): void {
		// Auto-return to list after 2 seconds
		setTimeout(() => {
			if (scene === 'playback') {
				scene = 'list';
				selectedStoryId = null;
			}
		}, 2000);
	}

	function handleDeleteConfirm(): void {
		if (selectedStoryId === null) return;
		const storyId = selectedStoryId;

		deleteStory(storyId)
			.then(() => {
				stories = stories.filter((s) => s.id !== storyId);
				scene = 'list';
				selectedStoryId = null;
				deleteToastVisible = true;
				setTimeout(() => {
					deleteToastVisible = false;
				}, 3000);
			})
			.catch((err) => {
				error = (err as Error).message || translate($currentLanguage, 'error_occurred');
				scene = 'list';
				selectedStoryId = null;
			});
	}

	function handleDeleteCancel(): void {
		scene = 'list';
		selectedStoryId = null;
	}

	function handleRetry(): void {
		error = null;
		loadStories();
	}

	// Load stories on mount
	onMount(async () => {
		await initDatabase();
		loadStories();
	});

	// Reload stories when language changes
	$effect(() => {
		if (!isLoading) {
			loadStories();
		}
	});

	let selectedStory: Story | null = $state(null);

	$effect(() => {
		selectedStory = selectedStoryId !== null ? stories.find((s) => s.id === selectedStoryId) : null;
	});
</script>

<svelte:head>
	<title>{translate($currentLanguage, 'archive_header')} — Nhơn Lý</title>
</svelte:head>

<div class="relative w-full min-h-screen bg-teal-deep flex flex-col">
	<!-- Header -->
	<header class="flex justify-between items-center px-6 py-4 border-b border-white/8">
		<span class="font-display text-sm font-semibold tracking-[0.12em] text-teal-light">Nhơn Lý</span>
		<button
			onclick={toggleLanguage}
			class="px-3 py-1 text-xs font-semibold tracking-widest text-white/50 border border-white/20 rounded hover:text-white/80 hover:border-white/40 transition-colors cursor-pointer"
		>
			{$currentLanguage === 'en' ? 'VI' : 'EN'}
		</button>
	</header>

	<!-- Main content area -->
	<main class="flex-1 px-6 py-8">
		<!-- Scene: List -->
		<div
			class="transition-opacity duration-[450ms]"
			class:opacity-100={scene === 'list'}
			class:opacity-0={scene !== 'list'}
			class:pointer-events-none={scene !== 'list'}
		>
			{#if isLoading}
				<div class="flex justify-center items-center py-12">
					<div class="w-10 h-10 border-2 border-white/20 border-t-teal-light rounded-full animate-spin"></div>
				</div>
			{:else if error}
				<div class="text-center max-w-xs mx-auto py-12">
					<p class="text-3xl mb-4">⚠</p>
					<p class="font-display text-lg font-semibold text-white mb-2">
						{translate($currentLanguage, 'error_occurred')}
					</p>
					<p class="font-body text-sm text-white/50 mb-6 leading-relaxed">{error}</p>
					<button
						onclick={handleRetry}
						class="font-body font-semibold text-sm text-white bg-teal hover:bg-teal-light px-8 py-3.5 rounded-lg min-h-[52px] transition-colors cursor-pointer"
					>
						{translate($currentLanguage, 'try_again')}
					</button>
				</div>
			{:else}
				<StoryList
					{stories}
					currentLanguage={$currentLanguage}
					onPlayStory={handlePlayStory}
					onDeleteStory={handleDeleteStory}
					{isLoading}
				/>
			{/if}
		</div>

		<!-- Scene: Playback -->
		<div
			class="transition-opacity duration-[450ms]"
			class:opacity-100={scene === 'playback'}
			class:opacity-0={scene !== 'playback'}
			class:pointer-events-none={scene !== 'playback'}
		>
			{#if selectedStory}
				<Playback
					story={selectedStory}
					currentLanguage={$currentLanguage}
					onClose={handlePlaybackClose}
					onPlaybackEnded={handlePlaybackEnded}
				/>
			{/if}
		</div>

		<!-- Scene: Delete Confirm -->
		<div
			class="transition-opacity duration-[450ms]"
			class:opacity-100={scene === 'delete-confirm'}
			class:opacity-0={scene !== 'delete-confirm'}
			class:pointer-events-none={scene !== 'delete-confirm'}
		>
			{#if selectedStory}
				<DeleteConfirm
					story={selectedStory}
					currentLanguage={$currentLanguage}
					onConfirm={handleDeleteConfirm}
					onCancel={handleDeleteCancel}
				/>
			{/if}
		</div>
	</main>

	<!-- Delete success toast -->
	{#if deleteToastVisible}
		<div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-teal-light text-white px-6 py-3 rounded-lg text-sm animate-pulse z-50">
			{translate($currentLanguage, 'delete_success')}
		</div>
	{/if}
</div>
