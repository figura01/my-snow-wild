// Classes des tableaux du back-office.
// À partir de 1024 px : tableau classique. En dessous : chaque ligne devient une carte,
// et chaque cellule affiche son intitulé (attribut data-label) à gauche de sa valeur.
export const t = {
  wrap: "rounded-2xl border border-line bg-white lg:overflow-x-auto",
  table: "block w-full text-left text-sm lg:table",
  thead: "hidden border-b border-line bg-snow text-xs uppercase tracking-wide text-muted lg:table-header-group",
  th: "px-4 py-3",
  tbody: "block lg:table-row-group",
  tr: "block border-b border-line px-4 py-3 last:border-0 lg:table-row lg:p-0",
  td: [
    "flex items-start justify-between gap-4 py-1 text-right",
    "before:shrink-0 before:text-xs before:font-semibold before:uppercase before:tracking-wide before:text-muted before:content-[attr(data-label)]",
    "lg:table-cell lg:px-4 lg:py-3 lg:text-left lg:before:content-none",
  ].join(" "),
  // Première cellule : titre de la carte sur mobile, sans intitulé.
  title: "block pb-1 text-base font-semibold lg:table-cell lg:px-4 lg:py-3 lg:text-sm lg:font-medium",
  // Cellule d'actions : alignée à droite, séparée sur mobile.
  actions: "flex justify-end gap-2 pt-2 lg:table-cell lg:px-4 lg:py-3",
  empty: "block px-4 py-8 text-center text-muted lg:table-cell",
};
