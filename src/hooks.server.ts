// src/hooks.server.ts

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// This hook will run for every request to the server.

	// We now only care about the root path ('/') for signals.
	// We also check if the 'sig' parameter is present to avoid adding
	// headers for every single asset request to the root.
	if (event.url.pathname === '/' && event.url.searchParams.has('sig')) {
		// Handle CORS preflight requests (OPTIONS method)
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Access-Control-Allow-Origin': '*', // Allow any origin
					'Access-Control-Allow-Headers': '*'
				}
			});
		}
	}

	// For actual GET requests, resolve the request as normal,
	// but add the CORS header to the response if it's a signal request.
	const response = await resolve(event);
	if (event.url.pathname === '/' && event.url.searchParams.has('sig')) {
		response.headers.set('Access-Control-Allow-Origin', '*'); // Allow any origin
	}

	return response;
};
