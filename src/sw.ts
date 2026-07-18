import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

// The member-facing routes we warm ahead of time so the whole app works
// offline even if the user hasn't navigated there yet (see CacheWarmer).
const APP_ROUTES = ["/me", "/agenda", "/locations", "/signups"];

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Take over promptly so a new deploy's assets/pages are served on relaunch.
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Agenda attachments (song sheets, maps) from Supabase Storage: they never
    // change once uploaded, so serve from cache and keep them offline.
    {
      matcher: ({ url }) => url.pathname.startsWith("/storage/v1/object/public/"),
      handler: new CacheFirst({
        cacheName: "trip-attachments",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 150,
            maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // The core member pages, matched by path for any request (document or RSC)
    // so cache-warming (a plain fetch) populates them. NetworkFirst = fresh
    // online, last-warmed copy offline. Must come before defaultCache, whose
    // page rule only matches actual navigations.
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        APP_ROUTES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`)),
      handler: new NetworkFirst({
        cacheName: "trip-pages",
        plugins: [
          new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 }),
        ],
      }),
    },
    // Everything else: Serwist's tuned Next.js defaults.
    ...defaultCache,
  ],
});

serwist.addEventListeners();
