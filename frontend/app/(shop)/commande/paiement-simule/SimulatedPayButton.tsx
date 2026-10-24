"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CONFIRM_PAYMENT } from "@/lib/graphql/catalog";

export function SimulatedPayButton({ reservationId, disabled }: { reservationId: string; disabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirm, { loading }] = useMutation(CONFIRM_PAYMENT);

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="accent"
        size="lg"
        disabled={disabled || loading}
        onClick={async () => {
          setError(null);
          try {
            await confirm({ variables: { id: reservationId, sessionId: null } });
            router.push(`/commande/confirmation?id=${reservationId}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Paiement impossible.");
          }
        }}
      >
        {loading ? "Paiement…" : "Payer (simulation)"}
      </Button>
      {disabled && <p className="text-sm text-muted">Cette réservation ne peut plus être payée.</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
