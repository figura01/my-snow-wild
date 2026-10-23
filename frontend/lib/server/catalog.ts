import "server-only";
import { MATERIAL_FIELDS } from "@/lib/graphql/catalog";
import type { CatalogParams } from "@/lib/catalog";
import type { Material, SizeAvailability } from "@/lib/types";
import { GraphQLRequestError, serverGraphql } from "./graphql";

export type CatalogItem = { material: Material; available: number | null; sizes: SizeAvailability[] | null };
export type CatalogResult = { items: CatalogItem[]; days: number | null; unavailableCount: number };
export type CategoryOption = { slug: string; name: string };

const QUERY = `query Catalog($filter: CatalogFilter) {
  categories { slug name }
  catalog(filter: $filter) {
    days
    unavailableCount
    items { available sizes { variantId size available } material { ${MATERIAL_FIELDS} } }
  }
}`;

type Data = { categories: CategoryOption[]; catalog: CatalogResult };

/** Recherche dans le catalogue. Une période invalide renvoie le catalogue sans dates et un message. */
export async function searchCatalog(params: CatalogParams): Promise<Data & { error: string | null }> {
  const filter = {
    search: params.q,
    categorySlug: params.categorie,
    startDate: params.du,
    endDate: params.au,
  };
  try {
    return { ...(await serverGraphql<Data>(QUERY, { filter })), error: null };
  } catch (e) {
    if (!(e instanceof GraphQLRequestError)) throw e;
    const fallback = await serverGraphql<Data>(QUERY, {
      filter: { search: params.q, categorySlug: params.categorie },
    });
    return { ...fallback, error: e.message };
  }
}
