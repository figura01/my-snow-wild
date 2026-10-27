import type { MetadataRoute } from "next";

// Manifeste web : nom et icônes quand le site est ajouté à l'écran d'accueil (Android, Chrome).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Snow Wild — location de matériel de ski",
    short_name: "Snow Wild",
    description: "Réservez votre matériel de ski en ligne : skis, snowboards, chaussures, casques.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#1d63d6",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
