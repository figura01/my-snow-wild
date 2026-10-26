import { AppDataSource } from "../../src/data-source";
import { Reservation } from "../../src/entities/Reservation";
import { createPendingReservation, markPaid } from "../../src/services/reservations";
import { billing, closeDb, createMaterial, createUser, inDays, openDb, resetDb, ReservationStatus } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

describe("createPendingReservation", () => {
  it("crée une réservation en attente avec un délai de paiement", async () => {
    const user = await createUser();
    const { variants } = await createMaterial({ "160 cm": 1 }, 2000);
    const reservation = await createPendingReservation(user.id, inDays(10), inDays(11), [
      { variantId: variants[0].id, quantity: 1 },
    ], billing);

    expect(reservation.status).toBe(ReservationStatus.PENDING);
    expect(reservation.totalCents).toBe(4000);
    expect(reservation.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 30 * 60_000);
    expect(reservation.items[0].dailyPriceCents).toBe(2000);
  });

  it("empêche la surréservation quand trois clients commandent le dernier exemplaire en même temps", async () => {
    const { variants } = await createMaterial({ "160 cm": 1 });
    const clients = await Promise.all([createUser(), createUser(), createUser()]);

    const results = await Promise.allSettled(
      clients.map((client) =>
        createPendingReservation(client.id, inDays(10), inDays(12), [{ variantId: variants[0].id, quantity: 1 }], billing),
      ),
    );

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(2);
    expect(await AppDataSource.getRepository(Reservation).count()).toBe(1);
  });

  it("libère le stock si le délai de paiement expire, puis permet une nouvelle commande", async () => {
    const [first, second] = [await createUser(), await createUser()];
    const { variants } = await createMaterial({ "160 cm": 1 });
    const item = [{ variantId: variants[0].id, quantity: 1 }];

    const pending = await createPendingReservation(first.id, inDays(10), inDays(10), item, billing);
    await expect(createPendingReservation(second.id, inDays(10), inDays(10), item, billing)).rejects.toThrow(
      "ne sont plus disponibles",
    );

    // Simule le dépassement du délai de paiement.
    await AppDataSource.getRepository(Reservation).update(pending.id, { expiresAt: new Date(Date.now() - 1000) });
    await expect(createPendingReservation(second.id, inDays(10), inDays(10), item, billing)).resolves.toBeDefined();
  });

  it("markPaid est idempotent et retire le délai d'expiration", async () => {
    const user = await createUser();
    const { variants } = await createMaterial({ "160 cm": 1 });
    const r = await createPendingReservation(user.id, inDays(10), inDays(10), [{ variantId: variants[0].id, quantity: 1 }], billing);
    await markPaid(r.id);
    await markPaid(r.id);
    const saved = await AppDataSource.getRepository(Reservation).findOneByOrFail({ id: r.id });
    expect(saved.status).toBe(ReservationStatus.PAID);
    expect(saved.expiresAt).toBeNull();
  });
});
