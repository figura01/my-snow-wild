import { AppDataSource } from "../../src/data-source";
import { Material } from "../../src/entities/Material";
import { buildQuote } from "../../src/services/quote";
import { closeDb, createMaterial, createUser, inDays, insertReservation, openDb, resetDb, ReservationStatus } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

describe("buildQuote", () => {
  it("calcule le prix depuis la base : prix/jour × jours × quantité", async () => {
    const { variants } = await createMaterial({ "160 cm": 4 }, 1500);
    const quote = await buildQuote(inDays(10), inDays(12), [{ variantId: variants[0].id, quantity: 2 }]);
    expect(quote.days).toBe(3);
    expect(quote.lines[0]).toMatchObject({ ok: true, available: 4, lineTotalCents: 1500 * 3 * 2 });
    expect(quote.totalCents).toBe(9000);
    expect(quote.valid).toBe(true);
  });

  it("regroupe une même taille ajoutée deux fois", async () => {
    const { variants } = await createMaterial({ "160 cm": 4 });
    const id = variants[0].id;
    const quote = await buildQuote(inDays(10), inDays(10), [
      { variantId: id, quantity: 1 },
      { variantId: id, quantity: 2 },
    ]);
    expect(quote.lines).toHaveLength(1);
    expect(quote.lines[0].quantity).toBe(3);
  });

  it("signale une quantité supérieure au stock disponible sur les dates", async () => {
    const user = await createUser();
    const { material, variants } = await createMaterial({ "160 cm": 2 });
    await insertReservation({
      user, material, variant: variants[0], start: inDays(10), end: inDays(12), status: ReservationStatus.PAID,
    });
    const quote = await buildQuote(inDays(11), inDays(11), [{ variantId: variants[0].id, quantity: 2 }]);
    expect(quote.lines[0]).toMatchObject({ ok: false, available: 1, message: "Seulement 1 disponible sur ces dates." });
    expect(quote.totalCents).toBe(0);
    expect(quote.valid).toBe(false);
  });

  it("refuse un article retiré du catalogue", async () => {
    const { material, variants } = await createMaterial({ "160 cm": 2 });
    await AppDataSource.getRepository(Material).update(material.id, { isActive: false });
    const quote = await buildQuote(inDays(10), inDays(10), [{ variantId: variants[0].id, quantity: 1 }]);
    expect(quote.lines[0].ok).toBe(false);
    expect(quote.valid).toBe(false);
  });

  it("refuse une quantité invalide", async () => {
    const { variants } = await createMaterial({ "160 cm": 2 });
    await expect(buildQuote(inDays(10), inDays(10), [{ variantId: variants[0].id, quantity: 0 }])).rejects.toThrow(
      "Quantité invalide",
    );
  });

  it("refuse une période passée", async () => {
    await expect(buildQuote(inDays(-2), inDays(1), [])).rejects.toThrow("passée");
  });
});
