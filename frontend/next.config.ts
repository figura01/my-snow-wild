import type { NextConfig } from "next";

// Adresse du back-end vue depuis le serveur Next.js (dans Docker : http://backend:4000).
const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Image de production minimale : Next ne copie que le nécessaire.
  output: "standalone",
  // Le navigateur appelle /graphql sur le même domaine que le site ; Next relaie
  // vers l'API. Le cookie d'authentification reste ainsi « same-site ».
  async rewrites() {
    return [
      { source: "/graphql", destination: `${backendUrl}/graphql` },
      // Photos des matériels : envoi depuis le back-office et fichiers.
      { source: "/api/materials/:id/images", destination: `${backendUrl}/api/materials/:id/images` },
      { source: "/uploads/:file", destination: `${backendUrl}/uploads/:file` },
    ];
  },
};

export default nextConfig;
