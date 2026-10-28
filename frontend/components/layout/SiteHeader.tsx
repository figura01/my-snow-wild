import Link from "next/link";
import { Logo } from "./Logo";
import { getSessionUser } from "@/lib/server/session";
import { buttonVariants } from "@/components/ui/button";
import { CartButton } from "@/components/cart/CartButton";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

// Layout USER : tout ce qui touche au compte (connexion, profil, réservations,
// back-office pour un ADMIN, déconnexion) est regroupé dans le menu utilisateur.
// Sous 768 px, la navigation passe dans un menu déroulant ; le panier reste visible.
export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" aria-label="Snow Wild, accueil">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Navigation principale">
          <Link href="/catalogue" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Catalogue
          </Link>
          <ThemeToggle />
          <CartButton />
          <UserMenu
            user={user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } : null}
          />
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <CartButton />
          <MobileNav
            user={user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } : null}
          />
        </div>
      </div>
    </header>
  );
}
