import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
