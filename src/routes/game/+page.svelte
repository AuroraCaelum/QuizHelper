<script lang="ts">
	import { settingsStore } from '$lib/stores';
	import Final from './final.svelte';
	import Preliminary from './preliminary/+page.svelte';
</script>

{#if $settingsStore.gameMode === 'final'}
	<Final />
{:else}
	<Preliminary />
{/if}
