<script lang="ts">
	import { onMount } from 'svelte';
	import { teamStore } from '../../lib/stores';
	import type { Team } from '../../app';

	let teams: Team[] = [];
	let ipAddress = '192.168.100.101:9090';
	let negativeScoreOption = -5;
	let scoreOptions = [5];
	let gameMode = 'preliminary';

	// Set game mode based on URL query parameter
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const gameMode = urlParams.get('mode') || 'preliminary';
		handleGameModeChange({ target: { value: gameMode } });
	});

	onMount(() => {
		const unsubscribe = teamStore.subscribe((value) => {
			teams = value;
		});

		return () => {
			unsubscribe();
		};
	});

	async function updateScore(teamId: number, scoreChange: number) {
		const team = teams.find((t) => t.id === teamId);
		if (team) {
			team.score += scoreChange;
			teamStore.update((currentTeams) => {
				return currentTeams.map((t) => (t.id === teamId ? { ...t, score: team.score } : t));
			});
		}
	}

	function handleGameModeChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		gameMode = select.value;
		if (gameMode === 'final') {
			negativeScoreOption = -10;
			scoreOptions = [10, 20, 30, 40, 50];
		} else {
			negativeScoreOption = -5;
			scoreOptions = [5];
		}
	}
</script>

<div class="container">
	<h1>Score Management</h1>

	<div class="game-type">
		<label for="game-mode">Game Mode:</label>
		<select id="game-mode" on:change={handleGameModeChange}>
			<option value="preliminary" selected={gameMode === 'preliminary'}>Preliminary Mode</option>
			<option value="final" selected={gameMode === 'final'}>Final Mode</option>
		</select>
	</div>

	<div class="team-list">
		{#each teams as team}
			<div class="team-card">
				<p>Team {team.id}</p>
				<h2>{team.name}</h2>
				<p>Score: {team.score}</p>
				<div class="score-buttons">
					<button on:click={() => updateScore(team.id, negativeScoreOption)} class="negative-score"
						>{negativeScoreOption}</button
					>
					{#each scoreOptions as option}
						<button on:click={() => updateScore(team.id, option)} class="positive-score"
							>{option > 0 ? `+${option}` : option}</button
						>
					{/each}
					<!-- <button on:click={() => updateScore(team.id, -3)}>-3</button>
					<button on:click={() => updateScore(team.id, -1)}>-1</button>
					<button on:click={() => updateScore(team.id, 1)}>+1</button>
					<button on:click={() => updateScore(team.id, 3)}>+3</button> -->
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		padding: 2rem;
	}

	.ip-config {
		margin-bottom: 2rem;
	}

	#ip-address {
		padding: 0.2rem;
		border-radius: 4px;
		border: 1px solid #ccc;
	}

	.team-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.team-card {
		border: 1px solid #ccc;
		padding: 1rem;
		border-radius: 8px;
	}

	.score-buttons {
		margin-top: 1rem;
		display: grid;
		gap: 0.5rem;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
	}

	.negative-score {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background-color: #dc3545;
		color: white;
		cursor: pointer;
	}

	.positive-score {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background-color: #007bff;
		color: white;
		cursor: pointer;
	}
</style>
