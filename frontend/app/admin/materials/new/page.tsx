import { MaterialForm } from "@/components/admin/MaterialForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { serverGraphql } from "@/lib/server/graphql";

export const metadata = { title: "Nouveau matériel" };

export default async function NewMaterialPage() {
  const { categories } = await serverGraphql<{ categories: { id: string; name: string }[] }>(
    "{ categories { id name } }",
  );
  return (
    <>
      <PageHeader title="Nouveau matériel" back={{ href: "/admin/materials", label: "Matériels" }} />
      <MaterialForm categories={categories} />
    </>
  );
}
