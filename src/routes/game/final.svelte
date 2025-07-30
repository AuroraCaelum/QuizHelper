<script lang="ts">
	import { onMount } from 'svelte';
	import { settingsStore, teamStore, type Team } from '$lib/stores';
    import { flip } from 'svelte/animate';

	let activeTeam: Team | null = null;
	let activeTeamTimeout: number;
	let isLocked = false; // For interrupt delay

	let feedbackMessage: { text: string; type: 'correct' | 'wrong' } | null = null;
	let feedbackTimeout: number;

	let pendingTeamNumber: string | null = null; // For score updates

	let teamRanks = new Map<number, number>();

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
		feedbackMessage = { text, type };
		activeTeam = null;
		isLocked = false; // Reset lock to allow immediate buzz
		clearTimeout(activeTeamTimeout);
		clearTimeout(feedbackTimeout); // Clear previous feedback timeout if any

		feedbackTimeout = window.setTimeout(() => {
			feedbackMessage = null;
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
				if (key === 'ArrowUp') {
					$teamStore[teamIndex].score++;
				} else {
					$teamStore[teamIndex].score--;
				}
				// Force a store update because we're modifying an object within an array
				teamStore.set($teamStore);
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
			const data = JSON.parse(event.data);

			if (data.sig && data.score) {
				const team = $teamStore.find((t) => t.signal === data.sig);
				if (team) {
					team.score += data.score;
					teamStore.set($teamStore);
				}
			} else if (data.type === 'signal') {
				handleSignal(data.payload);
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
		// Push a new state to the history stack to intercept the back button
		history.pushState(null, '', location.href);

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			return (event.returnValue = 'Do not refresh or navigate backward if the game is still running! It might cause losing all the data.');
		};

		const handlePopState = () => {
			if (confirm('Do not refresh or navigate backward if the game is still running! It might cause losing all the data.')) {
				history.back(); // Allow navigation
			} else {
				// Push the state back to effectively cancel the back action
				history.pushState(null, '', location.href);
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('popstate', handlePopState);

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
    <h1 class="mb-8 text-center text-4xl font-bold text-cyan-400 drop-shadow-lg">Final Round</h1>

    <div class="flex flex-1 items-center justify-center">
        <div class="grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each $teamStore as team (team.id)}
                <div
                    animate:flip={{ duration: 500 }}
                    class="relative flex flex-col items-center justify-center rounded-xl border-2 border-white/30 bg-black/60 p-6 backdrop-blur-sm shadow-lg"
                >
                    <div class="absolute top-2 left-2 text-2xl font-bold text-yellow-400">#{teamRanks.get(team.id) || '-'}</div>
                    <span class="text-6xl font-black text-cyan-400 drop-shadow-lg">{team.score}</span>
                    <span class="mt-2 text-3xl font-bold text-white drop-shadow-md">{team.name}</span>
                </div>
            {/each}
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
			class="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md"
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
</div>