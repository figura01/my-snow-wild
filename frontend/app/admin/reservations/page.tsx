import { PageHeader } from "@/components/admin/PageHeader";
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
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-snow text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Passée le</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Période</th>
              <th className="px-4 py-3">Matériel</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">Aucune réservation pour l&apos;instant.</td>
              </tr>
            )}
            {reservations.map((r) => (
              <tr key={r.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{dateTime.format(new Date(r.createdAt))}</td>
                <td className="px-4 py-3">
                  <span className="font-medium">{r.billingFirstName} {r.billingLastName}</span>
                  <span className="block text-xs text-muted">{r.billingEmail} · {r.billingPhone}</span>
                  <span className="block text-xs text-muted">{r.billingPostalCode} {r.billingCity}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDay(r.startDate)} → {formatDay(r.endDate)}</td>
                <td className="px-4 py-3">
                  {r.items.map((item) => (
                    <span key={item.id} className="block">
                      {item.quantity} × {item.material.name} ({item.variant.size})
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3 font-semibold">{formatPrice(r.totalCents)}</td>
                <td className="px-4 py-3"><StatusBadge reservation={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
