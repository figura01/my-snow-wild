import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { EndMaintenanceButton } from "@/components/admin/EndMaintenanceButton";
import { formatDate, isLate } from "@/components/admin/maintenance-utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { t } from "@/components/admin/table";
import { formatDay } from "@/lib/catalog";
import { MAINTENANCE_FIELDS } from "@/lib/graphql/catalog";
import { serverGraphql } from "@/lib/server/graphql";
import type { Maintenance } from "@/lib/types";

export const metadata = { title: "Maintenance" };

type Conflict = {
  materialName: string;
  size: string;
  reserved: number;
  inService: number;
  reservation: {
    id: string;
    startDate: string;
    endDate: string;
    billingFirstName: string;
    billingLastName: string;
    billingEmail: string;
    billingPhone: string;
  };
};

export default async function AdminMaintenancePage() {
  const { adminMaintenances, maintenanceConflicts } = await serverGraphql<{
    adminMaintenances: Maintenance[];
    maintenanceConflicts: Conflict[];
  }>(`{
    adminMaintenances(activeOnly: true) { ${MAINTENANCE_FIELDS} }
    maintenanceConflicts {
      materialName size reserved inService
      reservation { id startDate endDate billingFirstName billingLastName billingEmail billingPhone }
    }
  }`);

  return (
    <>
      <PageHeader title="Maintenance" />
      <div className="flex flex-col gap-6">
        {maintenanceConflicts.length > 0 && (
          <section role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
            <h2 className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              {maintenanceConflicts.length} réservation{maintenanceConflicts.length > 1 ? "s" : ""} à venir sans assez d&apos;exemplaires en service
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              {maintenanceConflicts.map((c) => (
                <li key={`${c.reservation.id}-${c.size}`} className="rounded-xl bg-white/70 px-3 py-2">
                  <span className="font-semibold">
                    {c.materialName} ({c.size})
                  </span>{" "}
                  : {c.reserved} réservé{c.reserved > 1 ? "s" : ""}, {c.inService} en service, du {formatDay(c.reservation.startDate)} au{" "}
                  {formatDay(c.reservation.endDate)}.
                  <span className="block break-all text-xs">
                    Client : {c.reservation.billingFirstName} {c.reservation.billingLastName} · {c.reservation.billingEmail} ·{" "}
                    {c.reservation.billingPhone}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-sm text-muted">
          Pour mettre du matériel en maintenance, ouvre sa fiche depuis{" "}
          <Link href="/admin/materials" className="font-semibold text-glacier hover:underline">Matériels</Link>.
        </p>

        <div className={t.wrap}>
          <table className={t.table}>
            <thead className={t.thead}>
              <tr>
                <th className={t.th}>Matériel</th>
                <th className={t.th}>Taille</th>
                <th className={t.th}>Quantité</th>
                <th className={t.th}>Motif</th>
                <th className={t.th}>Depuis</th>
                <th className={t.th}>Retour prévu</th>
                <th className={`${t.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className={t.tbody}>
              {adminMaintenances.length === 0 && (
                <tr className="block lg:table-row">
                  <td colSpan={7} className={t.empty}>Aucun matériel en maintenance.</td>
                </tr>
              )}
              {adminMaintenances.map((m) => (
                <tr key={m.id} className={t.tr}>
                  <td className={t.title}>
                    <Link href={`/admin/materials/${m.material.id}`} className="hover:text-glacier hover:underline">
                      {m.material.name}
                    </Link>
                  </td>
                  <td data-label="Taille" className={t.td}>{m.variant.size}</td>
                  <td data-label="Quantité" className={t.td}>{m.quantity}</td>
                  <td data-label="Motif" className={t.td}>{m.reason}</td>
                  <td data-label="Depuis" className={`${t.td} lg:whitespace-nowrap`}>{formatDate(m.startedAt)}</td>
                  <td data-label="Retour prévu" className={`${t.td} lg:whitespace-nowrap`}>
                    {m.expectedReturnDate ? (
                      <span className={isLate(m) ? "font-semibold text-red-600" : undefined}>
                        {formatDate(m.expectedReturnDate)}
                        {isLate(m) && " · en retard"}
                      </span>
                    ) : (
                      <span className="text-muted">Non précisé</span>
                    )}
                  </td>
                  <td className={t.actions}>
                    <EndMaintenanceButton id={m.id} label={`${m.material.name} ${m.variant.size}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
