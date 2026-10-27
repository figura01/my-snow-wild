import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";

type Category = { slug: string; name: string; materialCount: number };

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="flex flex-col gap-8" aria-labelledby="categories-title">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-glacier">Catalogue</span>
        <h2 id="categories-title" className="text-3xl font-extrabold tracking-tight">Parcourir par catégorie</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/catalogue?categorie=${category.slug}`}
            className="group flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-glacier hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-glacier/15 text-glacier transition group-hover:bg-brand group-hover:text-white">
              <CategoryIcon slug={category.slug} className="h-6 w-6" />
            </span>
            <span className="flex flex-col">
              <span className="font-bold">{category.name}</span>
              <span className="flex items-center gap-1 text-xs text-muted">
                {category.materialCount} référence{category.materialCount > 1 ? "s" : ""}
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
