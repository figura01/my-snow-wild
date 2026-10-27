// Classes des tableaux du back-office.
// À partir de 768 px : tableau classique. En dessous : chaque ligne devient une carte,
// et chaque cellule affiche son intitulé (attribut data-label) à gauche de sa valeur.
export const t = {
  wrap: "rounded-2xl border border-line bg-white md:overflow-x-auto",
  table: "block w-full text-left text-sm md:table",
  thead: "hidden border-b border-line bg-snow text-xs uppercase tracking-wide text-muted md:table-header-group",
  th: "px-4 py-3",
  tbody: "block md:table-row-group",
  tr: "block border-b border-line px-4 py-3 last:border-0 md:table-row md:p-0",
  td: [
    "flex items-start justify-between gap-4 py-1 text-right",
    "before:shrink-0 before:text-xs before:font-semibold before:uppercase before:tracking-wide before:text-muted before:content-[attr(data-label)]",
    "md:table-cell md:px-4 md:py-3 md:text-left md:before:content-none",
  ].join(" "),
  // Première cellule : titre de la carte sur mobile, sans intitulé.
  title: "block pb-1 text-base font-semibold md:table-cell md:px-4 md:py-3 md:text-sm md:font-medium",
  // Cellule d'actions : alignée à droite, séparée sur mobile.
  actions: "flex justify-end gap-2 pt-2 md:table-cell md:px-4 md:py-3",
  empty: "block px-4 py-8 text-center text-muted md:table-cell",
};
