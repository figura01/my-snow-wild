import { statusOf, type Reservation } from "@/lib/reservations";

export function StatusBadge({ reservation }: { reservation: Pick<Reservation, "status" | "isExpired"> }) {
  const { label, className } = statusOf(reservation);
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>;
}
