import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Signal = string;

export interface Team {
	id: number;
	name: string;
	signal: Signal;
	score: number;
    handicapApplied?: boolean; // Optional for preliminary mode
}

export interface Settings {
	numberOfTeams: number;
	httpPort: number;
	interruptDelay: number;
	rightAnswerText: string;
	wrongAnswerText: string;
	rightAnswerShortcut: string;
	wrongAnswerShortcut: string;
	gameMode: 'preliminary' | 'final';
	cutline: number;
    handicapCutline?: number; // Optional for preliminary mode
}

export const defaultSettings: Settings = {
	numberOfTeams: 4,
	httpPort: 9090,
	interruptDelay: 10,
	rightAnswerText: 'Correct!',
	wrongAnswerText: 'Incorrect!',
	rightAnswerShortcut: 'r',
	wrongAnswerShortcut: 'w',
	gameMode: 'final',
	cutline: 0,
    handicapCutline: 0 // Default to 0 for final mode
};

function generateInitialTeams(numTeams: number): Team[] {
	return Array.from({ length: numTeams }, (_, i) => ({
		id: i + 1,
		name: `Team ${i + 1}`,
		signal: String.fromCharCode(65 + i),
		score: 0
	}));
}

// --- Settings Store ---
const settingsStorageKey = 'quizSettings';
const storedSettings = browser ? window.localStorage.getItem(settingsStorageKey) : null;
const initialSettings: Settings = storedSettings ? JSON.parse(storedSettings) : defaultSettings;

// Clean up legacy 'teams' property from settings if it exists
if ((initialSettings as any).teams) {
	delete (initialSettings as any).teams;
}

export const settingsStore = writable<Settings>(initialSettings);

if (browser) {
	settingsStore.subscribe((value) => {
		window.localStorage.setItem(settingsStorageKey, JSON.stringify(value));
	});
}

// --- Team Store ---
const teamStorageKey = 'quizTeams';
const storedTeams = browser ? window.localStorage.getItem(teamStorageKey) : null;
const initialTeams: Team[] = storedTeams
	? JSON.parse(storedTeams)
	: generateInitialTeams(initialSettings.numberOfTeams);

export const teamStore = writable<Team[]>(initialTeams);

if (browser) {
	teamStore.subscribe((value) => {
		// When teams are updated via the store, update localStorage
		if (value) {
			const currentStorage = window.localStorage.getItem(teamStorageKey);
			const newStorage = JSON.stringify(value);
			if (currentStorage !== newStorage) {
				window.localStorage.setItem(teamStorageKey, newStorage);
				// This also implicitly updates numberOfTeams in the settings store
				settingsStore.update((settings) => ({ ...settings, numberOfTeams: value.length }));
			}
		}
	});

	// Listen for changes in other tabs
	window.addEventListener('storage', (event) => {
		if (event.key === teamStorageKey && event.newValue) {
			teamStore.set(JSON.parse(event.newValue));
		}
		if (event.key === settingsStorageKey && event.newValue) {
			settingsStore.set(JSON.parse(event.newValue));
		}
	});
}
