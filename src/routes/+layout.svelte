<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { initLanguage, currentLanguage, translate, setLanguage } from '$lib/i18n';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		initLanguage();
	});

	function toggleLanguage(): void {
		setLanguage($currentLanguage === 'en' ? 'vi' : 'en');
	}
</script>

<nav class="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-teal-deep border-b border-white/8">
	<div class="flex items-center gap-6">
		<a href="/" class="font-display text-sm font-semibold tracking-[0.12em] text-teal-light">
			Nhơn Lý
		</a>
		<a
			href="/archive"
			class="font-body text-sm transition-colors {$page.url.pathname === '/archive'
				? 'text-teal-light'
				: 'text-white/50 hover:text-white/80'}"
		>
			{translate($currentLanguage, 'archive_nav')}
		</a>
	</div>
	<button
		onclick={toggleLanguage}
		class="px-3 py-1 text-xs font-semibold tracking-widest text-white/50 border border-white/20 rounded hover:text-white/80 hover:border-white/40 transition-colors cursor-pointer"
	>
		{$currentLanguage === 'en' ? 'VI' : 'EN'}
	</button>
</nav>

{@render children()}
