<script lang="ts">
	import '../app.css';
	import { initLanguage } from '$lib/i18n';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		initLanguage();
	});
</script>

{@render children()}
