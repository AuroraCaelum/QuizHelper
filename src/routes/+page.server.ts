import { eventBus } from '$lib/eventBus';
import type { PageServerLoad } from './$types';

/**
 * This `load` function runs on the server every time the root page is requested.
 */
export const load: PageServerLoad = ({ url }) => {
    // Check if a 'sig' query parameter exists in the URL.
    const signal = url.searchParams.get('sig');

    if (signal) {
        // If a signal is found, broadcast it to all connected game pages.
        console.log(`Signal '${signal}' received at root URL.`);
        eventBus.broadcast({ type: 'signal', payload: signal });
        
        // Note: We don't need to return anything special. The request
        // will continue on to render the settings page normally.
        // This is perfect because the hardware doesn't care about a response,
        // and a regular user visiting the root won't see any difference.
    }

    // Return an empty object so the page can render.
    // You could also load initial data for your settings page here if needed.
    return {};
};