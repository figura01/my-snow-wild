import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { t } from "@/components/admin/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDay } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { RESERVATION_FIELDS, type Reservation, type ReservationStatus } from "@/lib/reservations";
import { serverGraphql } from "@/lib/server/graphql";

export const metadata = { title: "Réservations" };

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

// Onglets par statut ; « Paniers en cours » = paniers enregistrés de clients connectés, pas encore commandés.
const TABS: { key: string; label: string; statuses: ReservationStatus[] | null }[] = [
  { key: "toutes", label: "Toutes", statuses: null },
  { key: "payees", label: "Payées", statuses: ["PAID"] },
  { key: "en-attente", label: "En attente", statuses: ["PENDING"] },
  { key: "expirees", label: "Expirées / annulées", statuses: ["EXPIRED", "CANCELLED"] },
  { key: "paniers", label: "Paniers en cours", statuses: ["DRAFT"] },
];

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const tab = TABS.find((x) => x.key === statut) ?? TABS[0];
  const { adminReservations: reservations } = await serverGraphql<{ adminReservations: Reservation[] }>(
    `query($statuses: [ReservationStatus!]) { adminReservations(statuses: $statuses) { ${RESERVATION_FIELDS} } }`,
    { statuses: tab.statuses },
  );
  const drafts = tab.key === "paniers";

  return (
    <>
      <PageHeader title="Réservations" />
      <nav aria-label="Filtrer par statut" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {TABS.map((x) => (
          <Link
            key={x.key}
            href={x.key === "toutes" ? "/admin/reservations" : `/admin/reservations?statut=${x.key}`}
            aria-current={x.key === tab.key ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
              x.key === tab.key ? "border-glacier bg-sky-50 dark:bg-glacier/15 font-semibold text-glacier" : "border-line bg-surface hover:border-glacier"
            }`}
          >
            {x.label}
          </Link>
        ))}
      </nav>
      <div className={t.wrap}>
        <table className={`${t.table} lg:min-w-[860px]`}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Client</th>
              <th className={t.th}>{drafts ? "Modifié le" : "Passée le"}</th>
              <th className={t.th}>Période</th>
              <th className={t.th}>Matériel</th>
              <th className={t.th}>Total</th>
              <th className={t.th}>Statut</th>
            </tr>
          </thead>
          <tbody className={t.tbody}>
            {reservations.length === 0 && (
              <tr className="block lg:table-row">
                <td colSpan={6} className={t.empty}>{drafts ? "Aucun panier en cours." : "Aucune réservation dans cette catégorie."}</td>
              </tr>
            )}
            {reservations.map((r) => (
              <tr key={r.id} className={`${t.tr} lg:align-top`}>
                <td className={t.title}>
                  {r.status === "DRAFT" ? (
                    // Panier : pas encore de coordonnées de facturation, seulement le compte.
                    <span className="break-all">{r.user?.email ?? "Compte supprimé"}</span>
                  ) : (
                    <>
                      <span>{r.billingFirstName} {r.billingLastName}</span>
                      <span className="block break-all text-xs font-normal text-muted">{r.billingEmail} · {r.billingPhone}</span>
                      <span className="block text-xs font-normal text-muted">{r.billingPostalCode} {r.billingCity}</span>
                    </>
                  )}
                </td>
                <td data-label={drafts ? "Modifié le" : "Passée le"} className={`${t.td} lg:whitespace-nowrap`}>
                  {dateTime.format(new Date(r.status === "DRAFT" ? r.updatedAt : r.createdAt))}
                </td>
                <td data-label="Période" className={`${t.td} lg:whitespace-nowrap`}>{formatDay(r.startDate)} → {formatDay(r.endDate)}</td>
                <td data-label="Matériel" className={t.td}>
                  <span>
                    {r.items.map((item) => (
                      <span key={item.id} className="block">
                        {item.quantity} × {item.material.name} ({item.variant.size})
                      </span>
                    ))}
                  </span>
                </td>
                <td data-label="Total" className={`${t.td} font-semibold`}>{r.status === "DRAFT" ? "—" : formatPrice(r.totalCents)}</td>
                <td data-label="Statut" className={t.td}><StatusBadge reservation={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
