import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Don't reuse a stale prefetched copy of a dynamic page on client-side
    // navigation — always refetch so edits (e.g. a cabin rename) show up
    // without a manual refresh. Offline is handled by the service worker.
    staleTimes: { dynamic: 0, static: 180 },
  },
};

// Service worker for offline use in the field (weak signal at Broken Bow) and
// clean updates. Generated at build time into public/sw.js.
const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // Don't run the SW in local dev; it complicates iteration and hot reload.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
