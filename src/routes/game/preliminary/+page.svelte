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
		const anyHandicappedTeamHasScored = teams.some((t) => t.handicapApplied && t.score > 0);

		if (cutline <= 0 || !handicapCutline || handicapCutline <= 0 || !anyHandicappedTeamHasScored) {
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

	let teamRanks = new Map<number, number>();

	$: {
		// Sort teams by score to determine rank
		const newRanks = new Map<number, number>();
		let currentRank = 1;
		for (let i = 0; i < sortedTeams.length; i++) {
			// Increment rank only when the score is lower than the previous team's score
			if (i > 0 && sortedTeams[i].score < sortedTeams[i - 1].score) {
				currentRank = i + 1;
			}
			newRanks.set(sortedTeams[i].id, currentRank);
		}
		teamRanks = newRanks;
	}

	$: cutline = $settingsStore.cutline;
	$: promotionZoneTeams = sortedTeams.slice(0, cutline);
	$: otherTeams = sortedTeams.slice(cutline);

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

	// Prevent accidental navigation
	onMount(() => {
		let isNavigatingBack = false;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			return (event.returnValue =
				'Do not refresh or navigate backward if the game is still running! It might cause losing all the data.');
		};

		const handlePopState = () => {
			if (isNavigatingBack) {
				return;
			}

			if (
				confirm(
					'Do not refresh or navigate backward if the game is still running! It might cause losing all the data.'
				)
			) {
				isNavigatingBack = true;
				history.back(); // Allow navigation
			} else {
				// Push the state back to effectively cancel the back action
				history.pushState(null, '', location.href);
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('popstate', handlePopState);

		// Push a new state to the history stack to intercept the back button
		history.pushState(null, '', location.href);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('popstate', handlePopState);
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
	<h1 class="mb-8 text-center text-4xl font-bold text-cyan-400">
		제2회 성경대로믿는사람들 한글킹제임스성경 암송대회 예선
	</h1>

	<div class="flex flex-1 flex-col gap-8">
		<!-- Promotion Zone -->
		{#if cutline > 0}
			<div class="promotion-zone rounded-xl border-2 border-yellow-400 bg-gray-800/50 p-6">
				<h2 class="mb-4 text-center text-3xl font-semibold text-yellow-300">결승 진출 커트라인</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each promotionZoneTeams as team (team.id)}
						<div
							animate:flip={{ duration: 500 }}
							class="relative flex flex-col items-center justify-center rounded-lg bg-gray-700 p-6 shadow-lg"
						>
							<!-- Yellow for 1st place, silver for 2nd place, bronze for 3rd place, white for others -->
							<span
								class="absolute top-2 left-2 rounded-full bg-yellow-400 px-3 py-1 text-sm font-semibold text-black"
								class:bg-yellow-400={teamRanks.get(team.id) === 1}
								class:bg-gray-300={teamRanks.get(team.id) === 2}
								class:bg-orange-500={teamRanks.get(team.id) === 3}
								class:bg-white={(teamRanks.get(team.id) ?? 0) > 3}
							>
								{teamRanks.get(team.id)}위
							</span>
							<span class="text-6xl font-black text-cyan-400">{team.score}</span>
							<span class="mt-2 text-3xl font-bold" class:text-green-400={team.handicapApplied}
								>{team.name}</span
							>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Other Teams -->
		<div class="other-teams flex-1 overflow-y-auto rounded-lg bg-gray-800/30 p-4">
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each otherTeams as team (team.id)}
					<div
						animate:flip={{ duration: 500 }}
						class="flex items-center gap-3 rounded-md bg-gray-700 p-3 shadow"
					>
						<span
							class="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold text-black"
							class:bg-yellow-400={teamRanks.get(team.id) === 1}
							class:bg-gray-300={teamRanks.get(team.id) === 2}
							class:bg-orange-500={teamRanks.get(team.id) === 3}
							class:bg-white={(teamRanks.get(team.id) ?? 0) > 3}
						>
							{teamRanks.get(team.id)}
						</span>
						<span class="flex-1 text-xl font-semibold" class:text-green-400={team.handicapApplied}
							>{team.name}</span
						>
						<span class="text-2xl font-bold text-cyan-400">{team.score}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
