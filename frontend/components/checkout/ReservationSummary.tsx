import { StatusBadge } from "@/components/StatusBadge";
import { formatDay } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Reservation } from "@/lib/reservations";

export function ReservationSummary({ reservation }: { reservation: Reservation }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">
          Du {formatDay(reservation.startDate)} au {formatDay(reservation.endDate)}
        </p>
        <StatusBadge reservation={reservation} />
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {reservation.items.map((item) => (
          <li key={item.id}>
            {item.quantity} × {item.material.name} <span className="text-muted">(taille {item.variant.size})</span>
          </li>
        ))}
      </ul>
      <p className="border-t border-line pt-3 text-lg font-extrabold">Total : {formatPrice(reservation.totalCents)}</p>
    </div>
  );
}
