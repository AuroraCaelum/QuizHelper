import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Signal = string;

export interface Team {
    id: number;
    name: string;
    signal: Signal;
    score: number;
}

export interface Settings {
    numberOfTeams: number;
    httpPort: number;
    interruptDelay: number;
    teams: Team[];
    rightAnswerText: string;
    wrongAnswerText: string;
    rightAnswerShortcut: string;
    wrongAnswerShortcut: string;
    gameMode: 'preliminary' | 'final';
    cutline: number;
}

export const defaultSettings: Settings = {
    numberOfTeams: 4,
    httpPort: 9090,
    interruptDelay: 10,
    teams: [],
    rightAnswerText: 'Correct!',
    wrongAnswerText: 'Incorrect!',
    rightAnswerShortcut: 'r',
    wrongAnswerShortcut: 'w',
    gameMode: 'final',
    cutline: 0
};

function generateInitialTeams(numTeams: number): Team[] {
    return Array.from({ length: numTeams }, (_, i) => ({
        id: i + 1,
        name: `Team ${i + 1}`,
        signal: String.fromCharCode(65 + i),
        score: 0
    }));
}
defaultSettings.teams = generateInitialTeams(defaultSettings.numberOfTeams);

const storageKey = 'quizSettings';
const storedValue = browser ? window.localStorage.getItem(storageKey) : null;
const initialValue = storedValue ? JSON.parse(storedValue) : defaultSettings;

export const settingsStore = writable<Settings>(initialValue);
if (browser) {
    settingsStore.subscribe((value) => {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
    })
}