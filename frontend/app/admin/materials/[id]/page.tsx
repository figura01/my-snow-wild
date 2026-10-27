import { notFound } from "next/navigation";
import { ImageManager } from "@/components/admin/ImageManager";
import { MaintenancePanel } from "@/components/admin/MaintenancePanel";
import { MaterialForm } from "@/components/admin/MaterialForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { MAINTENANCE_FIELDS, MATERIAL_FIELDS } from "@/lib/graphql/catalog";
import { serverGraphql } from "@/lib/server/graphql";
import type { Maintenance, Material } from "@/lib/types";

export const metadata = { title: "Modifier un matériel" };

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { adminMaterial, categories, adminMaintenances } = await serverGraphql<{
    adminMaterial: Material | null;
    categories: { id: string; name: string }[];
    adminMaintenances: Maintenance[];
  }>(
    `query($id: ID!) {
      adminMaterial(id: $id) { ${MATERIAL_FIELDS} }
      categories { id name }
      adminMaintenances(activeOnly: false, materialId: $id) { ${MAINTENANCE_FIELDS} }
    }`,
    { id },
  );
  if (!adminMaterial) notFound();

  return (
    <>
      <PageHeader title={`Modifier « ${adminMaterial.name} »`} back={{ href: "/admin/materials", label: "Matériels" }} />
      <div className="flex flex-col gap-6">
        <MaterialForm material={adminMaterial} categories={categories} />
        <ImageManager materialId={adminMaterial.id} materialName={adminMaterial.name} images={adminMaterial.images} />
        <MaintenancePanel variants={adminMaterial.variants} maintenances={adminMaintenances} />
      </div>
    </>
  );
}
