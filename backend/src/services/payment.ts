import Stripe from "stripe";
import { env } from "../config/env";
import type { Reservation } from "../entities/Reservation";
import { countDays } from "../utils/dates";

// Sans clé Stripe, l'application passe en paiement simulé (développement).
const stripe = env.stripe.secretKey ? new Stripe(env.stripe.secretKey) : null;

export const paymentMode: "stripe" | "simulated" = stripe ? "stripe" : "simulated";
export const stripeClient = stripe;

/**
 * Crée la page de paiement de la réservation et renvoie son URL.
 * Les montants envoyés à Stripe sont ceux de la réservation en base.
 */
export async function createPaymentSession(
  reservation: Reservation,
): Promise<{ url: string; sessionId: string | null }> {
  if (!stripe) {
    return { url: `${env.frontendUrl}/commande/paiement-simule?id=${reservation.id}`, sessionId: null };
  }

  const days = countDays(reservation.startDate, reservation.endDate);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: reservation.billingEmail,
    client_reference_id: reservation.id,
    metadata: { reservationId: reservation.id },
    line_items: reservation.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        unit_amount: item.dailyPriceCents * days,
        product_data: {
          name: `${item.material.name} — taille ${item.variant.size}`,
          description: `Location de ${days} jour${days > 1 ? "s" : ""}, du ${reservation.startDate} au ${reservation.endDate}`,
        },
      },
    })),
    success_url: `${env.frontendUrl}/commande/confirmation?id=${reservation.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.frontendUrl}/panier`,
    // La session Stripe expire (31 min, le minimum autorisé) avant la réservation
    // (35 min) : un paiement ne peut donc jamais aboutir sur du matériel libéré.
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
  });

  if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  return { url: session.url, sessionId: session.id };
}

/** Vérifie auprès de Stripe qu'une session est payée et correspond à la réservation. */
export async function isStripeSessionPaid(sessionId: string, reservationId: string): Promise<boolean> {
  if (!stripe) return false;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.payment_status === "paid" && session.metadata?.reservationId === reservationId;
}
