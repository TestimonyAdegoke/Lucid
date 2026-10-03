import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tardemah · The Bedside Dream Book",
    short_name: "Tardemah",
    description: "A private, tactile bedside dream journal. Capture dreams the moment you wake, offline-first.",
    start_url: "/journal",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#14111d",
    theme_color: "#14111d",
    categories: ["lifestyle", "books", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Record Dream",
        short_name: "New Dream",
        description: "Open your bedside book and record a new dream",
        url: "/journal?action=new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Dream Cartography",
        short_name: "Dream Map",
        description: "View recurrent motifs and dream connections",
        url: "/graph",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
