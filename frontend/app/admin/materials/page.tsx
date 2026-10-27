import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { t } from "@/components/admin/table";
import { formatPrice } from "@/lib/format";
import { MATERIAL_FIELDS } from "@/lib/graphql/catalog";
import { serverGraphql } from "@/lib/server/graphql";
import type { Material } from "@/lib/types";

export const metadata = { title: "Matériels" };

export default async function MaterialsPage() {
  const { adminMaterials: materials } = await serverGraphql<{ adminMaterials: Material[] }>(
    `{ adminMaterials { ${MATERIAL_FIELDS} } }`,
  );

  return (
    <>
      <PageHeader title="Matériels" action={{ href: "/admin/materials/new", label: "Nouveau matériel" }} />
      <div className={t.wrap}>
        <table className={`${t.table} md:min-w-[720px]`}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Référence</th>
              <th className={t.th}>Catégorie</th>
              <th className={t.th}>Prix / jour</th>
              <th className={t.th}>Tailles (stock)</th>
              <th className={t.th}>Statut</th>
              <th className={`${t.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={t.tbody}>
            {materials.length === 0 && (
              <tr className="block md:table-row">
                <td colSpan={6} className={t.empty}>Aucun matériel pour l&apos;instant.</td>
              </tr>
            )}
            {materials.map((material) => (
              <tr key={material.id} className={t.tr}>
                <td className={t.title}>{material.name}</td>
                <td data-label="Catégorie" className={t.td}>{material.category.name}</td>
                <td data-label="Prix / jour" className={t.td}>{formatPrice(material.dailyPriceCents)}</td>
                <td data-label="Stock" className={t.td}>
                  <span>
                    <span className="font-semibold">{material.totalStock}</span>
                    <span className="block text-xs text-muted">
                      {material.variants.map((v) => `${v.size} : ${v.stock}`).join(" · ")}
                    </span>
                  </span>
                </td>
                <td data-label="Statut" className={t.td}>
                  <span
                    className={
                      material.isActive
                        ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800"
                        : "rounded-full bg-line px-2.5 py-1 text-xs font-medium text-muted"
                    }
                  >
                    {material.isActive ? "Visible" : "Masqué"}
                  </span>
                </td>
                <td className={t.actions}>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/materials/${material.id}`} className="text-sm font-semibold text-glacier hover:underline">
                      Modifier
                    </Link>
                    <DeleteButton kind="material" id={material.id} label={material.name} />
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
