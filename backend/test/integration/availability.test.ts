import { reservedQuantities } from "../../src/services/availability";
import { closeDb, createMaterial, createUser, inDays, insertReservation, openDb, resetDb, ReservationStatus } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

// Réservation existante du jour +10 au jour +12.
async function setup(status: ReservationStatus, expiresAt: Date | null = null) {
  const user = await createUser();
  const { material, variants } = await createMaterial({ "160 cm": 3 });
  await insertReservation({
    user, material, variant: variants[0], start: inDays(10), end: inDays(12), quantity: 2, status, expiresAt,
  });
  return variants[0].id;
}

describe("reservedQuantities", () => {
  it("compte une réservation payée sur la période", async () => {
    const id = await setup(ReservationStatus.PAID);
    expect((await reservedQuantities([id], inDays(11), inDays(11))).get(id)).toBe(2);
  });

  it.each([
    ["chevauche le début", 8, 10],
    ["chevauche la fin", 12, 15],
    ["englobe la réservation", 5, 20],
  ])("bloque une période qui %s", async (_label, start, end) => {
    const id = await setup(ReservationStatus.PAID);
    expect((await reservedQuantities([id], inDays(start), inDays(end))).get(id)).toBe(2);
  });

  it.each([
    ["se termine la veille", 5, 9],
    ["commence le lendemain", 13, 15],
  ])("ignore une période qui %s", async (_label, start, end) => {
    const id = await setup(ReservationStatus.PAID);
    expect((await reservedQuantities([id], inDays(start), inDays(end))).get(id)).toBeUndefined();
  });

  it("compte une réservation en attente dont le délai de paiement court encore", async () => {
    const id = await setup(ReservationStatus.PENDING, new Date(Date.now() + 10 * 60_000));
    expect((await reservedQuantities([id], inDays(10), inDays(12))).get(id)).toBe(2);
  });

  it("libère le matériel d'une réservation en attente expirée", async () => {
    const id = await setup(ReservationStatus.PENDING, new Date(Date.now() - 60_000));
    expect((await reservedQuantities([id], inDays(10), inDays(12))).get(id)).toBeUndefined();
  });

  it("ignore une réservation annulée", async () => {
    const id = await setup(ReservationStatus.CANCELLED);
    expect((await reservedQuantities([id], inDays(10), inDays(12))).get(id)).toBeUndefined();
  });
});
