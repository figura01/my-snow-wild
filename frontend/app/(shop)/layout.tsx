import { SiteHeader } from "@/components/layout/SiteHeader";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </>
  );
}
