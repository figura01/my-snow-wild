"use client";

import { useState } from "react";
import { count, euros } from "./format";

export type RankedItem = { id: string; name: string; detail?: string; rentalDays: number; revenueCents: number };
type Metric = "revenue" | "days";

type Props = {
  items: RankedItem[];
  /** Nombre de lignes affichées (les suivantes sont regroupées dans « Autres »). */
  limit?: number;
  emptyText: string;
  label: string;
};

const value = (item: RankedItem, metric: Metric) => (metric === "revenue" ? item.revenueCents : item.rentalDays);
const format = (n: number, metric: Metric) => (metric === "revenue" ? euros(n) : `${count(n)} j`);

// Classement en barres horizontales, une seule série (une seule couleur), valeur au bout de la barre.
// Le sélecteur bascule entre chiffre d'affaires et jours loués (exemplaires × jours).
export function RankedBars({ items, limit, emptyText, label }: Props) {
  const [metric, setMetric] = useState<Metric>("revenue");

  const sorted = [...items].sort((a, b) => value(b, metric) - value(a, metric) || a.name.localeCompare(b.name, "fr"));
  const shown = limit ? sorted.slice(0, limit) : sorted;
  const rest = limit ? sorted.slice(limit) : [];
  const rows: RankedItem[] = rest.length
    ? [...shown, {
        id: "autres",
        name: `Autres (${rest.length})`,
        rentalDays: rest.reduce((s, i) => s + i.rentalDays, 0),
        revenueCents: rest.reduce((s, i) => s + i.revenueCents, 0),
      }]
    : shown;
  const max = Math.max(1, ...rows.map((r) => value(r, metric)));

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={`${label} : mesure`} className="inline-flex self-start rounded-full border border-line bg-snow p-0.5 text-xs font-semibold">
        {(["revenue", "days"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={metric === m}
            onClick={() => setMetric(m)}
            className={`rounded-full px-3 py-1 ${metric === m ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {m === "revenue" ? "Chiffre d'affaires" : "Jours loués"}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{emptyText}</p>
      ) : (
        <ol className="flex flex-col gap-3" aria-label={label}>
          {rows.map((item) => {
            const v = value(item, metric);
            const ratio = v / max;
            return (
              <li
                key={item.id}
                className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]"
                title={`${item.name} : ${euros(item.revenueCents)} · ${count(item.rentalDays)} jours loués`}
              >
                <span className="min-w-0">
                  <span className={`block truncate text-sm ${item.id === "autres" ? "text-muted" : "font-medium"}`}>{item.name}</span>
                  {item.detail && <span className="block truncate text-xs text-muted">{item.detail}</span>}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-3 shrink-0 rounded-r-[4px] ${item.id === "autres" ? "bg-[var(--viz-previous)]" : "bg-[var(--viz-current)]"}`}
                    style={{ width: `calc((100% - 5.5rem) * ${ratio})`, minWidth: v > 0 ? 2 : 0 }}
                    aria-hidden="true"
                  />
                  <span className="shrink-0 text-sm tabular-nums text-ink">{format(v, metric)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
