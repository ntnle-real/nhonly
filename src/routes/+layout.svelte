<script lang="ts">
	import { initLanguage } from '$lib/i18n';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Initialize language on app startup
	onMount(() => {
		initLanguage();
	});
</script>

<svelte:head>
	<!-- Set page language for screen readers and accessibility -->
	<html lang="en"></html>
</svelte:head>

{@render children()}

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		background: #fafafa;
	}

	:global(button) {
		font-family: inherit;
	}

	:global(input) {
		font-family: inherit;
	}

	/* Reduce motion for accessibility */
	@media (prefers-reduced-motion: reduce) {
		:global(*) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
