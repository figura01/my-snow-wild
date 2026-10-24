import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReservationSummary } from "@/components/checkout/ReservationSummary";
import { getReservation } from "@/lib/server/reservations";
import { getSessionUser } from "@/lib/server/session";
import { SimulatedPayButton } from "./SimulatedPayButton";

export const metadata: Metadata = { title: "Paiement (simulation)" };
export const dynamic = "force-dynamic";

// Page de paiement utilisée quand aucune clé Stripe n'est configurée.
export default async function SimulatedPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const id = String((await searchParams).id ?? "");
  if (!(await getSessionUser())) redirect("/login");
  const reservation = await getReservation(id);
  if (!reservation) notFound();
  if (reservation.status === "PAID") redirect(`/commande/confirmation?id=${reservation.id}`);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">Paiement</h1>
      <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Mode simulation : aucune clé Stripe n&apos;est configurée, aucun paiement réel n&apos;est effectué.
      </p>
      <ReservationSummary reservation={reservation} />
      <SimulatedPayButton reservationId={reservation.id} disabled={reservation.status !== "PENDING" || reservation.isExpired} />
    </div>
  );
}
