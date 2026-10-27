import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Material, SizeAvailability } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";

export function MaterialCard({
  material,
  sizes,
  days,
  query,
}: {
  material: Material;
  sizes: SizeAvailability[] | null;
  days: number | null;
  query: string;
}) {
  return (
    <Link
      href={`/materiel/${material.slug}${query}`}
      className="group flex overflow-hidden rounded-3xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-lg sm:flex-col"
    >
      <div className="flex w-28 shrink-0 items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 sm:aspect-[4/3] sm:w-auto">
        {material.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={material.imageUrl} alt={material.name} className="h-full w-full object-contain p-3 sm:p-6" />
        ) : (
          <CategoryIcon slug={material.category.slug} className="h-10 w-10 text-glacier/70 sm:h-16 sm:w-16" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:gap-3 sm:p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{material.category.name}</span>
        <h3 className="text-base font-bold group-hover:text-glacier sm:text-lg">{material.name}</h3>
        <ul className="flex flex-wrap gap-1.5" aria-label="Tailles">
          {(sizes ?? material.variants.map((v) => ({ variantId: v.id, size: v.size, available: v.stock }))).map(
            (s) => (
              <li
                key={s.variantId}
                className={
                  s.available > 0
                    ? "rounded-md border border-line px-2 py-0.5 text-xs"
                    : "rounded-md border border-line px-2 py-0.5 text-xs text-muted line-through"
                }
                title={sizes ? `${s.available} disponible(s) sur la période` : undefined}
              >
                {s.size}
              </li>
            ),
          )}
        </ul>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-1 sm:pt-2">
          <span>
            <span className="text-lg font-extrabold sm:text-xl">{formatPrice(material.dailyPriceCents)}</span>
            <span className="text-sm text-muted"> / jour</span>
          </span>
          {days && (
            <span className="text-sm font-semibold text-glacier">
              {formatPrice(material.dailyPriceCents * days)} les {days} j
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
