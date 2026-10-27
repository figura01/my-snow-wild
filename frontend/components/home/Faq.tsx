import { ChevronDown } from "lucide-react";

const questions = [
  {
    q: "Comment savoir si une taille est disponible ?",
    a: "Indiquez vos dates dans la recherche : chaque matériel affiche le nombre d'exemplaires libres, taille par taille, sur toute votre période.",
  },
  {
    q: "Combien de temps le matériel m'est-il réservé avant le paiement ?",
    a: "Dès que vous validez votre commande, le matériel est bloqué pour vous pendant 30 minutes, le temps de régler. Passé ce délai sans paiement, il redevient disponible.",
  },
  {
    q: "Puis-je modifier mes dates après avoir rempli mon panier ?",
    a: "Oui : depuis le panier, « Modifier les dates » recalcule la disponibilité et le prix de chaque article pour la nouvelle période.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Le paiement se fait en ligne par carte bancaire, via Stripe. Sur ce site de démonstration, le paiement est en mode test : aucune somme n'est prélevée.",
  },
  {
    q: "Faut-il créer un compte ?",
    a: "Un compte est demandé au moment de commander : il vous permet de retrouver vos réservations et leur statut à tout moment.",
  },
];

// Questions dépliables, sans JavaScript (éléments <details>).
export function Faq() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_2fr]" aria-labelledby="faq-title">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-glacier">Questions fréquentes</span>
        <h2 id="faq-title" className="text-3xl font-extrabold tracking-tight">Bon à savoir</h2>
      </div>
      <div className="flex flex-col gap-3">
        {questions.map(({ q, a }) => (
          <details key={q} className="group rounded-2xl border border-line bg-surface px-5 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown className="h-5 w-5 shrink-0 text-muted transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="pb-5 text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
