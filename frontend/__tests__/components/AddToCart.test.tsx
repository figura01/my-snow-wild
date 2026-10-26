import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddToCart } from "@/components/cart/AddToCart";
import { useCart } from "@/lib/cart/store";

const material = {
  materialId: "m-1",
  slug: "ski-all-mountain",
  name: "Ski All Mountain",
  categorySlug: "skis",
  imageUrl: null,
  dailyPriceCents: 1500,
};
const period = { startDate: "2027-01-10", endDate: "2027-01-12" };
const sizes = [
  { variantId: "v-150", size: "150 cm", available: 0 },
  { variantId: "v-160", size: "160 cm", available: 2 },
  { variantId: "v-170", size: "170 cm", available: 1 },
];

beforeEach(() => {
  localStorage.clear();
  act(() => useCart.getState().clear());
});

describe("AddToCart", () => {
  it("invite à choisir des dates tant qu'aucune période n'est saisie", () => {
    render(<AddToCart material={material} sizes={null} period={null} />);
    expect(screen.getByText(/choisissez vos dates/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ajouter au panier/i })).not.toBeInTheDocument();
  });

  it("prévient quand toutes les tailles sont réservées", () => {
    render(<AddToCart material={material} sizes={[sizes[0]]} period={period} />);
    expect(screen.getByText(/toutes les tailles sont réservées/i)).toBeInTheDocument();
  });

  it("ne propose que les tailles disponibles", () => {
    render(<AddToCart material={material} sizes={sizes} period={period} />);
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["160 cm (2 dispo.)", "170 cm (1 dispo.)"]);
  });

  it("ajoute la taille choisie au panier", async () => {
    const user = userEvent.setup();
    render(<AddToCart material={material} sizes={sizes} period={period} />);

    await user.selectOptions(screen.getByLabelText("Taille"), "v-170");
    await user.click(screen.getByRole("button", { name: /ajouter au panier/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Ajouté au panier.");
    expect(useCart.getState().lines).toEqual([
      expect.objectContaining({ variantId: "v-170", size: "170 cm", quantity: 1 }),
    ]);
    expect(useCart.getState().period).toEqual(period);
  });

  it("bloque l'ajout quand le panier contient déjà tout le stock disponible", async () => {
    const user = userEvent.setup();
    render(<AddToCart material={material} sizes={sizes} period={period} />);

    await user.selectOptions(screen.getByLabelText("Taille"), "v-170");
    await user.click(screen.getByRole("button", { name: /ajouter au panier/i }));

    expect(screen.getByText(/c'est le maximum disponible/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ajouter au panier/i })).toBeDisabled();
  });

  it("refuse une quantité supérieure à la disponibilité", async () => {
    const user = userEvent.setup();
    render(<AddToCart material={material} sizes={sizes} period={period} />);

    const quantity = screen.getByLabelText("Quantité");
    await user.clear(quantity);
    await user.type(quantity, "3");
    expect(screen.getByRole("button", { name: /ajouter au panier/i })).toBeDisabled();
  });
});
