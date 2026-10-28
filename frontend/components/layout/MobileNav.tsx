"use client";

import { CalendarDays, LayoutDashboard, LogIn, LogOut, Menu, UserPlus, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLogout } from "./LogoutButton";
import type { MenuUser } from "./UserMenu";

type Props = { user: MenuUser | null };

const itemClass = "flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left font-semibold hover:bg-snow";
const iconClass = "h-5 w-5 text-muted";

// Menu déroulant des petits écrans : remplace la navigation de l'en-tête sous 768 px.
export function MobileNav({ user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { logout, loading } = useLogout();

  // Referme le menu après chaque navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Échap referme le menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-line/60"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        // Voile cliquable : un clic en dehors du menu le referme.
        <div className="fixed inset-x-0 bottom-0 top-16 z-30 bg-night/40" aria-hidden onClick={() => setOpen(false)} />
      )}
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Menu"
          className="absolute inset-x-0 top-16 z-40 flex flex-col gap-1 border-b border-line bg-surface p-3 shadow-lg"
        >
          <Link href="/catalogue" className={itemClass}>Catalogue</Link>
          {user ? (
            <>
              <div className="mt-1 border-t border-line px-4 pb-1 pt-3">
                <p className="truncate text-sm font-bold">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <Link href="/compte" className={itemClass}>
                <CalendarDays className={iconClass} />
                Mes réservations
              </Link>
              <Link href="/compte/profil" className={itemClass}>
                <UserRound className={iconClass} />
                Mon profil
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className={itemClass}>
                  <LayoutDashboard className={iconClass} />
                  Back-office
                </Link>
              )}
              <button type="button" className={itemClass} disabled={loading} onClick={logout}>
                <LogOut className={iconClass} />
                Déconnexion
              </button>
            </>
          ) : (
            <div className="mt-1 border-t border-line pt-2">
              <Link href="/login" className={itemClass}>
                <LogIn className={iconClass} />
                Connexion
              </Link>
              <Link href="/inscription" className={itemClass}>
                <UserPlus className={iconClass} />
                Créer un compte
              </Link>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
