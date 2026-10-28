"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDay } from "@/lib/catalog";
import { useCart } from "@/lib/cart/store";
import type { Quote } from "@/lib/cart/types";
import { useMounted } from "@/lib/cart/useMounted";
import { formatPrice } from "@/lib/format";
import { CREATE_RESERVATION, QUOTE_CART } from "@/lib/graphql/catalog";
import { isProfileComplete, UPDATE_PROFILE, type ProfileUser } from "@/components/account/ProfileForms";

type Props = {
  user: ProfileUser & { email: string };
};

const fields = [
  { name: "firstName", label: "Prénom", autoComplete: "given-name" },
  { name: "lastName", label: "Nom", autoComplete: "family-name" },
  { name: "email", label: "E-mail", autoComplete: "email", type: "email" },
  { name: "phone", label: "Téléphone", autoComplete: "tel", type: "tel" },
  { name: "address", label: "Adresse", autoComplete: "street-address", wide: true },
  { name: "postalCode", label: "Code postal", autoComplete: "postal-code", inputMode: "numeric", pattern: "\\d{5}" },
  { name: "city", label: "Ville", autoComplete: "address-level2" },
] as const;

export function CheckoutForm({ user }: Props) {
  const mounted = useMounted();
  // Coordonnées enregistrées et complètes : simple résumé, modifiable ; sinon le formulaire.
  const complete = isProfileComplete(user);
  const [editing, setEditing] = useState(!complete);
  const [saveProfile] = useMutation(UPDATE_PROFILE);
  const { lines, period } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const items = lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
  const ready = mounted && !!period && lines.length > 0;
  const { data } = useQuery<{ quoteCart: Quote }>(QUOTE_CART, {
    skip: !ready,
    fetchPolicy: "network-only",
    variables: ready ? { cart: { ...period, items } } : undefined,
  });
  const [createReservation, { loading }] = useMutation<{
    createReservation: { reservationId: string; paymentUrl: string };
  }>(CREATE_RESERVATION);
  const quote = data?.quoteCart;

  if (!mounted) return <p className="text-muted">Chargement…</p>;
  if (!period || lines.length === 0) {
    return (
      <p className="text-muted">
        Votre panier est vide.{" "}
        <Link href="/catalogue" className="font-semibold text-glacier hover:underline">Voir le catalogue</Link>
      </p>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const billing = Object.fromEntries(fields.map((f) => [f.name, String(form.get(f.name) ?? "")]));
    try {
      // Coordonnées saisies ici : enregistrées dans le profil si le client l'a demandé.
      if (editing && form.get("saveProfile") === "on") {
        const { firstName, lastName, phone, address, postalCode, city } = billing;
        await saveProfile({ variables: { data: { firstName, lastName, phone, address, postalCode, city } } });
      }
      const { data } = await createReservation({
        variables: { data: { startDate: period!.startDate, endDate: period!.endDate, items, billing } },
      });
      setRedirecting(true);
      // Page de paiement : Stripe (externe) ou paiement simulé en développement.
      window.location.href = data!.createReservation.paymentUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "La commande n'a pas pu être créée.");
    }
  }

  const defaults: Record<string, string> = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    address: user.address ?? "",
    postalCode: user.postalCode ?? "",
    city: user.city ?? "",
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Informations de facturation</h2>
          {complete && !editing && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          )}
        </div>

        {editing ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name} className={`flex flex-col gap-2 ${"wide" in f ? "sm:col-span-2" : ""}`}>
                  <Label htmlFor={f.name}>{f.label}</Label>
                  <Input
                    id={f.name}
                    name={f.name}
                    type={"type" in f ? f.type : "text"}
                    autoComplete={f.autoComplete}
                    inputMode={"inputMode" in f ? f.inputMode : undefined}
                    pattern={"pattern" in f ? f.pattern : undefined}
                    defaultValue={defaults[f.name]}
                    required
                  />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="saveProfile" defaultChecked={!complete} className="h-4 w-4" />
              Enregistrer ces coordonnées dans mon profil pour mes prochaines commandes
            </label>
          </>
        ) : (
          // Coordonnées du profil : résumé, envoyées avec la commande.
          <div className="rounded-2xl bg-snow px-4 py-3 text-sm leading-relaxed">
            {fields.map((f) => <input key={f.name} type="hidden" name={f.name} value={defaults[f.name]} />)}
            <p className="font-semibold">{defaults.firstName} {defaults.lastName}</p>
            <p className="text-muted">{defaults.email} · {defaults.phone}</p>
            <p className="text-muted">{defaults.address}, {defaults.postalCode} {defaults.city}</p>
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <Button type="submit" variant="accent" size="lg" disabled={!quote?.valid || loading || redirecting}>
          {redirecting ? "Redirection vers le paiement…" : loading ? "Réservation…" : "Réserver et payer"}
        </Button>
        <p className="text-xs text-muted">
          Le matériel est bloqué pour vous pendant 30 minutes, le temps de régler votre commande.
        </p>
      </form>

      <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-xl font-bold">Votre réservation</h2>
        <p className="text-sm text-muted">
          Du {formatDay(period.startDate)} au {formatDay(period.endDate)}
          {quote && ` · ${quote.days} jour${quote.days > 1 ? "s" : ""}`}
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {(quote?.lines ?? []).map((line) => (
            <li key={line.variantId} className="flex justify-between gap-3">
              <span>
                {line.quantity} × {line.materialName} <span className="text-muted">({line.size})</span>
                {!line.ok && <span className="block text-red-600 dark:text-red-400">{line.message}</span>}
              </span>
              <span className="whitespace-nowrap">{formatPrice(line.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-extrabold">
          <span>Total</span>
          <span>{quote ? (quote.valid ? formatPrice(quote.totalCents) : "—") : "…"}</span>
        </div>
        {quote && !quote.valid && (
          <Link href="/panier" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Corriger le panier
          </Link>
        )}
      </aside>
    </div>
  );
}
