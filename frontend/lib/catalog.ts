// Paramètres de recherche du catalogue, lus depuis l'URL (?q=&categorie=&du=&au=).
export type CatalogParams = { q?: string; categorie?: string; du?: string; au?: string };

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

export function readCatalogParams(searchParams: Record<string, string | string[] | undefined>): CatalogParams {
  return {
    q: one(searchParams.q),
    categorie: one(searchParams.categorie),
    du: one(searchParams.du),
    au: one(searchParams.au),
  };
}

/** Conserve la période choisie quand on passe du catalogue à une fiche produit. */
export function periodQuery(params: Pick<CatalogParams, "du" | "au">): string {
  if (!params.du || !params.au) return "";
  return `?${new URLSearchParams({ du: params.du, au: params.au })}`;
}

export const todayIso = () => new Date().toISOString().slice(0, 10);

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
export const formatDay = (iso: string) => dateFmt.format(new Date(`${iso}T12:00:00`));
