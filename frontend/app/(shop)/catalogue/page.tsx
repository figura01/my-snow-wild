import type { Metadata } from "next";
import { MaterialCard } from "@/components/catalog/MaterialCard";
import { SearchForm } from "@/components/catalog/SearchForm";
import { formatDay, periodQuery, readCatalogParams } from "@/lib/catalog";
import { searchCatalog } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Catalogue" };
export const dynamic = "force-dynamic";

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = readCatalogParams(await searchParams);
  const { categories, catalog, error } = await searchCatalog(params);
  const hasPeriod = !error && catalog.days !== null;
  const query = hasPeriod ? periodQuery(params) : "";
  const categoryName = categories.find((c) => c.slug === params.categorie)?.name;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">{categoryName ?? "Catalogue"}</h1>
        <p className="text-muted">
          {hasPeriod
            ? `Matériel disponible du ${formatDay(params.du!)} au ${formatDay(params.au!)} (${catalog.days} jour${catalog.days! > 1 ? "s" : ""}).`
            : "Choisissez vos dates pour voir le matériel disponible et le prix de votre séjour."}
        </p>
      </div>

      <SearchForm categories={categories} params={params} />

      {error && (
        <p role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error} Voici le catalogue sans filtre de dates.
        </p>
      )}

      <p className="text-sm text-muted">
        {catalog.items.length} résultat{catalog.items.length > 1 ? "s" : ""}
        {catalog.unavailableCount > 0 &&
          ` · ${catalog.unavailableCount} autre${catalog.unavailableCount > 1 ? "s" : ""} complet${catalog.unavailableCount > 1 ? "s" : ""} sur ces dates`}
      </p>

      {catalog.items.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-white p-10 text-center text-muted">
          Aucun matériel ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.items.map(({ material, sizes }) => (
            <MaterialCard
              key={material.id}
              material={material}
              sizes={hasPeriod ? sizes : null}
              days={hasPeriod ? catalog.days : null}
              query={query}
            />
          ))}
        </div>
      )}
    </div>
  );
}
