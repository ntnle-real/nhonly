<script lang="ts">
	import { translate } from '$lib/i18n';
	import { onMount } from 'svelte';

	interface DeleteConfirmStory {
		id: number;
		title: string;
	}

	let {
		story = null,
		currentLanguage = 'en',
		onConfirm = () => {},
		onCancel = () => {}
	} = $props();

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			onCancel();
		}
	}

	onMount(() => {
		// Prevent scroll behind modal
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal Overlay -->
<div
	role="dialog"
	aria-modal="true"
	aria-labelledby="delete-heading"
	class="fixed inset-0 flex items-center justify-center z-50"
>
	<!-- Backdrop -->
	<button
		type="button"
		onclick={onCancel}
		aria-label="Close dialog"
		class="absolute inset-0 bg-black/50 cursor-default"
	></button>

	<!-- Modal Card -->
	<div class="relative bg-teal max-w-xs w-full mx-4 p-6 rounded-lg z-10">
		<!-- Heading -->
		<h2 id="delete-heading" class="font-display text-2xl text-rust font-semibold mb-4">
			{translate(currentLanguage, 'delete_heading')}
		</h2>

		<!-- Body -->
		<p class="font-body text-base text-white/70 mb-8 leading-relaxed">
			{translate(currentLanguage, 'delete_body')}
		</p>

		<!-- Buttons -->
		<div class="flex gap-0">
			<button
				onclick={onConfirm}
				class="flex-1 font-body text-base font-semibold text-white bg-rust hover:bg-[#e8642a] py-3 transition-colors min-h-[52px]"
			>
				{translate(currentLanguage, 'delete_confirm')}
			</button>
			<button
				onclick={onCancel}
				class="flex-1 font-body text-base font-semibold text-white bg-white/10 hover:bg-white/15 py-3 transition-colors min-h-[52px]"
			>
				{translate(currentLanguage, 'delete_cancel')}
			</button>
		</div>
	</div>
</div>
