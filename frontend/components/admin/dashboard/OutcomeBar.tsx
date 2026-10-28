import { CheckCircle2, Clock, TimerOff, XCircle } from "lucide-react";
import { count, percent } from "./format";

type Outcomes = { paid: number; pending: number; expired: number; cancelled: number };

// Couleurs d'état (réservées à ce sens), toujours accompagnées d'une icône et d'un libellé.
const PARTS = [
  { key: "paid", label: "Payées", color: "var(--viz-good)", Icon: CheckCircle2 },
  { key: "pending", label: "En attente de paiement", color: "var(--viz-warning)", Icon: Clock },
  { key: "expired", label: "Expirées (non payées)", color: "var(--viz-serious)", Icon: TimerOff },
  { key: "cancelled", label: "Annulées", color: "var(--viz-critical)", Icon: XCircle },
] as const;

// Devenir des commandes passées sur la période : barre 100 % + détail chiffré.
export function OutcomeBar({ outcomes }: { outcomes: Outcomes }) {
  const total = PARTS.reduce((sum, p) => sum + outcomes[p.key], 0);
  if (total === 0) return <p className="py-6 text-center text-sm text-muted">Aucune commande sur cette période.</p>;

  return (
    <div className="flex flex-col gap-4">
      <p>
        <span className="text-3xl font-bold tracking-tight">{percent(outcomes.paid / total)}</span>{" "}
        <span className="text-sm text-muted">des {count(total)} commandes ont été payées</span>
      </p>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]" aria-hidden="true">
        {PARTS.filter((p) => outcomes[p.key] > 0).map((p) => (
          <span key={p.key} className="h-full" style={{ flexGrow: outcomes[p.key], flexBasis: 0, background: p.color }} />
        ))}
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {PARTS.map(({ key, label, color, Icon }) => (
          <li key={key} className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0" style={{ color }} aria-hidden="true" />
            <span className="text-muted">{label}</span>
            <span className="ml-auto tabular-nums font-semibold">{count(outcomes[key])}</span>
            <span className="w-14 text-right tabular-nums text-muted">{percent(outcomes[key] / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
