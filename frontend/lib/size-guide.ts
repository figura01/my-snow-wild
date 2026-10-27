// Conseils de taille affichés sur la fiche produit, par catégorie (repères généraux).
export const SIZE_GUIDES: Record<string, { title: string; tips: string[] }> = {
  skis: {
    title: "Choisir la longueur de ses skis",
    tips: [
      "Débutant : environ votre taille moins 15 cm.",
      "Intermédiaire : votre taille moins 10 cm.",
      "Confirmé : votre taille moins 5 cm, voire votre taille.",
    ],
  },
  snowboards: {
    title: "Choisir la longueur de sa planche",
    tips: [
      "Debout, la planche doit arriver entre le menton et la clavicule.",
      "Plus courte pour le freestyle, plus longue pour la poudreuse.",
    ],
  },
  chaussures: {
    title: "Choisir sa pointure",
    tips: [
      "Prenez votre pointure de ville habituelle.",
      "Le pied doit être maintenu sans point de pression ; les orteils effleurent l'avant.",
    ],
  },
  casques: {
    title: "Choisir la taille de son casque",
    tips: [
      "Mesurez votre tour de tête juste au-dessus des sourcils.",
      "XS : 48–52 cm · S : 52–55 cm · M : 55–58 cm · L : 58–61 cm.",
    ],
  },
  batons: {
    title: "Choisir la longueur de ses bâtons",
    tips: [
      "Bâton retourné, poignée au sol : votre avant-bras doit former un angle droit.",
      "Repère rapide : votre taille × 0,7, arrondie aux 5 cm.",
    ],
  },
};
