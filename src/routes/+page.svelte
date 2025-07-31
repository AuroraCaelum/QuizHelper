<script lang="ts">
	import { settingsStore, teamStore, defaultSettings, type Team } from '$lib/stores';

	// --- State for shortcut setting ---
	let listeningFor: 'right' | 'wrong' | null = null;

	// --- Reactive statement to manage team settings ---
	$: {
		const { numberOfTeams } = $settingsStore;
		const currentCount = $teamStore.length;

		if (numberOfTeams !== currentCount) {
			const newTeams = [...$teamStore];
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
				$teamStore = newTeams;
			} else {
				$teamStore = $teamStore.slice(0, numberOfTeams);
			}
		}
	}

	// --- Event Handlers ---
	function handleGameModeChange() {
		$settingsStore.numberOfTeams = defaultSettings.numberOfTeams;
	}

	function handleResetSettings() {
		if (confirm('정말 세팅 정보를 초기화하시겠습니까?')) {
			if (confirm('이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?')) {
				settingsStore.set(defaultSettings);
				const numTeams = defaultSettings.numberOfTeams;
				const defaultTeams = Array.from({ length: numTeams }, (_, i) => ({
					id: i + 1,
					name: `Team ${i + 1}`,
					signal: String.fromCharCode(65 + i),
					score: 0
				}));
				teamStore.set(defaultTeams);
			}
		}
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

	async function loadCSV() {
		try {
			const response = await fetch('/teamdata.csv');
			if (!response.ok) {
				alert(
					'데이터 파일을 불러오는 데 실패했습니다. static 폴더에 teamdata.csv 파일이 있는지 확인하세요.'
				);
				return;
			}
			const csvData = await response.text();
			const lines = csvData.trim().split('\n');
			const newTeams: Team[] = lines.map((line) => {
				const [id, name, type] = line.split(',');
				return {
					id: parseInt(id, 10),
					name,
					signal: String.fromCharCode(64 + parseInt(id, 10)), // A=1, B=2, ..., Z=26
					score: 0,
					handicapApplied: type.trim() === '학생부'
				};
			});
			teamStore.set(newTeams);
		} catch (error) {
			console.error('Error loading CSV:', error);
			alert('CSV 파일을 불러오는 중 오류가 발생했습니다. 콘솔을 확인하세요.');
		}
	}

	function handleTeamChange() {
		$teamStore = $teamStore;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-gray-900 p-8 font-sans text-white">
	<div class="mx-auto max-w-4xl">
		<h1 class="mb-8 border-b-2 border-cyan-500 pb-2 text-4xl font-bold text-cyan-400">
			게임 및 부저 세팅
		</h1>

		<!-- General Settings -->
		<div class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
			<div class="rounded-lg bg-gray-800 p-4">
				<label for="game-mode" class="block text-sm font-medium text-gray-300">게임 모드</label>
				<select
					id="game-mode"
					class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
					value={$settingsStore.gameMode}
					on:change={(e) => {
						$settingsStore.gameMode = e.currentTarget.value;
						handleGameModeChange();
					}}
				>
					<option value="final">결승전 모드</option>
					<option value="preliminary">예선전 모드</option>
				</select>
			</div>
			{#if $settingsStore.gameMode === 'preliminary'}
				<div class="rounded-lg bg-gray-800 p-4">
					<label for="cutline" class="block text-sm font-medium text-gray-300"
						>결승 진출 커트라인</label
					>
					<input
						type="number"
						id="cutline"
						min="0"
						class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
						value={$settingsStore.cutline}
						on:input={(e) => ($settingsStore.cutline = e.currentTarget.valueAsNumber)}
					/>
				</div>
				<div class="rounded-lg bg-gray-800 p-4">
					<label for="handicap" class="block text-sm font-medium text-gray-300"
						>핸디캡 커트라인</label
					>
					<input
						type="number"
						id="handicap-cutline"
						min="0"
						class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
						value={$settingsStore.handicapCutline}
						on:input={(e) => ($settingsStore.handicapCutline = e.currentTarget.valueAsNumber)}
					/>
				</div>
			{/if}
			<div class="rounded-lg bg-gray-800 p-4">
				<label for="num-teams" class="block text-sm font-medium text-gray-300">전체 팀 수</label>
				<input
					type="number"
					id="num-teams"
					min="1"
					max="26"
					class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
					value={$settingsStore.numberOfTeams}
					on:input={(e) => ($settingsStore.numberOfTeams = e.currentTarget.valueAsNumber)}
				/>
			</div>
			<div class="rounded-lg bg-gray-800 p-4">
				<label for="http-port" class="block text-sm font-medium text-gray-300">HTTP 포트</label>
				<input
					type="number"
					id="http-port"
					class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
					value={$settingsStore.httpPort}
					on:input={(e) => ($settingsStore.httpPort = e.currentTarget.valueAsNumber)}
				/>
			</div>
			<div class="rounded-lg bg-gray-800 p-4">
				<label for="interrupt-delay" class="block text-sm font-medium text-gray-300"
					>인터럽트 딜레이 (초)</label
				>
				<input
					type="number"
					min="0"
					step="0.1"
					id="interrupt-delay"
					class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
					value={$settingsStore.interruptDelay}
					on:input={(e) => ($settingsStore.interruptDelay = e.currentTarget.valueAsNumber)}
				/>
			</div>
		</div>

		<!-- Team Settings -->
		<div class="flex items-center justify-between">
			<h2 class="mb-4 text-2xl font-semibold text-cyan-400">팀 이름 & 고유 신호</h2>
			{#if $settingsStore.gameMode === 'preliminary'}
				<button
					on:click={loadCSV}
					class="rounded-lg bg-blue-600 px-4 py-2 text-lg font-semibold text-white transition-colors hover:bg-blue-500"
					>CSV 불러오기</button
				>
			{/if}
		</div>
		<div class="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each $teamStore as team, i (team.id)}
				<div class="flex flex-col gap-4 rounded-lg bg-gray-800 p-4">
					<div class="flex items-center gap-4">
						<span class="text-xl font-bold text-cyan-400">{i + 1}</span>
						<div class="flex-grow">
							<label for="team-name-{i}" class="sr-only">Team {i + 1} Name</label>
							<input
								type="text"
								id="team-name-{i}"
								placeholder="Team Name"
								class="w-full rounded-md border-gray-600 bg-gray-700 p-1 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
								value={team.name}
								on:input={(e) => {
									team.name = e.currentTarget.value;
									handleTeamChange();
								}}
							/>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<div class="flex-grow">
							<label for="team-signal-{i}" class="sr-only">Team {i + 1} Signal</label>
							<select
								id="team-signal-{i}"
								class="w-full rounded-md border-gray-600 bg-gray-700 p-1 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
								value={team.signal}
								on:change={(e) => {
									team.signal = e.currentTarget.value;
									handleTeamChange();
								}}
							>
								<option>A</option>
								<option>B</option>
								<option>C</option>
								<option>D</option>
								<option>E</option>
								<option>F</option>
								<option>G</option>
								<option>H</option>
								<option>I</option>
								<option>J</option>
								<option>--</option>
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
						{#if $settingsStore.gameMode === 'preliminary'}
							<div>
								<label class="inline-flex items-center">
									<button
										class="rounded-md px-4 py-2 font-semibold"
										class:bg-green-600={team.handicapApplied}
										class:bg-gray-600={!team.handicapApplied}
										class:hover:bg-green-500={team.handicapApplied}
										class:hover:bg-gray-500={!team.handicapApplied}
										on:click={() => {
											team.handicapApplied = !team.handicapApplied;
											handleTeamChange();
										}}
									>
										{team.handicapApplied ? '핸디캡 켜짐' : '핸디캡 꺼짐'}
									</button>
								</label>
							</div>
						{/if}
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
						>정답 메세지</label
					>
					<input
						type="text"
						id="right-answer-text"
						class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
						value={$settingsStore.rightAnswerText}
						on:input={(e) => ($settingsStore.rightAnswerText = e.currentTarget.value)}
					/>
				</div>
				<div>
					<label for="wrong-answer-text" class="block text-sm font-medium text-gray-300"
						>오답 메세지</label
					>
					<input
						type="text"
						id="wrong-answer-text"
						class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
						value={$settingsStore.wrongAnswerText}
						on:input={(e) => ($settingsStore.wrongAnswerText = e.currentTarget.value)}
					/>
				</div>
			</div>
			<!-- Shortcuts -->
			<div class="space-y-4 rounded-lg bg-gray-800 p-4">
				<div class="flex items-center justify-between">
					<span class="text-gray-300">정답 단축키:</span>
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
					<span class="text-gray-300">오답 단축키:</span>
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

		<!-- Action Buttons -->
		<div class="mt-12 flex justify-center gap-4">
			<a
				href="/game"
				class="inline-block transform rounded-lg bg-green-600 px-12 py-4 text-2xl font-bold text-white transition-transform hover:scale-105 hover:bg-green-500"
			>
				게임 시작
			</a>
		</div>

		<!-- Reset Button -->
		<div class="mt-12 flex justify-center">
			<button
				on:click={handleResetSettings}
				class="rounded-lg bg-red-800 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-red-700"
			>
				세팅 값 리셋
			</button>
		</div>

		<!-- Footer -->
		<div class="mt-16 text-center text-gray-400">
			<p>Made for 성경침례교회 청년부 © 2025</p>
			<p>
				<a
					href="https://github.com/AuroraCaelum/QuizHelper"
					target="_blank"
					rel="noopener noreferrer"
					class="text-cyan-400 hover:underline"
				>
					<img src="/github-mark-white.svg" alt="GitHub" class="mt-4 mr-2 inline-block h-6 w-6" />
				</a>
			</p>
		</div>
	</div>
</div>
