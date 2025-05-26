import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BASE_URL } from './config';
 
// Do precaching
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);
 
// Runtime caching
registerRoute(
  ({ url }) => {
    return url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';
  },
  new CacheFirst({
    cacheName: 'google-fonts',
  }),
);
registerRoute(
  ({ url }) => {
    return url.origin === 'https://cdnjs.cloudflare.com' || url.origin.includes('fontawesome');
  },
  new CacheFirst({
    cacheName: 'fontawesome',
  }),
);
registerRoute(
  ({ url }) => {
    return url.origin === 'https://ui-avatars.com';
  },
  new CacheFirst({
    cacheName: 'avatars-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination !== 'image';
  },
  new NetworkFirst({
    cacheName: 'citycare-api',
  }),
);
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'citycare-api-images',
  }),
);
registerRoute(
  ({ url }) => {
    return url.origin.includes('maptiler');
  },
  new CacheFirst({
    cacheName: 'maptiler-api',
  }),
);

self.addEventListener('push', (event) => {
  console.log('Service worker pushing...');

  async function chainPromise() {
    if (event.data) {
      try {
        const data = event.data.json();
        if (data.type === 'story_created') {
          notificationData = {
            title: 'Story berhasil dibuat',
            options: {
              body: `Anda telah membuat story baru dengan deskripsi: ${data.description}`,
            },
          };
        }
      } catch (error) {
        console.error('Error parsing push event data:', error);
      }
    }

    await self.registration.showNotification(notificationData.title, notificationData.options);
  }

  event.waitUntil(chainPromise());
});

// Menangani pesan dari postMessage
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);

  if (event.data && event.data.type === 'story_created') {
    const notificationData = {
      title: 'Story berhasil dibuat',
      options: {
        body: `Anda telah membuat story baru dengan deskripsi: ${event.data.description}`,
      },
    };

    self.registration.showNotification(notificationData.title, notificationData.options).catch((error) => {
      console.error('Error showing notification:', error);
    });
  }
});