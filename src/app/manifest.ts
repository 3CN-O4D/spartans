import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spartans Soccer Academy",
    short_name: "Spartans",
    description: "Official club website for Spartans Soccer Academy, Eldoret.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#c8102e",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
