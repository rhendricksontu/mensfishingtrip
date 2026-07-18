import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
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
  // Safety net: if a request can't be served (offline), serve the cached page
  // for that navigation (ignoreVary is the key — Next sets a Vary header), or a
  // clean offline message — never the browser's "can't open the page" error.
  catchHandler: async ({ request }) => {
    if (request.mode === "navigate") {
      const cached = await caches.match(request, { ignoreVary: true, ignoreSearch: true });
      if (cached) return cached;
      return new Response(
        "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>" +
          "<body style='font-family:system-ui,sans-serif;text-align:center;padding:2rem;color:#202d3a'>" +
          "<p style='font-weight:600'>Offline</p>" +
          "<p style='color:#5f7185;font-size:.9rem'>This page isn't saved offline yet. Reconnect and open it once.</p>" +
          "</body>",
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
    return Response.error();
  },
  // Off on purpose: with navigation preload, iOS Safari fires its own network
  // request for a navigation and, offline, shows "Safari can't open the page"
  // instead of letting the SW serve the cached document.
  navigationPreload: false,
  runtimeCaching: [
    // API (e.g. the version check) is always live — never cache.
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    // Agenda attachments (song sheets, maps) from Supabase Storage: they never
    // change once uploaded, so serve from cache and keep them offline.
    {
      matcher: ({ url }) => url.pathname.startsWith("/storage/v1/object/public/"),
      handler: new CacheFirst({
        cacheName: "trip-attachments",
        // Match by URL only — Next/Supabase set Vary headers that otherwise
        // make the cached response invisible to lookups.
        matchOptions: { ignoreVary: true },
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
        // Ignore Next's Vary: RSC/Next-Router-* header so the cached document is
        // actually returned on offline lookup (matched by URL only).
        matchOptions: { ignoreVary: true },
        plugins: [
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }),
        ],
      }),
    },
    // All build assets (JS + CSS + media), matched by URL so the cache-warmer's
    // plain fetch() populates them — not just <script>/<link> loads. Without
    // this, a page warmed but never opened online loads offline unstyled or
    // missing chunks. Immutable (content-hashed), so CacheFirst.
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "next-static",
        matchOptions: { ignoreVary: true },
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
      }),
    },
    // Everything else: Serwist's tuned Next.js defaults.
    ...defaultCache,
  ],
});

serwist.addEventListeners();
