import Link from "next/link";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
import { SearchForm } from "@/components/catalog/SearchForm";
import { serverGraphql } from "@/lib/server/graphql";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { categories } = await serverGraphql<{
    categories: { slug: string; name: string; materialCount: number }[];
  }>("{ categories { slug name materialCount } }");

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col gap-6 pt-8">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
          Votre matériel de ski,
          <br />
          <span className="text-glacier">réservé en quelques clics.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Skis, snowboards, chaussures, casques : choisissez vos dates, on vous montre ce qui est libre.
        </p>
        <SearchForm categories={categories} />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">Parcourir par catégorie</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/catalogue?categorie=${category.slug}`}
              className="flex flex-col items-center gap-3 rounded-3xl border border-line bg-white p-5 text-center transition hover:border-glacier"
            >
              <CategoryIcon slug={category.slug} className="h-9 w-9 text-glacier" />
              <span className="font-semibold">{category.name}</span>
              <span className="text-xs text-muted">{category.materialCount} référence(s)</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
