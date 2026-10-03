import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lucid Dream Journal",
    short_name: "Lucid",
    description: "Your private dream journal.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f0eb",
    theme_color: "#8f78b8",
  };
}
