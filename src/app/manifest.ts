import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dobby — Decision Dwarf",
    short_name: "Dobby",
    description: "Shake your phone. Ruin a dwarf's day. Get an answer.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1419",
    theme_color: "#1f2937",
    categories: ["entertainment", "games"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops icons to whatever shape the launcher uses; this one has
      // the art inset into the safe zone so his hat survives a circle mask.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
