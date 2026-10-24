"use client";

import { useQuery } from "@apollo/client/react";
import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDay, todayIso } from "@/lib/catalog";
import { MAX_QUANTITY, useCart } from "@/lib/cart/store";
import type { Quote } from "@/lib/cart/types";
import { useMounted } from "@/lib/cart/useMounted";
import { formatPrice } from "@/lib/format";
import { QUOTE_CART } from "@/lib/graphql/catalog";

export function CartView() {
  const mounted = useMounted();
  const { lines, period, setQuantity, removeLine, setPeriod, clear } = useCart();
  const [editingDates, setEditingDates] = useState(false);

  const ready = mounted && !!period && lines.length > 0;
  const { data, previousData, loading, error } = useQuery<{ quoteCart: Quote }>(QUOTE_CART, {
    skip: !ready,
    fetchPolicy: "network-only",
    variables: ready
      ? {
          cart: {
            startDate: period.startDate,
            endDate: period.endDate,
            items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
          },
        }
      : undefined,
  });
  const quote = (data ?? previousData)?.quoteCart;
  const quoteLine = (variantId: string) => quote?.lines.find((l) => l.variantId === variantId);

  if (!mounted) return <p className="text-muted">Chargement du panier…</p>;

  if (lines.length === 0 || !period) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-line bg-white p-10">
        <p className="text-lg font-semibold">Votre panier est vide.</p>
        <Link href="/catalogue" className={buttonVariants({ variant: "accent" })}>
          Parcourir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-4">
        {/* Période */}
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
          {editingDates ? (
            <form
              className="grid grid-cols-[1fr_1fr_auto] items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                setPeriod({ startDate: String(form.get("du")), endDate: String(form.get("au")) });
                setEditingDates(false);
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="du">Du</Label>
                <Input id="du" name="du" type="date" min={todayIso()} defaultValue={period.startDate} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="au">Au</Label>
                <Input id="au" name="au" type="date" min={todayIso()} defaultValue={period.endDate} required />
              </div>
              <Button type="submit" variant="outline">Valider</Button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Location du <strong>{formatDay(period.startDate)}</strong> au <strong>{formatDay(period.endDate)}</strong>
                {quote && ` · ${quote.days} jour${quote.days > 1 ? "s" : ""}`}
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingDates(true)}>
                Modifier les dates
              </Button>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error.message}
          </p>
        )}

        {/* Lignes */}
        <ul className="flex flex-col gap-3">
          {lines.map((line) => {
            const q = quoteLine(line.variantId);
            return (
              <li key={line.variantId} className="flex gap-4 rounded-2xl border border-line bg-white p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-snow">
                  <CategoryIcon slug={line.categorySlug} className="h-8 w-8 text-glacier/70" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={`/materiel/${line.slug}`} className="font-semibold hover:text-glacier">
                        {line.name}
                      </Link>
                      <p className="text-sm text-muted">
                        Taille {line.size} · {formatPrice(q?.dailyPriceCents ?? line.dailyPriceCents)} / jour
                      </p>
                    </div>
                    <span className="font-bold">{q ? formatPrice(q.lineTotalCents) : "…"}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1" role="group" aria-label={`Quantité de ${line.name} taille ${line.size}`}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label="Diminuer la quantité"
                        disabled={line.quantity <= 1}
                        onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold" aria-live="polite">{line.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label="Augmenter la quantité"
                        disabled={line.quantity >= Math.min(MAX_QUANTITY, q?.available ?? MAX_QUANTITY)}
                        onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => removeLine(line.variantId)}>
                      <Trash2 className="h-4 w-4" /> Retirer
                    </Button>
                  </div>
                  {q && !q.ok && (
                    <p role="alert" className="text-sm font-medium text-red-600">{q.message}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div>
          <Button type="button" variant="ghost" size="sm" onClick={() => clear()}>
            Vider le panier
          </Button>
        </div>
      </div>

      {/* Récapitulatif : montants calculés par le serveur */}
      <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-line bg-white p-6 lg:sticky lg:top-6">
        <h2 className="text-xl font-bold">Récapitulatif</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Articles</dt>
            <dd>{lines.reduce((s, l) => s + l.quantity, 0)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Durée</dt>
            <dd>{quote ? `${quote.days} jour${quote.days > 1 ? "s" : ""}` : "…"}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-extrabold">
            <dt>Total</dt>
            <dd>{quote ? (quote.valid ? formatPrice(quote.totalCents) : "—") : "…"}</dd>
          </div>
        </dl>
        {quote && !quote.valid && (
          <p className="text-sm text-red-600">Corrigez les articles signalés pour continuer.</p>
        )}
        {quote?.valid && !loading ? (
          <Link href="/commande" className={buttonVariants({ variant: "accent", size: "lg" })}>
            Passer la commande
          </Link>
        ) : (
          <Button type="button" variant="accent" size="lg" disabled>
            Passer la commande
          </Button>
        )}
      </aside>
    </div>
  );
}
