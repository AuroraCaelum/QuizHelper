import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sse } from '../../lib/sse';
import type { Team } from '../../app';

export const POST: RequestHandler = async ({ request }) => {
	const { teams } = (await request.json()) as { teams: Team[] };

	if (teams) {
		sse.broadcast('teams', teams);
		return json({ success: true });
	}

	return json({ success: false, message: 'Missing teams data' }, { status: 400 });
};
