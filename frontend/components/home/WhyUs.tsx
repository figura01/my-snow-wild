import { BadgeEuro, CalendarCheck, LockKeyhole, UserRound } from "lucide-react";

const reasons = [
  {
    icon: CalendarCheck,
    title: "Fini les mauvaises surprises",
    text: "Vous voyez le stock réel sur vos dates : si c'est affiché disponible, c'est pour vous.",
  },
  {
    icon: BadgeEuro,
    title: "Un prix clair",
    text: "Un tarif à la journée, le total de votre séjour calculé avant de payer. Aucun frais caché.",
  },
  {
    icon: LockKeyhole,
    title: "Paiement sécurisé",
    text: "Le paiement passe par Stripe : vos coordonnées bancaires ne transitent jamais par notre site.",
  },
  {
    icon: UserRound,
    title: "Tout dans votre compte",
    text: "Retrouvez vos réservations, leurs dates et leur statut à tout moment.",
  },
];

export function WhyUs() {
  return (
    <section className="rounded-[2rem] bg-night px-5 dark:border dark:border-line py-12 text-white sm:px-10 md:py-16" aria-labelledby="why-title">
      <div className="flex flex-col gap-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-sky-300">Pourquoi Snow Wild</span>
          <h2 id="why-title" className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Moins de temps au comptoir, plus de temps sur les pistes.
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-white/70">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
