"use client";

import { useMutation } from "@apollo/client/react";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import { CONFIRM_PAYMENT } from "@/lib/graphql/catalog";

type Result = { confirmPayment: { id: string; status: string; totalCents: number } };

// Au retour du paiement, on demande à l'API de confirmer (elle vérifie auprès de
// Stripe). L'appel est idempotent : recharger la page ne pose pas de problème.
export function ConfirmationView({ reservationId, sessionId }: { reservationId: string; sessionId: string | null }) {
  const clear = useCart((s) => s.clear);
  const [confirm] = useMutation<Result>(CONFIRM_PAYMENT);
  const [state, setState] = useState<{ status: "loading" | "paid" | "error"; total?: number; message?: string }>({
    status: "loading",
  });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Certains paiements sont confirmés par Stripe quelques secondes plus tard : on réessaie un peu.
    const attempt = (remaining: number) =>
      confirm({ variables: { id: reservationId, sessionId } })
        .then(({ data }) => {
          if (data?.confirmPayment.status === "PAID") {
            clear();
            setState({ status: "paid", total: data.confirmPayment.totalCents });
          } else if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), 2000);
          } else {
            setState({ status: "error", message: "Le paiement n'est pas encore confirmé : actualisez la page dans un instant." });
          }
        })
        .catch((e: Error) => setState({ status: "error", message: e.message }));
    attempt(5);
  }, [confirm, reservationId, sessionId, clear]);

  if (state.status === "loading") return <p className="text-muted">Confirmation du paiement…</p>;

  if (state.status === "error") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-2xl font-bold">Paiement non confirmé</h1>
        <p className="text-muted">{state.message}</p>
        <Link href="/panier" className={buttonVariants({ variant: "outline" })}>Retour au panier</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-line bg-surface p-10 text-center">
      <CheckCircle2 className="h-14 w-14 text-green-600 dark:text-green-400" aria-hidden="true" />
      <h1 className="text-3xl font-extrabold">Réservation confirmée</h1>
      <p className="text-muted">
        Merci ! Votre paiement de {formatPrice(state.total ?? 0)} est bien enregistré. Votre matériel vous attend.
      </p>
      <Link href="/compte" className={buttonVariants({ variant: "accent" })}>Voir mes réservations</Link>
    </div>
  );
}
