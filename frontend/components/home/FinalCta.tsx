import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mountains } from "./Mountains";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-brand-dark px-5 pb-24 pt-12 text-center text-white sm:px-10 md:pb-32">
      <Mountains id="mtn-cta" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-30 md:h-32" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-5">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Prêt pour la neige ?</h2>
        <p className="text-white/80">Choisissez vos dates et réservez votre matériel en quelques minutes.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/catalogue" className={cn(buttonVariants({ size: "lg" }), "bg-white text-night hover:bg-white/90")}>
            Voir le catalogue
          </Link>
          <Link href="/inscription" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "text-white hover:bg-white/10")}>
            Créer un compte
          </Link>
        </div>
      </div>
    </section>
  );
}
