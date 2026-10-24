"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { selectCount, useCart } from "@/lib/cart/store";
import { useMounted } from "@/lib/cart/useMounted";

export function CartButton() {
  const mounted = useMounted();
  const count = useCart(selectCount);
  const shown = mounted ? count : 0;

  return (
    <Link
      href="/panier"
      className={buttonVariants({ variant: "ghost", size: "sm" })}
      aria-label={shown ? `Panier, ${shown} article${shown > 1 ? "s" : ""}` : "Panier"}
    >
      <span className="relative">
        <ShoppingCart className="h-5 w-5" />
        {shown > 0 && (
          <span className="absolute -right-2.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-glacier px-1 text-[11px] font-bold text-white">
            {shown}
          </span>
        )}
      </span>
    </Link>
  );
}
