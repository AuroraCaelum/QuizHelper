<script lang="ts">
	import { onMount } from 'svelte';
	import { settingsStore, type Team } from '$lib/stores';

	let activeTeam: Team | null = null;
	let activeTeamTimeout: number;
	let isLocked = false; // For interrupt delay

	let pendingTeamNumber: string | null = null; // For score updates

	// --- Layout Helper ---
	// This function determines the grid position for each team box.
	function getPositionClasses(index: number, total: number): string {
		const positions: { [key: number]: string[] } = {
			1: ['col-start-2 row-start-1 justify-self-center self-center'],
			2: [
				'col-start-1 row-start-1 justify-self-center self-center',
				'col-start-3 row-start-1 justify-self-center self-center'
			],
			3: [
				'col-start-1 row-start-1 self-start', // TL
				'col-start-3 row-start-1 self-start justify-self-end', // TR
				'col-start-2 row-start-2 justify-self-center self-end' // BC
			],
			4: [
				'col-start-1 row-start-1 self-start', // TL
				'col-start-3 row-start-1 self-start justify-self-end', // TR
				'col-start-1 row-start-2 self-end', // BL
				'col-start-3 row-start-2 self-end justify-self-end' // BR
			],
			5: [
				'col-start-1 row-start-1 self-start', // Top Left
				'col-start-3 row-start-1 self-start justify-self-end', // Top Right
				'col-start-1 row-start-2 self-end', // Bottom Left
				'col-start-2 row-start-2 self-end justify-self-center', // Bottom Center
				'col-start-3 row-start-2 self-end justify-self-end' // Bottom Right
			],
			6: [
				'col-start-1 row-start-1 self-start', // TL
				'col-start-2 row-start-1 self-start justify-self-center', // TC
				'col-start-3 row-start-1 self-start justify-self-end', // TR
				'col-start-1 row-start-2 self-end', // BL
				'col-start-2 row-start-2 self-end justify-self-center', // BC
				'col-start-3 row-start-2 self-end justify-self-end' // BR
			]
		};
		// Default to 6-team layout for more than 6 teams
		const layout = positions[total] || positions[6];
		return layout[index] || '';
	}

	// --- Event Handlers ---
	function handleSignal(signal: string) {
		if (isLocked || activeTeam) return;

		const team = $settingsStore.teams.find((t) => t.signal === signal);
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

	function handleKeydown(event: KeyboardEvent) {
		const key = event.key;

		// --- Score Update Logic ---
		if (
			!isNaN(parseInt(key)) &&
			parseInt(key) > 0 &&
			parseInt(key) <= $settingsStore.numberOfTeams
		) {
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
			if (teamIndex >= 0 && teamIndex < $settingsStore.teams.length) {
				if (key === 'ArrowUp') {
					$settingsStore.teams[teamIndex].score++;
				} else {
					$settingsStore.teams[teamIndex].score--;
				}
				// Force a store update because we're modifying an object within an array
				settingsStore.set($settingsStore);
			}
			pendingTeamNumber = null;
			return;
		}

		// --- Right/Wrong Answer Logic ---
		if (activeTeam) {
			if (key === $settingsStore.rightAnswerShortcut) {
				event.preventDefault();
				alert($settingsStore.rightAnswerText);
				activeTeam = null;
				clearTimeout(activeTeamTimeout);
			} else if (key === $settingsStore.wrongAnswerShortcut) {
				event.preventDefault();
				alert($settingsStore.wrongAnswerText);
				activeTeam = null;
				clearTimeout(activeTeamTimeout);
			}
		}

		// Any other key resets the pending number
		pendingTeamNumber = null;
	}

	// --- Lifecycle Hook ---
	onMount(() => {
		// Reset all scores to 0 when the game page is mounted
		$settingsStore.teams.forEach((team) => (team.score = 0));
		settingsStore.set($settingsStore);

		// Connect to the Server-Sent Events stream
		const eventSource = new EventSource('/game/events');

		eventSource.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'signal') {
				handleSignal(data.payload);
			}
		};

		return () => {
			// Clean up when the component is destroyed
			eventSource.close();
			clearTimeout(activeTeamTimeout);
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="relative h-screen w-screen overflow-hidden bg-cover bg-center text-white"
	style="background-image: url(/bg.jpg);"
>
	<!-- Team Scores Grid -->
	<div class="grid h-full w-full grid-cols-3 grid-rows-2 p-8">
		{#each $settingsStore.teams as team, i}
			<div
				class="bg-opacity-60 m-2 flex flex-col rounded-lg border-2 border-white/30 bg-black p-4 backdrop-blur-sm {getPositionClasses(
					i,
					$settingsStore.teams.length
				)}"
			>
				<div class="truncate text-3xl font-bold text-cyan-300 drop-shadow-lg lg:text-5xl">
					{team.name}
				</div>
				<div class="mt-2 text-5xl font-black text-white drop-shadow-lg lg:text-8xl">
					{team.score}
				</div>
			</div>
		{/each}
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
</div>