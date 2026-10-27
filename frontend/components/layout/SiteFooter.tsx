import Link from "next/link";
import { Logo } from "./Logo";

const links = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/panier", label: "Panier" },
  { href: "/compte", label: "Mon compte" },
  { href: "/inscription", label: "Créer un compte" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Link href="/" aria-label="Snow Wild, accueil" className="w-fit">
            <Logo />
          </Link>
          <p className="text-sm text-muted">
            Location de matériel de ski et de snowboard, réservée en ligne avec la disponibilité en temps réel.
          </p>
        </div>
        <nav aria-label="Liens du pied de page" className="flex flex-col gap-2 text-sm">
          <span className="font-semibold">Navigation</span>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">
          © {new Date().getFullYear()} Snow Wild · Projet de démonstration : paiement en mode test, aucune commande réelle.
        </p>
      </div>
    </footer>
  );
}
