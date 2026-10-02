import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Beyond Notes",
    short_name: "Beyond",
    description:
      "Pixel-art task & notes manager: kanban, voice capture, reminders and focus timer.",
    start_url: "/boards",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "any",
    background_color: "#050a06",
    theme_color: "#050a06",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Boards", url: "/boards", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Notes", url: "/notes", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Focus", url: "/focus", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
