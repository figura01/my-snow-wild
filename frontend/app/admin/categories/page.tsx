import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { CATEGORY_FIELDS } from "@/lib/graphql/catalog";
import { serverGraphql } from "@/lib/server/graphql";
import type { Category } from "@/lib/types";

export const metadata = { title: "Catégories" };

export default async function CategoriesPage() {
  const { categories } = await serverGraphql<{ categories: Category[] }>(
    `{ categories { ${CATEGORY_FIELDS} } }`,
  );

  return (
    <>
      <PageHeader title="Catégories" action={{ href: "/admin/categories/new", label: "Nouvelle catégorie" }} />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-snow text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Matériels</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">Aucune catégorie pour l&apos;instant.</td>
              </tr>
            )}
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium">{category.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{category.slug}</td>
                <td className="px-4 py-3">{category.materialCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/categories/${category.id}`} className="text-sm font-semibold text-glacier hover:underline">
                      Modifier
                    </Link>
                    <DeleteButton kind="category" id={category.id} label={category.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
