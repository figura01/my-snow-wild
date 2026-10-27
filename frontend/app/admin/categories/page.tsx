import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { t } from "@/components/admin/table";
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
      <div className={t.wrap}>
        <table className={t.table}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Nom</th>
              <th className={t.th}>Slug</th>
              <th className={t.th}>Matériels</th>
              <th className={`${t.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={t.tbody}>
            {categories.length === 0 && (
              <tr className="block md:table-row">
                <td colSpan={4} className={t.empty}>Aucune catégorie pour l&apos;instant.</td>
              </tr>
            )}
            {categories.map((category) => (
              <tr key={category.id} className={t.tr}>
                <td className={t.title}>{category.name}</td>
                <td data-label="Slug" className={`${t.td} font-mono text-xs text-muted`}>{category.slug}</td>
                <td data-label="Matériels" className={t.td}>{category.materialCount}</td>
                <td className={t.actions}>
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
