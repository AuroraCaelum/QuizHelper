<script lang="ts">
	import { settingsStore, type Settings, type Team, type Signal } from '$lib/stores';

	// --- State for shortcut setting ---
	let listeningFor: 'right' | 'wrong' | null = null;

	// --- Reactive Logic ---
	// This $: block runs whenever the variables it depends on change.
	$: {
		// Synchronize the number of teams with the teams array
		if ($settingsStore.teams.length !== $settingsStore.numberOfTeams) {
			const currentCount = $settingsStore.teams.length;
			const newCount = $settingsStore.numberOfTeams;

			if (newCount > currentCount) {
				// Add new teams
				const signals: Signal[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
				for (let i = currentCount; i < newCount; i++) {
					$settingsStore.teams.push({
						id: i + 1,
						name: `Team ${i + 1}`,
						signal: signals[i % signals.length],
						score: 0
					});
				}
			} else {
				// Remove teams
				$settingsStore.teams = $settingsStore.teams.slice(0, newCount);
			}
		}
	}

	// --- Event Handlers ---
	function handleKeydown(event: KeyboardEvent) {
		if (!listeningFor) return;

		event.preventDefault();
		const key = event.key;

		if (listeningFor === 'right') {
			$settingsStore.rightAnswerShortcut = key;
		} else if (listeningFor === 'wrong') {
			$settingsStore.wrongAnswerShortcut = key;
		}
		listeningFor = null;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-gray-900 p-8 font-sans text-white">
	<div class="mx-auto max-w-4xl">
		<h1 class="mb-8 border-b-2 border-cyan-500 pb-2 text-4xl font-bold text-cyan-400">
			Quiz Buzzer Settings
		</h1>

		<!-- General Settings -->
		<div class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
			<div class="rounded-lg bg-gray-800 p-4">
				<label for="num-teams" class="block text-sm font-medium text-gray-300"
					>Number of Teams</label
				>
				<input
					type="number"
					id="num-teams"
					min="1"
					max="12"
					class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
					bind:value={$settingsStore.numberOfTeams}
				/>
			</div>
			<div class="rounded-lg bg-gray-800 p-4">
				<label for="http-port" class="block text-sm font-medium text-gray-300">HTTP Port</label>
				<input
					type="number"
					id="http-port"
					class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
					bind:value={$settingsStore.httpPort}
				/>
			</div>
			<div class="rounded-lg bg-gray-800 p-4">
				<label for="interrupt-delay" class="block text-sm font-medium text-gray-300"
					>Interrupt Delay (sec)</label
				>
				<input
					type="number"
					min="0"
					step="0.1"
					id="interrupt-delay"
					class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
					bind:value={$settingsStore.interruptDelay}
				/>
			</div>
		</div>

		<!-- Team Settings -->
		<h2 class="mb-4 text-2xl font-semibold text-cyan-400">Team Name & Signal</h2>
		<div class="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each $settingsStore.teams as team, i (team.id)}
				<div class="flex items-center gap-4 rounded-lg bg-gray-800 p-4">
					<span class="text-xl font-bold text-cyan-400">{i + 1}</span>
					<div class="flex-grow">
						<label for="team-name-{i}" class="sr-only">Team {i + 1} Name</label>
						<input
							type="text"
							id="team-name-{i}"
							placeholder="Team Name"
							class="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
							bind:value={team.name}
						/>
					</div>
					<div>
						<label for="team-signal-{i}" class="sr-only">Team {i + 1} Signal</label>
						<select
							id="team-signal-{i}"
							class="rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
							bind:value={team.signal}
						>
							<option>A</option>
							<option>B</option>
							<option>C</option>
							<option>D</option>
							<option>E</option>
							<option>F</option>
							<option>G</option>
						</select>
					</div>
				</div>
			{/each}
		</div>

		<!-- Dialog & Shortcut Settings -->
		<div class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Dialogs -->
			<div class="space-y-4 rounded-lg bg-gray-800 p-4">
				<div>
					<label for="right-answer-text" class="block text-sm font-medium text-gray-300"
						>Right Answer Dialog</label
					>
					<input
						type="text"
						id="right-answer-text"
						class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
						bind:value={$settingsStore.rightAnswerText}
					/>
				</div>
				<div>
					<label for="wrong-answer-text" class="block text-sm font-medium text-gray-300"
						>Wrong Answer Dialog</label
					>
					<input
						type="text"
						id="wrong-answer-text"
						class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
						bind:value={$settingsStore.wrongAnswerText}
					/>
				</div>
			</div>
			<!-- Shortcuts -->
			<div class="space-y-4 rounded-lg bg-gray-800 p-4">
				<div class="flex items-center justify-between">
					<span class="text-gray-300">Right Answer Shortcut:</span>
					<button
						class="rounded-md px-4 py-2 font-semibold"
						class:bg-yellow-500={listeningFor === 'right'}
						class:text-black={listeningFor === 'right'}
						class:bg-cyan-600={listeningFor !== 'right'}
						class:hover:bg-cyan-500={listeningFor !== 'right'}
						on:click={() => (listeningFor = 'right')}
					>
						{listeningFor === 'right' ? 'Press a key...' : $settingsStore.rightAnswerShortcut}
					</button>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-gray-300">Wrong Answer Shortcut:</span>
					<button
						class="rounded-md px-4 py-2 font-semibold"
						class:bg-yellow-500={listeningFor === 'wrong'}
						class:text-black={listeningFor === 'wrong'}
						class:bg-cyan-600={listeningFor !== 'wrong'}
						class:hover:bg-cyan-500={listeningFor !== 'wrong'}
						on:click={() => (listeningFor = 'wrong')}
					>
						{listeningFor === 'wrong' ? 'Press a key...' : $settingsStore.wrongAnswerShortcut}
					</button>
				</div>
			</div>
		</div>

		<!-- Start Game Button -->
		<div class="mt-12 text-center">
			<a
				href="/game"
				class="inline-block transform rounded-lg bg-green-600 px-12 py-4 text-2xl font-bold text-white transition-transform hover:scale-105 hover:bg-green-500"
			>
				Start Game
			</a>
		</div>
	</div>
</div>
