<script lang="ts">
	import { goto } from '$app/navigation';
	import { settingsStore, teamStore, type Team } from '$lib/stores';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	let teams: Team[] = [];
	$: sortedTeams = (() => {
		const cutline = $settingsStore.cutline;
		const handicapCutline = $settingsStore.handicapCutline;

		if (cutline <= 0 || !handicapCutline || handicapCutline <= 0) {
			return teams.slice().sort((a, b) => b.score - a.score);
		}

		const sortedByScore = teams.slice().sort((a, b) => b.score - a.score);

		let inCutline = sortedByScore.slice(0, cutline);
		let outOfCutline = sortedByScore.slice(cutline);

		const handicappedInCutlineCount = inCutline.filter((t) => t.handicapApplied).length;

		if (handicappedInCutlineCount < handicapCutline) {
			const nonHandicappedInCutline = inCutline.filter((t) => !t.handicapApplied);
			const handicappedOutOfCutline = outOfCutline.filter((t) => t.handicapApplied);

			const swapsNeeded = Math.min(
				handicapCutline - handicappedInCutlineCount,
				nonHandicappedInCutline.length,
				handicappedOutOfCutline.length
			);

			if (swapsNeeded > 0) {
				const toSwapOut = nonHandicappedInCutline
					.sort((a, b) => a.score - b.score)
					.slice(0, swapsNeeded);
				const toSwapIn = handicappedOutOfCutline
					.sort((a, b) => b.score - a.score)
					.slice(0, swapsNeeded);

				const toSwapOutIds = new Set(toSwapOut.map((t) => t.id));
				const toSwapInIds = new Set(toSwapIn.map((t) => t.id));

				inCutline = inCutline.filter((t) => !toSwapOutIds.has(t.id));
				inCutline.push(...toSwapIn);

				outOfCutline = outOfCutline.filter((t) => !toSwapInIds.has(t.id));
				outOfCutline.push(...toSwapOut);
			}
		}

		inCutline.sort((a, b) => b.score - a.score);
		outOfCutline.sort((a, b) => b.score - a.score);

		return [...inCutline, ...outOfCutline];
	})();

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
			const data = JSON.parse(event.data);

			if (data.sig && data.score) {
				const team = teams.find((t) => t.signal === data.sig);
				if (team) {
					handleScoreChange(team, data.score);
				}
			} else if (data.type === 'signal') {
				handleSignal(data.payload);
			}
		};

		const unsubscribeSettings = settingsStore.subscribe(() => {
			// we can use this if needed in the future
		});

		const unsubscribeTeams = teamStore.subscribe((teamsValue) => {
			teams = teamsValue;
		});

		return () => {
			eventSource.close();
			unsubscribeSettings();
			unsubscribeTeams();
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
				handleScoreChange(team, -5);
			} else {
				handleScoreChange(team, 5);
			}
		} else if (key === 'Escape') {
			if (confirm('Are you sure to move back? All of the score data will be reset.')) {
				goto('/');
			}
		} else if (key === '`') {
			// Open Score Manager in a new tab
			window.open('/score-management?mode=preliminary', '_blank');
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="flex h-screen flex-col bg-gray-900 p-4 font-sans text-white">
	<h1 class="mb-4 text-center text-3xl font-bold text-cyan-400">Preliminary Round</h1>

	<div class="flex flex-grow items-stretch justify-center space-x-2">
		{#each sortedTeams as team, i (team.id)}
			<div animate:flip={{ duration: 500 }} class="flex items-stretch space-x-2">
				<div class="flex flex-grow flex-col items-center rounded-lg bg-gray-800 p-2">
					<span class="mb-4 font-black text-cyan-400" style:font-size="{scoreSize}rem"
						>{team.score}</span
					>
					<span
						class="font-bold"
						style:writing-mode="vertical-rl"
						style:font-size="{teamNameSize}rem">{team.name}</span
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
</div>
