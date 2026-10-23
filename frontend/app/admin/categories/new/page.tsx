import { CategoryForm } from "@/components/admin/CategoryForm";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata = { title: "Nouvelle catégorie" };

export default function NewCategoryPage() {
  return (
    <>
      <PageHeader title="Nouvelle catégorie" back={{ href: "/admin/categories", label: "Catégories" }} />
      <CategoryForm />
    </>
  );
}
