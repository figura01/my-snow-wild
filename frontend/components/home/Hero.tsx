import { CreditCard, ShieldCheck, Timer } from "lucide-react";
import { SearchForm } from "@/components/catalog/SearchForm";
import { Mountains } from "./Mountains";

const promises = [
  { icon: Timer, label: "Disponibilité en temps réel" },
  { icon: ShieldCheck, label: "Taille réservée pour vous" },
  { icon: CreditCard, label: "Paiement sécurisé" },
];

// Premier écran : accroche et recherche immédiatement accessibles.
export function Hero({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-100 via-sky-50 to-white px-5 pb-28 pt-10 sm:px-10 sm:pt-14 md:pb-40">
      <Mountains className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full md:h-56" />

      <div className="relative flex flex-col gap-6">
        <span className="w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-glacier shadow-sm">
          Saison 2026 – 2027 · location en ligne
        </span>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Votre matériel de ski, <span className="text-glacier">réservé en quelques clics.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Skis, snowboards, chaussures, casques : choisissez vos dates, on vous montre ce qui est libre, taille par taille.
        </p>

        <SearchForm categories={categories} />

        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          {promises.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-glacier" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
