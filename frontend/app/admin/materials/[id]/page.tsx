import { notFound } from "next/navigation";
import { MaterialForm } from "@/components/admin/MaterialForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { MATERIAL_FIELDS } from "@/lib/graphql/catalog";
import { serverGraphql } from "@/lib/server/graphql";
import type { Material } from "@/lib/types";

export const metadata = { title: "Modifier un matériel" };

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { adminMaterial, categories } = await serverGraphql<{
    adminMaterial: Material | null;
    categories: { id: string; name: string }[];
  }>(`query($id: ID!) { adminMaterial(id: $id) { ${MATERIAL_FIELDS} } categories { id name } }`, { id });
  if (!adminMaterial) notFound();

  return (
    <>
      <PageHeader title={`Modifier « ${adminMaterial.name} »`} back={{ href: "/admin/materials", label: "Matériels" }} />
      <MaterialForm material={adminMaterial} categories={categories} />
    </>
  );
}
