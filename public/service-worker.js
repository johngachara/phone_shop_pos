import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);

// Catch navigation requests and respond with the precached offline page if offline
const offlineNavigationHandler = async () => {
    const cache = await caches.open('offline-cache');
    const cachedResponse = await cache.match('offline.html');
    return cachedResponse || new Response('You are offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/html',
        }),
    });
};

const navigationRoute = new NavigationRoute(
    new NetworkOnly({
        networkTimeoutSeconds: 3,
    }),
    {
        catchHandler: offlineNavigationHandler,
    }
);

registerRoute(navigationRoute);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('offline-cache').then((cache) => {
            return cache.add('offline.html');
        })
    );
});