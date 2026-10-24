import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Panier" };

export default function CartPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-extrabold tracking-tight">Panier</h1>
      <CartView />
    </div>
  );
}
