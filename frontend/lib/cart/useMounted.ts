"use client";

import { useEffect, useState } from "react";

// Le panier vit dans le localStorage, inconnu du serveur : on attend le montage
// côté client avant de l'afficher, pour éviter un décalage entre le rendu
// serveur (panier vide) et le rendu client.
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
