<script lang="ts">
	import { settingsStore, type Team } from '$lib/stores';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	let teams: Team[] = [];
	$: sortedTeams = teams.slice().sort((a, b) => b.score - a.score);

	// Reactive font size calculation
	$: teamNameSize = Math.max(1, 3 - teams.length * 0.1);
	$: scoreSize = Math.max(2, 7 - teams.length * 0.5);

	function handleSignal(signal: string) {
		const team = teams.find((t) => t.signal === signal);
		if (team) {
			handleScoreChange(team, 1);
		}
	}

	onMount(() => {
		const eventSource = new EventSource('/game/events');
		eventSource.onmessage = (event) => {
			const { type, payload } = JSON.parse(event.data);
			if (type === 'signal') {
				handleSignal(payload);
			}
		};

		const unsubscribe = settingsStore.subscribe((settings) => {
			teams = settings.teams;
		});

		return () => {
			eventSource.close();
			unsubscribe();
		};
	});

	function handleScoreChange(team: Team, amount: number) {
		team.score += amount;
		teams = [...teams]; // Trigger reactivity
	}

	function handleKeyDown(event: KeyboardEvent) {
		const key = event.key;
		const teamSignal = key.toUpperCase();

		const team = teams.find((t) => t.signal === teamSignal);

		if (team) {
			if (event.shiftKey) {
				handleScoreChange(team, -1);
			} else {
				handleScoreChange(team, 1);
			}
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="flex h-screen flex-col bg-gray-900 p-4 font-sans text-white">
	<h1 class="mb-4 text-center text-3xl font-bold text-cyan-400">Preliminary Round</h1>

	<div class="flex flex-grow items-stretch justify-center space-x-2">
		{#each sortedTeams as team, i (team.id)}
			<div animate:flip={{ duration: 500 }} class="flex items-stretch space-x-2">
				<div
					class="flex flex-grow flex-col items-center justify-center rounded-lg bg-gray-800 p-2"
				>
					<span
						class="font-bold"
						style:writing-mode="vertical-rl"
						style:font-size="{teamNameSize}rem"
						>{team.name}</span
					>
					<span class="mt-4 font-black text-cyan-400" style:font-size="{scoreSize}rem"
						>{team.score}</span
					>
				</div>

				{#if $settingsStore.cutline > 0 && i < $settingsStore.cutline && i + 1 >= $settingsStore.cutline}
					<div
						transition:fade
						class="h-3/4 w-1.5 flex-shrink-0 self-center rounded-full bg-red-500"
					></div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="absolute bottom-4 right-4">
		<a
			href="/"
			class="rounded-lg bg-cyan-600 px-5 py-2 text-lg font-bold text-white hover:bg-cyan-500"
			>Back to Settings</a
		>
	</div>
</div>