import { CalendarDays, Ruler, Snowflake } from "lucide-react";

const steps = [
  {
    icon: CalendarDays,
    title: "Choisissez vos dates",
    text: "Indiquez votre séjour : le catalogue n'affiche que le matériel disponible sur toute la période.",
  },
  {
    icon: Ruler,
    title: "Réservez votre taille",
    text: "Longueur de ski, pointure, taille de casque : la disponibilité est affichée taille par taille.",
  },
  {
    icon: Snowflake,
    title: "Profitez de la neige",
    text: "Payez en ligne, votre matériel est bloqué pour vous et vous retrouvez la réservation dans votre compte.",
  },
];

export function HowItWorks() {
  return (
    <section className="flex flex-col gap-8" aria-labelledby="how-title">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-glacier">Comment ça marche</span>
        <h2 id="how-title" className="text-3xl font-extrabold tracking-tight">Trois étapes, et c&apos;est réservé</h2>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex gap-4 rounded-3xl border border-line bg-surface p-5 md:flex-col md:p-6">
            <div className="flex items-start justify-between">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 dark:bg-glacier/15 text-glacier">
                <Icon className="h-6 w-6" aria-hidden="true" />
                {/* Numéro d'étape : pastille sur mobile, grand chiffre sur desktop. */}
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white md:hidden">
                  {index + 1}
                </span>
              </span>
              <span className="hidden text-4xl font-extrabold text-line md:block">0{index + 1}</span>
            </div>
            <div className="flex flex-col gap-1 md:gap-3">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm text-muted md:text-base">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
