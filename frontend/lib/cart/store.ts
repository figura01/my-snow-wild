"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const MAX_QUANTITY = 20;

// Une ligne = une taille d'un matériel. Les infos d'affichage (nom, prix…)
// sont un simple cache : le prix et la disponibilité font foi côté serveur.
export type CartLine = {
  variantId: string;
  size: string;
  quantity: number;
  materialId: string;
  slug: string;
  name: string;
  categorySlug: string;
  imageUrl: string | null;
  dailyPriceCents: number;
};

export type Period = { startDate: string; endDate: string };

type CartState = {
  period: Period | null;
  lines: CartLine[];
  /** Ajoute une taille au panier. Le panier n'a qu'une période : en changer s'applique à tout le panier. */
  addLine: (line: Omit<CartLine, "quantity">, quantity: number, period: Period) => { periodChanged: boolean };
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  setPeriod: (period: Period) => void;
  /** Remplace tout le panier (synchronisation avec le panier enregistré du compte). */
  replace: (period: Period | null, lines: CartLine[]) => void;
  clear: () => void;
};

const clamp = (n: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.round(n)));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      period: null,
      lines: [],

      addLine: (line, quantity, period) => {
        const current = get().period;
        const periodChanged =
          get().lines.length > 0 &&
          !!current &&
          (current.startDate !== period.startDate || current.endDate !== period.endDate);

        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          const lines = existing
            ? state.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, ...line, quantity: clamp(l.quantity + quantity) } : l,
              )
            : [...state.lines, { ...line, quantity: clamp(quantity) }];
          return { lines, period };
        });
        return { periodChanged };
      },

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: clamp(quantity) } : l)),
        })),

      removeLine: (variantId) =>
        set((state) => {
          const lines = state.lines.filter((l) => l.variantId !== variantId);
          return { lines, period: lines.length ? state.period : null };
        }),

      setPeriod: (period) => set({ period }),

      replace: (period, lines) => set({ period: lines.length ? period : null, lines }),

      clear: () => set({ lines: [], period: null }),
    }),
    {
      name: "snow-wild-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ period: state.period, lines: state.lines }),
    },
  ),
);

/** Nombre total d'articles (toutes lignes). */
export const selectCount = (state: CartState) => state.lines.reduce((sum, l) => sum + l.quantity, 0);
