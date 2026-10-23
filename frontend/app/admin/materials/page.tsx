import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
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
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-snow text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Prix / jour</th>
              <th className="px-4 py-3">Tailles (stock)</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">Aucun matériel pour l&apos;instant.</td>
              </tr>
            )}
            {materials.map((material) => (
              <tr key={material.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium">{material.name}</td>
                <td className="px-4 py-3">{material.category.name}</td>
                <td className="px-4 py-3">{formatPrice(material.dailyPriceCents)}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{material.totalStock}</span>
                  <span className="block text-xs text-muted">
                    {material.variants.map((v) => `${v.size} : ${v.stock}`).join(" · ")}
                  </span>
                </td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3">
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
