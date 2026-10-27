"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "./LogoutButton";

type Props = { user: { firstName: string; role: "ADMIN" | "USER" } | null };

const itemClass = "flex h-12 items-center rounded-xl px-4 font-semibold hover:bg-snow";

// Menu déroulant des petits écrans : remplace la navigation de l'en-tête sous 768 px.
export function MobileNav({ user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
          className="absolute inset-x-0 top-16 z-40 flex flex-col gap-1 border-b border-line bg-surface p-3 shadow-lg"
        >
          <Link href="/catalogue" className={itemClass}>Catalogue</Link>
          {user ? (
            <>
              <Link href="/compte" className={itemClass}>Mon compte</Link>
              {user.role === "ADMIN" && <Link href="/admin" className={itemClass}>Back-office</Link>}
              <div className="mt-1 flex items-center justify-between border-t border-line px-4 pt-3">
                <span className="text-sm text-muted">Connecté : {user.firstName}</span>
                <LogoutButton />
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className={itemClass}>Connexion</Link>
              <Link href="/inscription" className={itemClass}>Créer un compte</Link>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
