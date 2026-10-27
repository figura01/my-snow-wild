import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = {
  title: { default: "Back-office", template: "%s | Back-office Snow Wild" },
  robots: { index: false, follow: false },
};

// Les pages admin ne sont jamais mises en cache : la session est vérifiée à chaque visite.
export const dynamic = "force-dynamic";

// Layout ADMIN. Ce contrôle protège l'affichage des pages ; les données, elles,
// sont protégées par l'API (@Authorized("ADMIN") sur chaque resolver admin).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile : barre du haut avec navigation défilante. Desktop : colonne latérale. */}
      <aside className="flex flex-col gap-3 bg-ink px-4 pb-3 pt-4 text-white md:sticky md:top-0 md:h-screen md:w-64 md:gap-6 md:p-5">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="text-lg font-extrabold tracking-tight">
            SNOW<span className="text-sky-300">WILD</span>
            <span className="ml-2 rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium">admin</span>
          </Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white md:hidden">
            ← Site
          </Link>
        </div>
        <AdminNav />
        <Link href="/" className="mt-auto hidden text-sm text-white/60 hover:text-white md:block">
          ← Retour au site
        </Link>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-line bg-white px-4 md:h-16 md:px-6">
          <span className="truncate text-sm text-muted">{user.email}</span>
          <LogoutButton />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
