import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
} from "serwist";

// Routes we cache/warm so the app works offline even if the user hasn't opened
// them yet (see CacheWarmer). "/admin" covers all organizer tabs.
const APP_ROUTES = ["/me", "/agenda", "/locations", "/signups", "/admin"];

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
          // Cache opaque (no-cors) responses too, so pre-warmed images store.
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 150,
            maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // The core member/organizer pages, kept offline as full DOCUMENTS (the
    // cache-warmer's plain fetch + real navigations). We deliberately exclude
    // RSC requests (React payloads from client-side nav and LiveRefresh's
    // router.refresh) — those churn constantly and would evict the documents
    // we need for offline. They fall through to defaultCache's own RSC cache.
    // NetworkFirst = fresh online, last-warmed copy offline.
    {
      matcher: ({ request, url, sameOrigin }) =>
        request.method === "GET" &&
        sameOrigin &&
        request.headers.get("RSC") !== "1" &&
        APP_ROUTES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`)),
      handler: new NetworkFirst({
        cacheName: "trip-pages",
        plugins: [
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }),
        ],
      }),
    },
    // Everything else: Serwist's tuned Next.js defaults.
    ...defaultCache,
  ],
});

serwist.addEventListeners();
