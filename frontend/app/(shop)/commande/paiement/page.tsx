import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { buttonVariants } from "@/components/ui/button";
import { formatDay } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { GraphQLRequestError, serverGraphql } from "@/lib/server/graphql";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Paiement" };
export const dynamic = "force-dynamic";

type Data = {
  paymentConfig: { mode: string; publishableKey: string | null };
  reservationPayment: { reservationId: string; amountCents: number; expiresAt: string | null; clientSecret: string };
  reservation: {
    startDate: string;
    endDate: string;
    items: { id: string; quantity: number; variant: { size: string }; material: { name: string } }[];
  } | null;
};

export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = "" } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/commande/paiement?id=${id}`)}`);

  let data: Data | null = null;
  let error: string | null = null;
  try {
    data = await serverGraphql<Data>(
      `query($id: ID!) {
        paymentConfig { mode publishableKey }
        reservationPayment(id: $id) { reservationId amountCents expiresAt clientSecret }
        reservation(id: $id) { startDate endDate items { id quantity variant { size } material { name } } }
      }`,
      { id },
    );
  } catch (e) {
    if (!(e instanceof GraphQLRequestError)) throw e;
    if (e.message.includes("déjà payée")) redirect(`/commande/confirmation?id=${id}`);
    error = e.message;
  }

  if (!data || !data.paymentConfig.publishableKey) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-2xl font-bold">Paiement indisponible</h1>
        <p className="text-muted">{error ?? "Le paiement en ligne n'est pas configuré."}</p>
        <Link href="/panier" className={buttonVariants({ variant: "accent" })}>Retour au panier</Link>
      </div>
    );
  }

  const { reservationPayment: payment, reservation } = data;
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Paiement</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <PaymentForm
          publishableKey={data.paymentConfig.publishableKey}
          clientSecret={payment.clientSecret}
          reservationId={payment.reservationId}
          amountCents={payment.amountCents}
          expiresAt={payment.expiresAt}
        />
        {reservation && (
          <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold">Votre réservation</h2>
            <p className="text-sm text-muted">Du {formatDay(reservation.startDate)} au {formatDay(reservation.endDate)}</p>
            <ul className="flex flex-col gap-1 text-sm">
              {reservation.items.map((item) => (
                <li key={item.id}>
                  {item.quantity} × {item.material.name} <span className="text-muted">({item.variant.size})</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-line pt-3 text-lg font-extrabold">
              <span>Total</span>
              <span>{formatPrice(payment.amountCents)}</span>
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
