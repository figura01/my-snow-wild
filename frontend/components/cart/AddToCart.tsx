"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MAX_QUANTITY, useCart, type CartLine } from "@/lib/cart/store";
import { useMounted } from "@/lib/cart/useMounted";
import type { SizeAvailability } from "@/lib/types";

type Props = {
  material: Omit<CartLine, "variantId" | "size" | "quantity">;
  sizes: SizeAvailability[] | null; // null tant qu'aucune période n'est choisie
  period: { startDate: string; endDate: string } | null;
};

export function AddToCart({ material, sizes, period }: Props) {
  const mounted = useMounted();
  const addLine = useCart((s) => s.addLine);
  const lines = useCart((s) => s.lines);
  const cartPeriod = useCart((s) => s.period);

  const choices = (sizes ?? []).filter((s) => s.available > 0);
  const [variantId, setVariantId] = useState(choices[0]?.variantId ?? "");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ periodChanged: boolean } | null>(null);

  if (!period || !sizes) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-4 text-sm text-muted">
        Choisissez vos dates ci-dessus pour vérifier la disponibilité et ajouter au panier.
      </p>
    );
  }
  if (choices.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-snow px-5 py-4 text-sm text-muted">
        Toutes les tailles sont réservées sur ces dates. Essayez une autre période.
      </p>
    );
  }

  const selected = choices.find((c) => c.variantId === variantId) ?? choices[0];
  // Quantité déjà dans le panier pour cette taille, si la période est la même.
  const samePeriod = cartPeriod?.startDate === period.startDate && cartPeriod?.endDate === period.endDate;
  const inCart = mounted && samePeriod ? lines.find((l) => l.variantId === selected.variantId)?.quantity ?? 0 : 0;
  const max = Math.max(0, Math.min(MAX_QUANTITY, selected.available) - inCart);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="variant">Taille</Label>
          <Select
            id="variant"
            value={selected.variantId}
            onChange={(e) => {
              setVariantId(e.target.value);
              setQuantity(1);
              setFeedback(null);
            }}
          >
            {choices.map((c) => (
              <option key={c.variantId} value={c.variantId}>
                {c.size} ({c.available} dispo.)
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Quantité</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={Math.max(1, max)}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
      </div>

      {inCart > 0 && (
        <p className="text-xs text-muted">
          Déjà {inCart} dans votre panier pour cette taille{max === 0 ? " : c'est le maximum disponible." : "."}
        </p>
      )}

      <Button
        type="button"
        variant="accent"
        size="lg"
        disabled={max === 0 || quantity < 1 || quantity > max}
        onClick={() => {
          const result = addLine(
            {
              ...material,
              variantId: selected.variantId,
              size: selected.size,
            },
            quantity,
            period,
          );
          setFeedback(result);
          setQuantity(1);
        }}
      >
        Ajouter au panier
      </Button>

      {feedback && (
        <div role="status" className="flex flex-col gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">
          <span className="flex items-center gap-2 font-semibold">
            <Check className="h-4 w-4" /> Ajouté au panier.
          </span>
          {feedback.periodChanged && (
            <span>Les dates du panier ont été remplacées par celles-ci : vérifiez les autres articles.</span>
          )}
          <Link href="/panier" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Voir le panier
          </Link>
        </div>
      )}
    </div>
  );
}
