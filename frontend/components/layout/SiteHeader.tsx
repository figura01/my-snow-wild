import Link from "next/link";
import { getSessionUser } from "@/lib/server/session";
import { buttonVariants } from "@/components/ui/button";
import { CartButton } from "@/components/cart/CartButton";
import { LogoutButton } from "./LogoutButton";
import { MobileNav } from "./MobileNav";

// Layout USER : l'en-tête s'adapte selon que le visiteur est connecté,
// et affiche l'accès au back-office uniquement pour un ADMIN.
// Sous 768 px, la navigation passe dans un menu déroulant ; le panier reste visible.
export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          SNOW<span className="text-glacier">WILD</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/catalogue" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Catalogue
          </Link>
          <CartButton />
          {user ? (
            <>
              <Link href="/compte" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Mon compte
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Back-office
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Connexion
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <CartButton />
          <MobileNav user={user ? { firstName: user.firstName, role: user.role } : null} />
        </div>
      </div>
    </header>
  );
}
