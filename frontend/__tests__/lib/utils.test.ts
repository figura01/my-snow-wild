import { formatPrice } from "@/lib/format";
import { statusOf } from "@/lib/reservations";
import { safeNext } from "@/lib/safeNext";

describe("safeNext (redirection après connexion)", () => {
  it.each(["/commande", "/materiel/ski?debut=2027-01-10"])("accepte le chemin interne %s", (path) => {
    expect(safeNext(path)).toBe(path);
  });
  it.each(["//evil.com", "https://evil.com", "javascript:alert(1)", "commande", "", null, 42])(
    "refuse %p et renvoie la page par défaut",
    (value) => {
      expect(safeNext(value, "/compte")).toBe("/compte");
    },
  );
});

describe("formatPrice", () => {
  it("affiche des centimes en euros, au format français", () => {
    // Intl insère des espaces insécables : on les normalise.
    expect(formatPrice(150000).replace(/\s/g, " ")).toBe("1 500,00 €");
    expect(formatPrice(350).replace(/\s/g, " ")).toBe("3,50 €");
  });
});

describe("statusOf", () => {
  it("distingue les quatre états d'une réservation", () => {
    expect(statusOf({ status: "PAID", isExpired: false }).label).toBe("Payée");
    expect(statusOf({ status: "CANCELLED", isExpired: false }).label).toBe("Annulée");
    expect(statusOf({ status: "PENDING", isExpired: true }).label).toBe("Expirée (non payée)");
    expect(statusOf({ status: "PENDING", isExpired: false }).label).toBe("En attente de paiement");
  });
});
