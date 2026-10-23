import Link from "next/link";
import { getSessionUser } from "@/lib/server/session";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "./LogoutButton";

// Layout USER : l'en-tête s'adapte selon que le visiteur est connecté,
// et affiche l'accès au back-office uniquement pour un ADMIN.
export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          SNOW<span className="text-glacier">WILD</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/catalogue" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Catalogue
          </Link>
          {user ? (
            <>
              <span className="hidden text-sm text-muted sm:inline">
                Bonjour {user.firstName}
              </span>
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
      </div>
    </header>
  );
}
