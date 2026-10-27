import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Panier" };

export default function CartPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Panier</h1>
      <CartView />
    </div>
  );
}
