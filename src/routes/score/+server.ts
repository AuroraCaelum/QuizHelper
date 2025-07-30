import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sse } from '../../lib/sse';

export const GET: RequestHandler = async ({ url }) => {
	const sig = url.searchParams.get('sig');
	const score = url.searchParams.get('score');

	if (sig && score) {
		sse.broadcast({ sig, score: parseInt(score, 10) });
		return json({ success: true });
	}

	return json({ success: false, message: 'Missing sig or score' }, { status: 400 });
};