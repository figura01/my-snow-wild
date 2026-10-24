import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = {
  title: { default: "Back-office", template: "%s | Back-office Snow Wild" },
  robots: { index: false, follow: false },
};

// Les pages admin ne sont jamais mises en cache : la session est vérifiée à chaque visite.
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/materials", label: "Matériels" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/reservations", label: "Réservations" },
  { href: "/admin/users", label: "Utilisateurs" },
];

// Layout ADMIN. Ce contrôle protège l'affichage des pages ; les données, elles,
// sont protégées par l'API (@Authorized("ADMIN") sur chaque resolver admin).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-line bg-ink p-5 text-white md:w-64 md:border-b-0 md:border-r">
        <Link href="/admin" className="text-lg font-extrabold tracking-tight">
          SNOW<span className="text-sky-300">WILD</span>
          <span className="ml-2 rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium">admin</span>
        </Link>
        <nav className="flex flex-wrap gap-1 md:flex-col">
          {nav.map((item) =>
            item.soon ? (
              <span key={item.href} className="rounded-lg px-3 py-2 text-sm text-white/40">
                {item.label}
              </span>
            ) : (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm hover:bg-white/10">
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <Link href="/" className="mt-auto text-sm text-white/60 hover:text-white">
          ← Retour au site
        </Link>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-6">
          <span className="text-sm text-muted">{user.email}</span>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
