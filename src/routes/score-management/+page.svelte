<script lang="ts">
	import { onMount } from 'svelte';
	import { teamStore } from '../../lib/stores';
	import type { Team } from '../../app';

	let teams: Team[] = [];
	let ipAddress = '192.168.100.101:9090';

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
</script>

<div class="container">
	<h1>Score Management</h1>

	<!-- <div class="ip-config">
		<label for="ip-address">IP Address:</label>
		<input type="text" id="ip-address" bind:value={ipAddress} />
	</div> -->

	<div class="team-list">
		{#each teams as team}
			<div class="team-card">
				<p>Team {team.id}</p>
				<h2>{team.name}</h2>
				<p>Score: {team.score}</p>
				<div class="score-buttons">
					<!--- Final : -10, +10, +20, +30, +40, +50 -->
					<!--- Preliminary: -5, +5 -->
					<button on:click={() => updateScore(team.id, -3)}>-3</button>
					<button on:click={() => updateScore(team.id, -1)}>-1</button>
					<button on:click={() => updateScore(team.id, 1)}>+1</button>
					<button on:click={() => updateScore(team.id, 3)}>+3</button>
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
		display: flex;
		gap: 0.5rem;
	}

	.score-buttons button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background-color: #007bff;
		color: white;
		cursor: pointer;
	}
</style>
