import { Check, CreditCard, Gauge, ShieldCheck, Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/AddToCart";
import { MaterialCard } from "@/components/catalog/MaterialCard";
import { Gallery } from "@/components/product/Gallery";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDay, periodQuery, readCatalogParams, todayIso } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { MATERIAL_FIELDS } from "@/lib/graphql/catalog";
import { GraphQLRequestError, serverGraphql } from "@/lib/server/graphql";
import { SIZE_GUIDES } from "@/lib/size-guide";
import { LEVEL_LABELS, type Material, type SizeAvailability } from "@/lib/types";

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

/** Autres matériels de la même catégorie (trois au plus). */
async function loadRelated(material: Material) {
  const { catalog } = await serverGraphql<{ catalog: { items: { material: Material }[] } }>(
    `query($slug: String!) { catalog(filter: { categorySlug: $slug }) { items { material { ${MATERIAL_FIELDS} } } } }`,
    { slug: material.category.slug },
  );
  return catalog.items.map((item) => item.material).filter((m) => m.id !== material.id).slice(0, 3);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const material = await loadMaterial((await params).slug);
  return material
    ? {
        title: material.name,
        description: material.description ?? undefined,
        openGraph: material.coverUrl ? { images: [material.coverUrl] } : undefined,
      }
    : { title: "Matériel introuvable" };
}

const dayCount = (start: string, end: string) =>
  Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;

const reassurance = [
  { icon: Timer, text: "Disponibilité vérifiée en temps réel, taille par taille" },
  { icon: ShieldCheck, text: "Matériel bloqué pour vous 30 minutes pendant le paiement" },
  { icon: CreditCard, text: "Paiement sécurisé par Stripe" },
];

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
  const related = await loadRelated(material);
  const guide = SIZE_GUIDES[material.category.slug];
  const shown = sizes ?? material.variants.map((v) => ({ variantId: v.id, size: v.size, available: v.inService }));

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li><Link href="/" className="hover:text-ink">Accueil</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/catalogue" className="hover:text-ink">Catalogue</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/catalogue?categorie=${material.category.slug}`} className="hover:text-ink">{material.category.name}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">{material.name}</li>
        </ol>
      </nav>

      <div className="-mt-6 grid gap-8 md:-mt-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        {/* 1. Galerie */}
        <div className="lg:col-start-1 lg:row-start-1">
          <Gallery images={material.images} name={material.name} categorySlug={material.category.slug} />
        </div>

        {/* 2. Réservation : sous la galerie sur mobile, colonne collante sur grand écran */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-muted">{material.category.name}</span>
              {material.level && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-glacier/15 px-2.5 py-0.5 text-xs font-semibold text-glacier">
                  <Gauge className="h-3.5 w-3.5" aria-hidden="true" /> {LEVEL_LABELS[material.level]}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{material.name}</h1>
            <p className="text-2xl font-bold">
              {formatPrice(material.dailyPriceCents)} <span className="text-base font-normal text-muted">/ jour</span>
            </p>
          </div>

          <form method="get" className="grid grid-cols-2 items-end gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="du">Du</Label>
              <Input id="du" name="du" type="date" min={today} defaultValue={du} required className="min-w-0 px-3" />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="au">Au</Label>
              <Input id="au" name="au" type="date" min={today} defaultValue={au} required className="min-w-0 px-3" />
            </div>
            <button type="submit" className={`${buttonVariants({ variant: "outline" })} col-span-2 sm:col-span-1`}>
              Vérifier
            </button>
          </form>

          {error && (
            <p role="alert" className="rounded-2xl border border-amber-300 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="font-semibold">
              {sizes ? `Disponibilité du ${formatDay(du!)} au ${formatDay(au!)}` : "Tailles proposées"}
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {shown.map((s) => (
                <li
                  key={s.variantId}
                  className={`flex flex-col rounded-xl border px-3 py-2 ${s.available > 0 ? "border-line bg-surface" : "border-line bg-snow text-muted"}`}
                >
                  <span className="font-semibold">{s.size}</span>
                  <span className="text-xs">
                    {sizes
                      ? s.available > 0
                        ? `${s.available} disponible${s.available > 1 ? "s" : ""}`
                        : "Complet sur ces dates"
                      : s.available > 0
                        ? `${s.available} en stock`
                        : "Indisponible"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {days && (
            <p className="rounded-2xl bg-night px-5 py-4 text-white dark:border dark:border-line">
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
              imageUrl: material.coverThumbUrl,
              dailyPriceCents: material.dailyPriceCents,
            }}
            sizes={sizes}
            period={sizes && du && au ? { startDate: du, endDate: au } : null}
          />

          <ul className="flex flex-col gap-2 text-sm text-muted">
            {reassurance.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </aside>

        {/* 3. Détails */}
        <div className="flex flex-col gap-8 lg:col-start-1 lg:row-start-2">
          {material.description && (
            <section className="flex flex-col gap-3" aria-labelledby="desc-title">
              <h2 id="desc-title" className="text-xl font-bold">Description</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted">{material.description}</p>
            </section>
          )}

          {material.features.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="features-title">
              <h2 id="features-title" className="text-xl font-bold">Points forts</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {material.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {guide && (
            <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5" aria-labelledby="guide-title">
              <h2 id="guide-title" className="text-lg font-bold">{guide.title}</h2>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
                {guide.tips.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
              <p className="text-xs text-muted">Repères indicatifs, à adapter à votre morphologie et à votre pratique.</p>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="flex flex-col gap-6" aria-labelledby="related-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="related-title" className="text-2xl font-extrabold tracking-tight">Dans la même catégorie</h2>
            <Link href={`/catalogue?categorie=${material.category.slug}`} className="text-sm font-semibold text-glacier hover:underline">
              Voir tout : {material.category.name}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((m) => (
              <MaterialCard key={m.id} material={m} sizes={null} days={null} query={periodQuery({ du, au })} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
