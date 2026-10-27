import { PageHeader } from "@/components/admin/PageHeader";
import { t } from "@/components/admin/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDay } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { RESERVATION_FIELDS, type Reservation } from "@/lib/reservations";
import { serverGraphql } from "@/lib/server/graphql";

export const metadata = { title: "Réservations" };

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminReservationsPage() {
  const { adminReservations: reservations } = await serverGraphql<{ adminReservations: Reservation[] }>(
    `{ adminReservations { ${RESERVATION_FIELDS} } }`,
  );

  return (
    <>
      <PageHeader title="Réservations" />
      <div className={t.wrap}>
        <table className={`${t.table} lg:min-w-[860px]`}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Client</th>
              <th className={t.th}>Passée le</th>
              <th className={t.th}>Période</th>
              <th className={t.th}>Matériel</th>
              <th className={t.th}>Total</th>
              <th className={t.th}>Statut</th>
            </tr>
          </thead>
          <tbody className={t.tbody}>
            {reservations.length === 0 && (
              <tr className="block lg:table-row">
                <td colSpan={6} className={t.empty}>Aucune réservation pour l&apos;instant.</td>
              </tr>
            )}
            {reservations.map((r) => (
              <tr key={r.id} className={`${t.tr} lg:align-top`}>
                <td className={t.title}>
                  <span>{r.billingFirstName} {r.billingLastName}</span>
                  <span className="block break-all text-xs font-normal text-muted">{r.billingEmail} · {r.billingPhone}</span>
                  <span className="block text-xs font-normal text-muted">{r.billingPostalCode} {r.billingCity}</span>
                </td>
                <td data-label="Passée le" className={`${t.td} lg:whitespace-nowrap`}>{dateTime.format(new Date(r.createdAt))}</td>
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
                <td data-label="Total" className={`${t.td} font-semibold`}>{formatPrice(r.totalCents)}</td>
                <td data-label="Statut" className={t.td}><StatusBadge reservation={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
