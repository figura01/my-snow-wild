"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const nav = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/materials", label: "Matériels" },
  { href: "/admin/import", label: "Import / export" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/reservations", label: "Réservations" },
  { href: "/admin/maintenance", label: "Maintenance" },
  { href: "/admin/users", label: "Utilisateurs" },
];

// Navigation du back-office : défilement horizontal sur mobile, colonne sur desktop.
// La page en cours est mise en évidence (et ramenée dans le champ visible sur mobile).
export function AdminNav() {
  const pathname = usePathname();
  const active = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    active.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:overflow-visible md:px-0">
      {nav.map((item) => {
        const current = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            ref={current ? active : undefined}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
              current ? "bg-white/15 font-semibold" : "text-white/80 hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
