import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartSync } from "@/lib/cart/CartSync";
import { getSessionUser } from "@/lib/server/session";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {/* Panier enregistré sur le compte du client connecté */}
      <CartSync userId={user?.id ?? null} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
