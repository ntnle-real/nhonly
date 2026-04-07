<script lang="ts">
	import { translate } from '$lib/i18n';
	import { goto } from '$app/navigation';

	interface StoryItem {
		id: number;
		title: string;
		dateFormatted: string;
		durationFormatted: string;
		type?: 'recording' | 'diorama';
		dioramaId?: string;
	}

	let {
		stories = [],
		currentLanguage = 'en',
		onPlayStory = () => {},
		onDeleteStory = () => {},
		isLoading = false
	} = $props();

	function handleOpenDiorama(dioramaId: string): void {
		goto(`/archive/diorama/${dioramaId}`);
	}
</script>

{#if stories.length === 0}
	<!-- Empty State -->
	<div class="flex flex-col items-center justify-center min-h-[400px] text-center">
		<h2 class="font-display text-2xl text-teal-light mb-4">
			{translate(currentLanguage, 'archive_empty_headline')}
		</h2>
		<p class="font-body text-base text-white/70 max-w-xs mb-8 leading-relaxed">
			{translate(currentLanguage, 'archive_empty_body')}
		</p>
		<a
			href="/"
			class="font-body text-base font-semibold text-white bg-rust hover:bg-[#e8642a] px-8 py-3 rounded-md min-h-[52px] transition-colors inline-flex items-center"
		>
			{translate(currentLanguage, 'archive_empty_cta')}
		</a>
	</div>
{:else}
	<!-- Story List -->
	<div>
		<!-- Header -->
		<div class="mb-8">
			<h1 class="font-display text-2xl text-white/90 mb-3">
				{translate(currentLanguage, 'archive_header')}
			</h1>
			<p class="font-body text-base text-sand">
				{#if stories.length === 1}
					{translate(currentLanguage, 'archive_count_singular').replace('{count}', String(stories.length))}
				{:else}
					{translate(currentLanguage, 'archive_count_plural').replace('{count}', String(stories.length))}
				{/if}
			</p>
		</div>

		<!-- Stories -->
		<div class="space-y-0">
			{#each stories as story (story.id)}
				{#if story.type === 'diorama'}
					<!-- Diorama Item -->
					<div
						class="border-t border-white/8 border-l-2 border-l-amber-400/50 min-h-[52px] flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors duration-150 cursor-pointer"
						onclick={() => handleOpenDiorama(story.dioramaId || '')}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								handleOpenDiorama(story.dioramaId || '');
							}
						}}
					>
						<div class="flex-1">
							<h3 class="font-body text-base text-white/90 font-medium">
								🌊 {translate(currentLanguage, 'diorama_label')}: {story.title}
							</h3>
							<p class="font-body text-sm text-sand mt-1">
								{story.durationFormatted}
							</p>
						</div>
						<div class="ml-4 text-lg text-white/50">→</div>
					</div>
				{:else}
					<!-- Recording Item -->
					<div class="border-t border-white/8 min-h-[64px] flex flex-col justify-between hover:bg-white/4 transition-colors duration-150 cursor-pointer">
						<div class="pt-4 px-4">
							<h3 class="font-body text-base text-white/90 font-medium">
								🎙️ {story.title}
							</h3>
						</div>
						<div class="flex items-center justify-between px-4 pb-4">
							<p class="font-body text-sm text-sand">
								{story.dateFormatted} · {story.durationFormatted}
							</p>
							<div class="flex gap-2">
								<button
									onclick={() => onPlayStory(story.id)}
									class="text-lg text-teal-light hover:text-teal transition-colors"
									aria-label="Play story"
								>
									▶
								</button>
								<button
									onclick={() => onDeleteStory(story.id)}
									class="text-lg text-white/50 hover:text-white/80 transition-colors"
									aria-label="Delete story"
								>
									🗑
								</button>
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}
