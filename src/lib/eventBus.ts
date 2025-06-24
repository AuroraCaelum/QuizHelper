// A more robust, multi-client-aware event bus.
const controllers = new Set<ReadableStreamDefaultController>();

export const eventBus = {
	/**
	 * Adds a new client's controller to the broadcast list.
	 * @param controller The controller from the new ReadableStream.
	 */
	subscribe(controller: ReadableStreamDefaultController) {
		controllers.add(controller);
		console.log(`Client connected. Total clients: ${controllers.size}`);
	},

	/**
	 * Removes a client's controller from the broadcast list.
	 * @param controller The controller of the disconnected stream.
	 */
	unsubscribe(controller: ReadableStreamDefaultController) {
		controllers.delete(controller);
		console.log(`Client disconnected. Total clients: ${controllers.size}`);
	},

	/**
	 * Sends data to all connected clients.
	 * @param data The data object to send.
	 */
	broadcast(data: any) {
		if (controllers.size === 0) {
			console.log('No clients connected to broadcast to.');
			return;
		}
		
		console.log(`Broadcasting data to ${controllers.size} client(s): ${JSON.stringify(data)}`);
		for (const controller of controllers) {
			try {
				// Enqueue the data in the SSE format.
				controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
			} catch (e) {
				// The client might have disconnected without the `cancel` event firing yet.
				// We can safely remove it here.
				console.warn('Could not send to a client, removing it from the broadcast list.');
				this.unsubscribe(controller);
			}
		}
	}
};