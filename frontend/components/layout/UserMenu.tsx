"use client";

import { CalendarDays, ChevronDown, LayoutDashboard, LogIn, LogOut, UserPlus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLogout } from "./LogoutButton";

export type MenuUser = { firstName: string; lastName: string; email: string; role: "ADMIN" | "USER" };

type Props = { user: MenuUser | null };

const itemClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold outline-none hover:bg-snow focus-visible:bg-snow";

function initials(user: MenuUser) {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

// Menu du compte (écrans ≥ 768 px), sur le modèle « menu button » de l'ARIA APG :
// Entrée / Espace / ↓ ouvrent sur le premier élément, ↑ sur le dernier,
// ↑ ↓ Début Fin naviguent, Échap referme et rend le focus au bouton.
export function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<"first" | "last" | null>(null);
  const menuId = useId();
  const pathname = usePathname();
  const { logout, loading } = useLogout();

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  const openMenu = (focus: "first" | "last") => {
    pendingFocus.current = focus;
    setOpen(true);
  };

  // Place le focus une fois le menu rendu.
  useEffect(() => {
    if (!open || !pendingFocus.current) return;
    const list = items();
    (pendingFocus.current === "first" ? list[0] : list[list.length - 1])?.focus();
    pendingFocus.current = null;
  }, [open]);

  // Referme après une navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Clic en dehors : referme sans voler le focus.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, close]);

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu("first");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu("last");
    }
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => list[(i + list.length) % list.length]?.focus();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(list.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  const link = (href: string, icon: ReactNode, label: string) => (
    <Link
      href={href}
      role="menuitem"
      tabIndex={-1}
      className={cn(itemClass, pathname === href && "text-brand")}
      aria-current={pathname === href ? "page" : undefined}
      onClick={() => close(false)}
    >
      {icon}
      {label}
    </Link>
  );

  const iconClass = "h-4 w-4 text-muted";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={user ? `Compte de ${user.firstName}` : "Compte : se connecter ou créer un compte"}
        onClick={() => (open ? close(false) : openMenu("first"))}
        onKeyDown={onButtonKey}
        className="flex h-10 items-center gap-1.5 rounded-full pl-1 pr-2 hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-brand"
      >
        {user ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">
            {initials(user)}
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface">
            <UserRound className="h-4 w-4" />
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Compte"
          onKeyDown={onMenuKey}
          className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-line bg-surface p-2 shadow-xl"
        >
          {user ? (
            <>
              <div className="px-3 pb-2 pt-1" role="presentation">
                <p className="truncate text-sm font-bold">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <div className="my-1 border-t border-line" role="separator" />
              {link("/compte", <CalendarDays className={iconClass} />, "Mes réservations")}
              {link("/compte/profil", <UserRound className={iconClass} />, "Mon profil")}
              {user.role === "ADMIN" && link("/admin", <LayoutDashboard className={iconClass} />, "Back-office")}
              <div className="my-1 border-t border-line" role="separator" />
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={loading}
                className={itemClass}
                onClick={async () => {
                  close(false);
                  await logout();
                }}
              >
                <LogOut className={iconClass} />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              {link("/login", <LogIn className={iconClass} />, "Connexion")}
              {link("/inscription", <UserPlus className={iconClass} />, "Créer un compte")}
            </>
          )}
        </div>
      )}
    </div>
  );
}
