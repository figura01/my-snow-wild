import { act } from "@testing-library/react";
import { MAX_QUANTITY, selectCount, useCart } from "@/lib/cart/store";

const ski = {
  variantId: "v-160",
  size: "160 cm",
  materialId: "m-1",
  slug: "ski-all-mountain",
  name: "Ski All Mountain",
  categorySlug: "skis",
  imageUrl: null,
  dailyPriceCents: 1500,
};
const casque = { ...ski, variantId: "v-m", size: "M", materialId: "m-2", slug: "casque", name: "Casque" };
const janvier = { startDate: "2027-01-10", endDate: "2027-01-12" };
const fevrier = { startDate: "2027-02-01", endDate: "2027-02-03" };

const state = () => useCart.getState();

beforeEach(() => {
  localStorage.clear();
  act(() => state().clear());
});

describe("panier (store Zustand)", () => {
  it("ajoute une ligne et retient la période", () => {
    act(() => {
      state().addLine(ski, 2, janvier);
    });
    expect(state().lines).toEqual([{ ...ski, quantity: 2 }]);
    expect(state().period).toEqual(janvier);
    expect(selectCount(state())).toBe(2);
  });

  it("cumule les quantités d'une même taille", () => {
    act(() => {
      state().addLine(ski, 1, janvier);
      state().addLine(ski, 2, janvier);
    });
    expect(state().lines).toHaveLength(1);
    expect(state().lines[0].quantity).toBe(3);
  });

  it(`plafonne la quantité entre 1 et ${MAX_QUANTITY}`, () => {
    act(() => {
      state().addLine(ski, 15, janvier);
      state().addLine(ski, 15, janvier);
    });
    expect(state().lines[0].quantity).toBe(MAX_QUANTITY);
    act(() => state().setQuantity(ski.variantId, 0));
    expect(state().lines[0].quantity).toBe(1);
  });

  it("signale le changement de période, qui s'applique à tout le panier", () => {
    let first = { periodChanged: true };
    let second = { periodChanged: false };
    act(() => {
      first = state().addLine(ski, 1, janvier);
      second = state().addLine(casque, 1, fevrier);
    });
    expect(first.periodChanged).toBe(false);
    expect(second.periodChanged).toBe(true);
    expect(state().period).toEqual(fevrier);
  });

  it("oublie la période quand la dernière ligne est retirée", () => {
    act(() => {
      state().addLine(ski, 1, janvier);
      state().addLine(casque, 1, janvier);
      state().removeLine(ski.variantId);
    });
    expect(state().period).toEqual(janvier);
    act(() => state().removeLine(casque.variantId));
    expect(state().lines).toEqual([]);
    expect(state().period).toBeNull();
  });

  it("sauvegarde le panier dans le localStorage", () => {
    act(() => {
      state().addLine(ski, 1, janvier);
    });
    const saved = JSON.parse(localStorage.getItem("snow-wild-cart")!);
    expect(saved.state.lines[0].variantId).toBe(ski.variantId);
    expect(saved.state.period).toEqual(janvier);
  });
});
