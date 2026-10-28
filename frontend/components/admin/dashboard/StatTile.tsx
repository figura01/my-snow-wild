import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Delta } from "./format";

type Props = {
  label: string;
  value: string;
  delta: Delta;
  /** Période de comparaison, ex. « vs 28 octobre 2025 ». */
  comparedTo: string;
  /** Précision sous la valeur (définition de l'indicateur). */
  hint?: string;
};

// Tuile d'indicateur : libellé, valeur, évolution signée (icône + texte, jamais la couleur seule).
export function StatTile({ label, value, delta, comparedTo, hint }: Props) {
  const Icon = delta.direction === "up" ? ArrowUpRight : delta.direction === "down" ? ArrowDownRight : Minus;
  const tone =
    delta.direction === "up" ? "text-[var(--viz-up)]" : delta.direction === "down" ? "text-[var(--viz-down)]" : "text-muted";
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-3xl font-bold tracking-tight">{value}</span>
      <span className="flex flex-wrap items-center gap-x-1.5 text-sm">
        <span className={`inline-flex items-center gap-0.5 font-semibold ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          {delta.text}
        </span>
        <span className="text-muted">{comparedTo}</span>
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}
