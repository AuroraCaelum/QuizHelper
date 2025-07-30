import { sse } from '$lib/sse';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	let controller: ReadableStreamDefaultController;

	const stream = new ReadableStream({
		start(c) {
			// When the stream starts, save the controller and subscribe it to the event bus.
			controller = c;
			sse.subscribe(controller);
		},
		cancel() {
			// When the client disconnects (e.g., closes the tab), this 'cancel' function is called.
			// We use it to unsubscribe the controller, preventing memory leaks and errors.
			if (controller) {
				sse.unsubscribe(controller);
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
