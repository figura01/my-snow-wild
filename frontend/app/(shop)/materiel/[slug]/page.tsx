import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/AddToCart";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDay, readCatalogParams, todayIso } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { MATERIAL_FIELDS } from "@/lib/graphql/catalog";
import { GraphQLRequestError, serverGraphql } from "@/lib/server/graphql";
import type { Material, SizeAvailability } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadMaterial(slug: string) {
  const { material } = await serverGraphql<{ material: Material | null }>(
    `query($slug: String!) { material(slug: $slug) { ${MATERIAL_FIELDS} } }`,
    { slug },
  );
  return material;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const material = await loadMaterial((await params).slug);
  return material
    ? { title: material.name, description: material.description ?? undefined }
    : { title: "Matériel introuvable" };
}

const dayCount = (start: string, end: string) =>
  Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;

export default async function MaterialPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { du, au } = readCatalogParams(await searchParams);
  const material = await loadMaterial(slug);
  if (!material) notFound();

  // Disponibilité taille par taille si une période est choisie.
  let sizes: SizeAvailability[] | null = null;
  let error: string | null = null;
  if (du && au) {
    try {
      ({ materialAvailability: sizes } = await serverGraphql<{ materialAvailability: SizeAvailability[] }>(
        `query($slug: String!, $s: String!, $e: String!) {
          materialAvailability(slug: $slug, startDate: $s, endDate: $e) { variantId size available }
        }`,
        { slug, s: du, e: au },
      ));
    } catch (e) {
      if (!(e instanceof GraphQLRequestError)) throw e;
      error = e.message;
    }
  }
  const days = sizes && du && au ? dayCount(du, au) : null;
  const today = todayIso();

  return (
    <div className="flex flex-col gap-8">
      <Link href={`/catalogue?categorie=${material.category.slug}`} className="text-sm text-muted hover:text-ink">
        ← {material.category.name}
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-3xl border border-line bg-gradient-to-br from-sky-50 to-slate-100">
          {material.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={material.imageUrl} alt={material.name} className="h-full w-full object-contain p-10" />
          ) : (
            <CategoryIcon slug={material.category.slug} className="h-28 w-28 text-glacier/70" />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-muted">{material.category.name}</span>
            <h1 className="text-4xl font-extrabold tracking-tight">{material.name}</h1>
            <p className="text-2xl font-bold">
              {formatPrice(material.dailyPriceCents)} <span className="text-base font-normal text-muted">/ jour</span>
            </p>
            {material.description && <p className="text-muted">{material.description}</p>}
          </div>

          <form method="get" className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="du">Du</Label>
              <Input id="du" name="du" type="date" min={today} defaultValue={du} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="au">Au</Label>
              <Input id="au" name="au" type="date" min={today} defaultValue={au} required />
            </div>
            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              Vérifier
            </button>
          </form>

          {error && (
            <p role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="font-semibold">
              {sizes ? `Disponibilité du ${formatDay(du!)} au ${formatDay(au!)}` : "Tailles proposées"}
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(sizes ?? material.variants.map((v) => ({ variantId: v.id, size: v.size, available: v.stock }))).map((s) => (
                <li
                  key={s.variantId}
                  className={`flex flex-col rounded-xl border px-3 py-2 ${s.available > 0 ? "border-line bg-white" : "border-line bg-snow text-muted"}`}
                >
                  <span className="font-semibold">{s.size}</span>
                  <span className="text-xs">
                    {sizes
                      ? s.available > 0
                        ? `${s.available} disponible${s.available > 1 ? "s" : ""}`
                        : "Complet sur ces dates"
                      : `${s.available} en stock`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {days && (
            <p className="rounded-2xl bg-ink px-5 py-4 text-white">
              {days} jour{days > 1 ? "s" : ""} de location :{" "}
              <strong>{formatPrice(material.dailyPriceCents * days)}</strong> par article
            </p>
          )}

          <AddToCart
            material={{
              materialId: material.id,
              slug: material.slug,
              name: material.name,
              categorySlug: material.category.slug,
              imageUrl: material.imageUrl,
              dailyPriceCents: material.dailyPriceCents,
            }}
            sizes={sizes}
            period={sizes && du && au ? { startDate: du, endDate: au } : null}
          />
        </div>
      </div>
    </div>
  );
}
