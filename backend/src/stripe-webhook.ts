import express, { type Router } from "express";
import type Stripe from "stripe";
import { env } from "./config/env";
import { stripeClient } from "./services/payment";
import { markCancelled, markPaid, settleSucceededPayment } from "./services/reservations";

/**
 * Notifications envoyées par Stripe. La signature est vérifiée avec
 * STRIPE_WEBHOOK_SECRET : sans elle, n'importe qui pourrait déclarer
 * une réservation « payée ». Le corps brut (raw) est nécessaire à la vérification.
 */
export function stripeWebhookRouter(): Router {
  const router = express.Router();

  router.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripeClient || !env.stripe.webhookSecret) {
      res.status(404).end();
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(
        req.body as Buffer,
        req.header("stripe-signature") ?? "",
        env.stripe.webhookSecret,
      );
    } catch {
      res.status(400).send("Signature invalide");
      return;
    }

    // Paiement intégré au site : le webhook est la source de vérité du paiement.
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const reservationId = intent.metadata?.reservationId;
      if (reservationId) {
        const outcome = await settleSucceededPayment(reservationId, intent);
        if (outcome === "refunded") console.warn("[paiement] paiement tardif remboursé", reservationId);
      }
    } else if (event.type === "payment_intent.payment_failed") {
      // Carte refusée : le client peut réessayer tant que le délai court ; rien à changer.
      const intent = event.data.object as Stripe.PaymentIntent;
      console.info("[paiement] échec", intent.metadata?.reservationId, intent.last_payment_error?.code);
    } else if (event.type === "checkout.session.completed" || event.type === "checkout.session.expired") {
      // Ancien parcours (page Stripe Checkout).
      const session = event.data.object as Stripe.Checkout.Session;
      const reservationId = session.metadata?.reservationId;
      if (reservationId && event.type === "checkout.session.completed" && session.payment_status === "paid") {
        await markPaid(reservationId);
      } else if (reservationId && event.type === "checkout.session.expired") {
        await markCancelled(reservationId);
      }
    }
    res.json({ received: true });
  });

  return router;
}
