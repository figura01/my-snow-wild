"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Lock, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

type Props = {
  publishableKey: string;
  clientSecret: string;
  reservationId: string;
  amountCents: number;
  expiresAt: string | null;
};

// Une seule instance de Stripe.js par clé, chargée à la demande.
const stripeByKey = new Map<string, Promise<Stripe | null>>();
const getStripe = (key: string) => {
  if (!stripeByKey.has(key)) stripeByKey.set(key, loadStripe(key, { locale: "fr" }));
  return stripeByKey.get(key)!;
};

/**
 * Formulaire de carte intégré au site (Stripe Payment Element). Les données de carte sont
 * saisies dans un cadre sécurisé de Stripe : elles ne passent jamais par Snow Wild.
 * Le paiement n'est validé qu'à la confirmation de Stripe (webhook), pas par ce formulaire.
 */
export function PaymentForm(props: Props) {
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const options = useMemo(
    () => ({
      clientSecret: props.clientSecret,
      appearance: {
        theme: dark ? ("night" as const) : ("stripe" as const),
        variables: { colorPrimary: "#1d63d6", borderRadius: "12px", fontFamily: "system-ui, sans-serif" },
      },
    }),
    [props.clientSecret, dark],
  );

  return (
    <Elements stripe={getStripe(props.publishableKey)} options={options}>
      <CardForm {...props} />
    </Elements>
  );
}

function useCountdown(expiresAt: string | null) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setLeft(Math.max(0, Date.parse(expiresAt) - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return left;
}

function CardForm({ reservationId, amountCents, expiresAt }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const left = useCountdown(expiresAt);
  const expired = left === 0;
  const confirmationUrl = `/commande/confirmation?id=${reservationId}`;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || expired) return;
    setSubmitting(true);
    setError(null);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      // Certains moyens de paiement (3-D Secure, virement…) redirigent puis reviennent ici.
      confirmParams: { return_url: `${window.location.origin}${confirmationUrl}` },
      redirect: "if_required",
    });
    if (stripeError) {
      setError(stripeError.message ?? "Le paiement a échoué.");
      setSubmitting(false);
      return;
    }
    router.push(confirmationUrl);
  }

  const minutes = left !== null ? Math.floor(left / 60_000) : null;
  const seconds = left !== null ? Math.floor((left % 60_000) / 1000) : null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Carte bancaire</h2>
        {left !== null && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              left < 5 * 60_000 ? "bg-amber-100 dark:bg-amber-400/15 text-amber-900 dark:text-amber-200" : "bg-snow text-muted"
            }`}
          >
            <Timer className="h-4 w-4" aria-hidden="true" />
            {expired ? "Délai dépassé" : `Matériel réservé encore ${minutes} min ${String(seconds).padStart(2, "0")} s`}
          </span>
        )}
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {expired && (
        <p role="alert" className="text-sm text-amber-900 dark:text-amber-200">
          Le délai de paiement est dépassé et le matériel a été libéré. Revenez au panier pour refaire la réservation.
        </p>
      )}

      <Button type="submit" variant="accent" size="lg" disabled={!stripe || !elements || submitting || expired}>
        <Lock className="h-4 w-4" aria-hidden="true" />
        {submitting ? "Paiement en cours…" : `Payer ${formatPrice(amountCents)}`}
      </Button>
      <p className="text-xs text-muted">
        Paiement sécurisé par Stripe. Site de démonstration en mode test : utilisez la carte 4242 4242 4242 4242, une date future et
        n&apos;importe quel code.
      </p>
    </form>
  );
}
