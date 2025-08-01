<script lang="ts">
	import { onMount } from 'svelte';
	import { settingsStore, teamStore, scoreHistoryStore, type Team } from '$lib/stores';
	import { flip } from 'svelte/animate';

	let activeTeam: Team | null = null;
	let activeTeamTimeout: number;
	let isLocked = false; // For interrupt delay

	let feedbackMessage: { text: string; type: 'correct' | 'wrong' } | null = null;
	let feedbackTimeout: number;

	let pendingTeamNumber: string | null = null; // For score updates

	let teamRanks = new Map<number, number>();

	let buzzerSound: HTMLAudioElement;
	let correctSound: HTMLAudioElement;
	let wrongSound: HTMLAudioElement;

	$: {
		// Sort teams by score to determine rank
		const sortedTeams = [...$teamStore].sort((a, b) => b.score - a.score);
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

	// --- Event Handlers ---
	function handleSignal(signal: string) {
		if (isLocked || activeTeam) return;

		// If a feedback message is showing, clear it immediately
		if (feedbackMessage) {
			feedbackMessage = null;
			clearTimeout(feedbackTimeout);
		}

		const team = $teamStore.find((t) => t.signal === signal);
		if (team) {
			buzzerSound.play();
			activeTeam = team;
			isLocked = true; // Lock immediately

			// Clear the active team display after 10 seconds
			clearTimeout(activeTeamTimeout);
			activeTeamTimeout = window.setTimeout(() => {
				activeTeam = null;
			}, 10000);

			// Unlock for interruptions after the specified delay
			setTimeout(() => {
				isLocked = false;
			}, $settingsStore.interruptDelay * 1000);
		}
	}

	function showFeedback(text: string, type: 'correct' | 'wrong') {
		if (type === 'correct') {
			correctSound.play();
		} else {
			wrongSound.play();
		}
		feedbackMessage = { text, type };
		if (type === 'wrong') {
			activeTeam = null;
			isLocked = false; // Reset lock to allow immediate buzz
			clearTimeout(activeTeamTimeout);
			clearTimeout(feedbackTimeout); // Clear previous feedback timeout if any
		}

		feedbackTimeout = window.setTimeout(() => {
			feedbackMessage = null;
			activeTeam = null;
			isLocked = false;
		}, 3000);
	}

	function handleKeydown(event: KeyboardEvent) {
		const key = event.key;

		if (key === '`') {
			// Open Score Manager in a new tab
			window.open('/score-management?mode=final', '_blank');
		}

		// --- Score Update Logic ---
		if (!isNaN(parseInt(key)) && parseInt(key) > 0 && parseInt(key) <= $teamStore.length) {
			pendingTeamNumber = key;
			// Reset after 1s if no arrow key is pressed
			setTimeout(() => {
				if (pendingTeamNumber === key) pendingTeamNumber = null;
			}, 1000);
			return;
		}

		if ((key === 'ArrowUp' || key === 'ArrowDown') && pendingTeamNumber) {
			event.preventDefault();
			const teamIndex = parseInt(pendingTeamNumber) - 1;
			if (teamIndex >= 0 && teamIndex < $teamStore.length) {
				const team = $teamStore[teamIndex];
				const scoreChange = key === 'ArrowUp' ? 1 : -1;
				team.score += scoreChange;
				// Force a store update because we're modifying an object within an array
				teamStore.set($teamStore);
				scoreHistoryStore.addEntry(team.name, scoreChange);
			}
			pendingTeamNumber = null;
			return;
		}

		// --- Right/Wrong Answer Logic ---
		if (activeTeam) {
			if (key === $settingsStore.rightAnswerShortcut) {
				event.preventDefault();
				showFeedback($settingsStore.rightAnswerText, 'correct');
			} else if (key === $settingsStore.wrongAnswerShortcut) {
				event.preventDefault();
				showFeedback($settingsStore.wrongAnswerText, 'wrong');
			}
		}

		// Any other key resets the pending number
		pendingTeamNumber = null;
	}

	// --- Lifecycle Hook ---
	onMount(() => {
		// Reset all scores to 0 when the game page is mounted
		$teamStore.forEach((team) => (team.score = 0));
		teamStore.set($teamStore);

		// Connect to the Server-Sent Events stream
		const eventSource = new EventSource('/game/events');

		eventSource.onmessage = (event) => {
			console.log('Received SSE event:', event.data);
			const data = JSON.parse(event.data);

			if (data.sig && data.score) {
				const team = $teamStore.find((t) => t.signal === data.sig);
				if (team) {
					const scoreChange = data.score;
					team.score += scoreChange;
					teamStore.set($teamStore);
					scoreHistoryStore.addEntry(team.name, scoreChange);
				}
			} else if (data.type === 'signal') {
				handleSignal(data.payload);
			} else if (data.type === 'score_update') {
				const { teamName, scoreChange } = data.payload;
				const team = $teamStore.find((t) => t.name === teamName);
				if (team) {
					team.score += scoreChange;
					teamStore.set($teamStore);
					scoreHistoryStore.addEntry(team.name, scoreChange);
				}
			}
		};

		return () => {
			// Clean up when the component is destroyed
			eventSource.close();
			clearTimeout(activeTeamTimeout);
			clearTimeout(feedbackTimeout);
		};
	});

	// Prevent accidental navigation
	onMount(() => {
		let isNavigatingBack = false;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			return (event.returnValue =
				'게임이 진행중일 때 뒤로가기를 하지 마세요! 점수가 초기화될 수 있습니다.');
		};

		const handlePopState = () => {
			if (isNavigatingBack) {
				return;
			}

			if (confirm('게임이 진행중일 때 뒤로가기를 하지 마세요! 점수가 초기화될 수 있습니다.')) {
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
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="relative flex h-screen w-screen flex-col overflow-hidden bg-cover bg-center p-4 font-sans text-white"
	style="background-image: url(/bg.jpg);"
>
	<div class="absolute top-4 right-4 w-64">
		{#each $scoreHistoryStore as entry (entry.id)}
			<div class="mb-2 rounded-lg bg-black/70 p-2 text-sm shadow-lg backdrop-blur-sm">
				<span>{entry.teamName}</span>
				<span class="font-bold {entry.scoreChange > 0 ? 'text-green-400' : 'text-red-400'}">
					{entry.scoreChange > 0 ? '+' : ''}{entry.scoreChange}
				</span>
			</div>
		{/each}
	</div>

	<div class="flex flex-1 flex-col justify-around">
		<h1 class="text-center text-4xl font-bold text-cyan-400 drop-shadow-lg">
			제2회 성경대로믿는사람들 한글킹제임스성경 암송대회 결승
		</h1>

		<div class="flex items-center justify-center">
			<div class="grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each $teamStore as team (team.id)}
					<div
						animate:flip={{ duration: 500 }}
						class="relative flex flex-col items-center justify-center rounded-xl border-2 border-white/30 bg-black/60 p-6 shadow-lg backdrop-blur-sm"
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
						<span class="text-6xl font-black text-cyan-400 drop-shadow-lg">{team.score}</span>
						<span class="mt-2 text-3xl font-bold text-white drop-shadow-md">{team.name}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Active Team Display (Overlay) -->
	{#if activeTeam}
		<div
			class="bg-opacity-70 absolute inset-0 z-10 flex items-center justify-center bg-black backdrop-blur-md"
		>
			<div class="animate-pulse text-center">
				<h2
					class="text-8xl font-black text-yellow-400 drop-shadow-[0_5px_15px_rgba(250,204,21,0.5)] md:text-9xl lg:text-[12rem]"
				>
					{activeTeam.name}
				</h2>
			</div>
		</div>
	{/if}

	<!-- Feedback Message Display (Overlay) -->
	{#if feedbackMessage}
		<div
			class="bg-opacity-70 absolute inset-0 z-20 flex items-center justify-center bg-black backdrop-blur-md"
		>
			<div
				class="animate-pulse text-center text-8xl font-black md:text-9xl lg:text-[12rem]"
				class:text-green-400={feedbackMessage.type === 'correct'}
				class:text-red-400={feedbackMessage.type === 'wrong'}
			>
				{feedbackMessage.text}
			</div>
		</div>
	{/if}

	<audio src="/buzzer.mp3" bind:this={buzzerSound}></audio>
	<audio src="/correct.mp3" bind:this={correctSound}></audio>
	<audio src="/wrong.mp3" bind:this={wrongSound}></audio>
</div>
