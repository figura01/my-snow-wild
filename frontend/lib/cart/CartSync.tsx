"use client";

import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useEffect } from "react";
import { useCart, type CartLine, type Period } from "./store";

const CART_FIELDS = `
  startDate endDate
  items { quantity variant { id size } material { id slug name dailyPriceCents coverThumbUrl category { slug } } }
`;
const MY_CART = gql`query MyCart { myCart { ${CART_FIELDS} } }`;
const SAVE_CART = gql`mutation SaveCart($cart: CartInput!) { saveCart(cart: $cart) { id } }`;

type ServerCart = {
  startDate: string;
  endDate: string;
  items: {
    quantity: number;
    variant: { id: string; size: string };
    material: { id: string; slug: string; name: string; dailyPriceCents: number; coverThumbUrl: string | null; category: { slug: string } };
  }[];
};

const toLines = (cart: ServerCart): CartLine[] =>
  cart.items.map((item) => ({
    variantId: item.variant.id,
    size: item.variant.size,
    quantity: item.quantity,
    materialId: item.material.id,
    slug: item.material.slug,
    name: item.material.name,
    categorySlug: item.material.category.slug,
    imageUrl: item.material.coverThumbUrl,
    dailyPriceCents: item.material.dailyPriceCents,
  }));

// Empreinte de ce qui est enregistré côté serveur : période + tailles + quantités.
const fingerprint = (period: Period | null, lines: CartLine[]) =>
  JSON.stringify([period, lines.map((l) => [l.variantId, l.quantity]).sort()]);

const waitForHydration = () =>
  new Promise<void>((resolve) => {
    if (useCart.persist.hasHydrated()) resolve();
    else {
      const stop = useCart.persist.onFinishHydration(() => {
        stop();
        resolve();
      });
    }
  });

/**
 * Synchronise le panier du navigateur avec le panier enregistré du compte (client connecté) :
 * - à la connexion, les deux sont fusionnés (la période du navigateur l'emporte, les tailles s'additionnent) ;
 * - ensuite, chaque modification est enregistrée, regroupée sur une demi-seconde.
 * Sans compte, le panier reste dans le navigateur seulement.
 */
export function CartSync({ userId }: { userId: string | null }) {
  const client = useApolloClient();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let lastSaved = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    const save = async (period: Period | null, lines: CartLine[]) => {
      const print = fingerprint(period, lines);
      if (print === lastSaved) return;
      try {
        await client.mutate({
          mutation: SAVE_CART,
          variables: {
            cart: {
              startDate: period?.startDate ?? "",
              endDate: period?.endDate ?? "",
              items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
            },
          },
        });
        lastSaved = print;
      } catch {
        // Hors ligne ou session expirée : le panier reste dans le navigateur, nouvel essai à la prochaine modification.
      }
    };

    (async () => {
      await waitForHydration();
      const { data } = await client
        .query<{ myCart: ServerCart | null }>({ query: MY_CART, fetchPolicy: "network-only" })
        .catch(() => ({ data: undefined }));
      if (cancelled || !data) return;

      const local = useCart.getState();
      const server = data.myCart;
      let period = local.period;
      let lines = local.lines;
      if (server) {
        const serverLines = toLines(server);
        if (local.lines.length === 0) {
          period = { startDate: server.startDate, endDate: server.endDate };
          lines = serverLines;
        } else {
          const known = new Set(local.lines.map((l) => l.variantId));
          lines = [...local.lines, ...serverLines.filter((l) => !known.has(l.variantId))];
        }
        lastSaved = fingerprint({ startDate: server.startDate, endDate: server.endDate }, serverLines);
        local.replace(period, lines);
      }
      await save(period, lines);

      unsubscribe = useCart.subscribe((state) => {
        clearTimeout(timer);
        timer = setTimeout(() => save(state.period, state.lines), 500);
      });
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, [userId, client]);

  return null;
}
