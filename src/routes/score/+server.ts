import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sse } from '../../lib/sse';
import type { Team } from '$lib/stores';

export const POST: RequestHandler = async ({ request }) => {
	const { teams, teamName, scoreChange } = (await request.json()) as {
		teams?: Team[];
		teamName?: string;
		scoreChange?: number;
	};

	if (teams) {
		sse.broadcast('teams', teams);
	}

	if (teamName && scoreChange) {
		sse.broadcast('score_update', { teamName, scoreChange });
	}

	return json({ success: true });
};

