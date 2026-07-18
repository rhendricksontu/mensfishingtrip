import type { MetadataRoute } from "next";

// Makes the app installable ("Add to Home Screen") — a full-screen, app-like
// launch, and the foundation for offline support (service worker) later.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Men's Fishing Trip 2026",
    short_name: "Fishing Trip",
    description:
      "Agenda, My Trip, and assignments for the annual men's fishing trip in Broken Bow.",
    start_url: "/me",
    display: "standalone",
    background_color: "#faf6ef",
    theme_color: "#1a2430",
    icons: [
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
