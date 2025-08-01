import { sse } from '$lib/sse';
import type { RequestHandler } from './$types';

// This handles GET /api/signal?sig=A
export const GET: RequestHandler = async ({ url }) => {
	const signal = url.searchParams.get('sig');

	if (!signal) {
		return new Response('Missing "sig" query parameter', { status: 400 });
	}

	// Broadcast the signal to any connected Game Page
	sse.broadcast('signal', signal);

	return new Response(`Signal '${signal}' received.`, {
		headers: { 'Content-Type': 'text/plain' }
	});
};
