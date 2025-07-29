<script lang="ts">
	import {
		settingsStore,
		defaultSettings,
		type Settings,
		type Team,
		type Signal
	} from '$lib/stores';

	// --- State for shortcut setting ---
	let listeningFor: 'right' | 'wrong' | null = null;

	// --- Reactive statement to manage team settings ---
	$: {
		const { numberOfTeams, teams } = $settingsStore;
		const currentCount = teams.length;

		if (numberOfTeams !== currentCount) {
			const newTeams = [...teams];
			if (numberOfTeams > currentCount) {
				const signals = Array.from({ length: 26 }, (_, j) => String.fromCharCode(65 + j));
				for (let i = currentCount; i < numberOfTeams; i++) {
					newTeams.push({
						id: i + 1,
						name: `Team ${i + 1}`,
						signal: signals[i % signals.length],
						score: 0
					});
				}
				$settingsStore.teams = newTeams;
			} else {
				$settingsStore.teams = teams.slice(0, numberOfTeams);
			}
		}
	}

	

	// --- Event Handlers ---
	function handleGameModeChange() {
		$settingsStore.numberOfTeams = defaultSettings.numberOfTeams;
		$settingsStore.teams = defaultSettings.teams;
	}

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
				<label for="game-mode" class="block text-sm font-medium text-gray-300">Game Mode</label>
				<select
					id="game-mode"
					class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
					bind:value={$settingsStore.gameMode}
					on:change={handleGameModeChange}
				>
					<option value="final">Final Mode</option>
					<option value="preliminary">Preliminary Mode</option>
				</select>
			</div>
			{#if $settingsStore.gameMode === 'preliminary'}
				<div class="rounded-lg bg-gray-800 p-4">
					<label for="cutline" class="block text-sm font-medium text-gray-300">Cutline</label>
					<input
						type="number"
						id="cutline"
						min="0"
						class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
						bind:value={$settingsStore.cutline}
					/>
				</div>
			{/if}
			<div class="rounded-lg bg-gray-800 p-4">
				<label for="num-teams" class="block text-sm font-medium text-gray-300"
					>Number of Teams</label
				>
				<input
					type="number"
					id="num-teams"
					min="1"
					max="26"
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
							<option>--</option>
							<option>H</option>
							<option>I</option>
							<option>J</option>
							<option>K</option>
							<option>L</option>
							<option>M</option>
							<option>N</option>
							<option>O</option>
							<option>P</option>
							<option>Q</option>
							<option>R</option>
							<option>S</option>
							<option>T</option>
							<option>U</option>
							<option>V</option>
							<option>W</option>
							<option>X</option>
							<option>Y</option>
							<option>Z</option>
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
