import Stripe from "stripe";
import { env } from "../config/env";
import type { Reservation } from "../entities/Reservation";

// Sans clés Stripe, l'application passe en paiement simulé (développement).
const stripe = env.stripe.secretKey && env.stripe.publishableKey ? new Stripe(env.stripe.secretKey) : null;

export const paymentMode: "stripe" | "simulated" = stripe ? "stripe" : "simulated";
export const stripeClient = stripe;

/**
 * Prépare le paiement intégré au site : un PaymentIntent Stripe du montant de la réservation
 * (calculé en base, jamais envoyé par le navigateur). Le navigateur reçoit seulement son
 * « client secret », qui permet d'afficher le formulaire de carte et de confirmer CE paiement.
 */
export async function createPaymentIntent(reservation: Reservation): Promise<{ id: string; clientSecret: string }> {
  if (!stripe) throw new Error("Paiement Stripe non configuré.");
  const intent = await stripe.paymentIntents.create(
    {
      amount: reservation.totalCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      receipt_email: reservation.billingEmail || undefined,
      description: `Réservation Snow Wild du ${reservation.startDate} au ${reservation.endDate}`,
      metadata: { reservationId: reservation.id },
    },
    // Rejouer la même demande (double clic, nouvel essai réseau) ne crée pas un second paiement.
    { idempotencyKey: `reservation-${reservation.id}` },
  );
  if (!intent.client_secret) throw new Error("Stripe n'a pas renvoyé de client secret.");
  return { id: intent.id, clientSecret: intent.client_secret };
}

export async function retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent | null> {
  return stripe ? stripe.paymentIntents.retrieve(id) : null;
}

/** Annule un paiement pas encore réalisé (réservation expirée) ; sans effet s'il est déjà terminé. */
export async function cancelPaymentIntent(id: string): Promise<void> {
  if (!stripe) return;
  try {
    await stripe.paymentIntents.cancel(id);
  } catch (error) {
    // Déjà payé ou déjà annulé : le webhook traitera le cas d'un paiement arrivé au dernier moment.
    console.warn("[paiement] annulation impossible", id, (error as Error).message);
  }
}

/** Rembourse intégralement un paiement (paiement arrivé trop tard sur du matériel plus disponible). */
export async function refundPaymentIntent(id: string): Promise<void> {
  if (!stripe) return;
  await stripe.refunds.create({ payment_intent: id }, { idempotencyKey: `refund-${id}` });
}

/** Vérifie auprès de Stripe qu'une ancienne session Checkout est payée (parcours précédent). */
export async function isStripeSessionPaid(sessionId: string, reservationId: string): Promise<boolean> {
  if (!stripe) return false;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.payment_status === "paid" && session.metadata?.reservationId === reservationId;
}
