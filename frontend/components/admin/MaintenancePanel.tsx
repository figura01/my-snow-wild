"use client";

import { useMutation } from "@apollo/client/react";
import { AlertTriangle, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDay } from "@/lib/catalog";
import { START_MAINTENANCE } from "@/lib/graphql/catalog";
import type { Maintenance, Variant } from "@/lib/types";
import { EndMaintenanceButton } from "./EndMaintenanceButton";
import { formatDate, isLate } from "./maintenance-utils";

type Conflict = {
  materialName: string;
  size: string;
  reserved: number;
  inService: number;
  reservation: { id: string; startDate: string; endDate: string; billingFirstName: string; billingLastName: string };
};

// Gestion de la maintenance d'un matériel, taille par taille (fiche matériel du back-office).
export function MaintenancePanel({ variants, maintenances }: { variants: Variant[]; maintenances: Maintenance[] }) {
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const active = maintenances.filter((m) => m.isActive);
  const history = maintenances.filter((m) => !m.isActive);

  return (
    <section className="flex max-w-2xl flex-col gap-5 rounded-3xl border border-line bg-white p-5 md:p-6" aria-labelledby="maintenance-title">
      <div className="flex flex-col gap-1">
        <h2 id="maintenance-title" className="flex items-center gap-2 text-xl font-bold">
          <Wrench className="h-5 w-5 text-glacier" aria-hidden="true" /> Maintenance
        </h2>
        <p className="text-sm text-muted">
          Les exemplaires en maintenance ne sont plus proposés à la location, quelles que soient les dates, jusqu&apos;à leur remise en service.
        </p>
      </div>

      {conflicts.length > 0 && (
        <div role="alert" className="flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Réservations à venir touchées par cette maintenance
          </p>
          <ul className="flex flex-col gap-1">
            {conflicts.map((c) => (
              <li key={`${c.reservation.id}-${c.size}`}>
                {c.reservation.billingFirstName} {c.reservation.billingLastName}, du {formatDay(c.reservation.startDate)} au{" "}
                {formatDay(c.reservation.endDate)} : {c.reserved} réservé{c.reserved > 1 ? "s" : ""} en {c.size}, {c.inService} en service.
              </li>
            ))}
          </ul>
          <p>Contacte les clients concernés ou remets du matériel en service à temps.</p>
        </div>
      )}

      <ul className="flex flex-col divide-y divide-line">
        {variants.map((variant) => (
          <li key={variant.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-semibold">{variant.size}</span>
                <span className="block text-sm text-muted">
                  {variant.inService} en service sur {variant.stock}
                  {variant.inMaintenance > 0 && (
                    <span className="font-medium text-amber-700"> · {variant.inMaintenance} en maintenance</span>
                  )}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={variant.inService === 0}
                aria-expanded={openFor === variant.id}
                onClick={() => setOpenFor(openFor === variant.id ? null : variant.id)}
              >
                Mettre en maintenance
              </Button>
            </div>
            {openFor === variant.id && (
              <StartForm
                variant={variant}
                onDone={(found) => {
                  setOpenFor(null);
                  setConflicts(found);
                }}
              />
            )}
          </li>
        ))}
      </ul>

      {active.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold">En cours</h3>
          <ul className="flex flex-col gap-2">
            {active.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                <div className="text-sm">
                  <span className="font-semibold">
                    {m.quantity} × {m.variant.size}
                  </span>{" "}
                  · {m.reason}
                  <span className="block text-xs text-muted">
                    Depuis le {formatDate(m.startedAt)}
                    {m.expectedReturnDate && ` · retour prévu le ${formatDate(m.expectedReturnDate)}`}
                    {isLate(m) && <span className="font-semibold text-red-600"> · en retard</span>}
                  </span>
                </div>
                <EndMaintenanceButton id={m.id} label={`${m.quantity} × ${m.variant.size}`} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold">Historique ({history.length})</summary>
          <ul className="mt-2 flex flex-col gap-1 text-muted">
            {history.map((m) => (
              <li key={m.id}>
                {m.quantity} × {m.variant.size} · {m.reason} · du {formatDate(m.startedAt)} au {formatDate(m.endedAt!)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function StartForm({ variant, onDone }: { variant: Variant; onDone: (conflicts: Conflict[]) => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [start, { loading }] = useMutation<{ startMaintenance: { conflicts: Conflict[] } }>(START_MAINTENANCE);
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const { data } = await start({
        variables: {
          data: {
            variantId: variant.id,
            quantity: Number(form.get("quantity")),
            reason: String(form.get("reason") ?? ""),
            expectedReturnDate: String(form.get("expectedReturnDate") ?? "") || null,
          },
        },
      });
      onDone(data?.startMaintenance.conflicts ?? []);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
  }

  const id = (name: string) => `${name}-${variant.id}`;
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-2xl bg-snow p-4 sm:grid-cols-[6rem_1fr_10rem]">
      {/* Mobile : quantité et date côte à côte, motif dessous. À partir de 640 px : une ligne. */}
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={id("quantity")}>Quantité</Label>
        <Input id={id("quantity")} name="quantity" type="number" min={1} max={variant.inService} defaultValue={1} required />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 sm:col-start-3 sm:row-start-1">
        <Label htmlFor={id("expectedReturnDate")}>Retour prévu</Label>
        <Input id={id("expectedReturnDate")} name="expectedReturnDate" type="date" min={today} className="min-w-0 px-3" />
      </div>
      <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <Label htmlFor={id("reason")}>Motif</Label>
        <Input id={id("reason")} name="reason" placeholder="Carre abîmée, fixation à régler…" minLength={2} maxLength={200} required />
      </div>
      {error && (
        <p role="alert" className="col-span-2 text-sm text-red-600 sm:col-span-3">{error}</p>
      )}
      <div className="col-span-2 flex justify-end sm:col-span-3">
        <Button type="submit" variant="accent" size="sm" disabled={loading}>
          {loading ? "Enregistrement…" : "Confirmer la maintenance"}
        </Button>
      </div>
    </form>
  );
}
