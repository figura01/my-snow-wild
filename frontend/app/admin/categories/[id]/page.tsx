import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { CATEGORY_FIELDS } from "@/lib/graphql/catalog";
import { serverGraphql } from "@/lib/server/graphql";
import type { Category } from "@/lib/types";

export const metadata = { title: "Modifier une catégorie" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { categories } = await serverGraphql<{ categories: Category[] }>(
    `{ categories { ${CATEGORY_FIELDS} } }`,
  );
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <>
      <PageHeader title={`Modifier « ${category.name} »`} back={{ href: "/admin/categories", label: "Catégories" }} />
      <CategoryForm category={category} />
    </>
  );
}
