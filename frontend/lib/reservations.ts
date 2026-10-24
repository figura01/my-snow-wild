export const RESERVATION_FIELDS = `
  id startDate endDate status isExpired totalCents createdAt paidAt
  billingFirstName billingLastName billingEmail billingPhone billingAddress billingPostalCode billingCity
  user { email }
  items { id quantity dailyPriceCents variant { size } material { name slug } }
`;

export type Reservation = {
  id: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  isExpired: boolean;
  totalCents: number;
  createdAt: string;
  paidAt: string | null;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
  billingPostalCode: string;
  billingCity: string;
  user: { email: string } | null;
  items: { id: string; quantity: number; dailyPriceCents: number; variant: { size: string }; material: { name: string; slug: string } }[];
};

export function statusOf(r: Pick<Reservation, "status" | "isExpired">) {
  if (r.status === "PAID") return { label: "Payée", className: "bg-green-100 text-green-800" };
  if (r.status === "CANCELLED") return { label: "Annulée", className: "bg-line text-muted" };
  if (r.isExpired) return { label: "Expirée (non payée)", className: "bg-line text-muted" };
  return { label: "En attente de paiement", className: "bg-amber-100 text-amber-900" };
}
