import { AppDataSource } from "../../src/data-source";
import { Reservation } from "../../src/entities/Reservation";
import { createPendingReservation, settleSucceededPayment } from "../../src/services/reservations";
import { billing, closeDb, createMaterial, createUser, inDays, openDb, resetDb, ReservationStatus } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

const repo = () => AppDataSource.getRepository(Reservation);

/** Réservation en attente, rattachée à un PaymentIntent fictif. */
async function pending(stock = 1) {
  const user = await createUser();
  const { variants } = await createMaterial({ M: stock });
  const r = await createPendingReservation(user.id, inDays(10), inDays(10), [{ variantId: variants[0].id, quantity: 1 }], billing);
  await repo().update(r.id, { stripePaymentIntentId: `pi_${r.id}` });
  return { reservation: (await repo().findOneByOrFail({ id: r.id }))!, variant: variants[0] };
}

const intentOf = (r: Reservation, amount = r.totalCents) => ({ id: r.stripePaymentIntentId!, amount, currency: "eur" });

describe("paiement confirmé par Stripe (webhook)", () => {
  it("passe une réservation en attente en PAID, une seule fois", async () => {
    const { reservation } = await pending();
    expect(await settleSucceededPayment(reservation.id, intentOf(reservation))).toBe("paid");
    expect(await settleSucceededPayment(reservation.id, intentOf(reservation))).toBe("already");
    expect((await repo().findOneByOrFail({ id: reservation.id })).status).toBe(ReservationStatus.PAID);
  });

  it("ignore un paiement d'un autre montant ou d'un autre PaymentIntent", async () => {
    const { reservation } = await pending();
    expect(await settleSucceededPayment(reservation.id, intentOf(reservation, reservation.totalCents - 1))).toBe("ignored");
    expect(await settleSucceededPayment(reservation.id, { id: "pi_autre", amount: reservation.totalCents, currency: "eur" })).toBe("ignored");
    expect((await repo().findOneByOrFail({ id: reservation.id })).status).toBe(ReservationStatus.PENDING);
  });

  it("valide un paiement tardif si le matériel est toujours libre", async () => {
    const { reservation } = await pending();
    await repo().update(reservation.id, { status: ReservationStatus.EXPIRED });
    expect(await settleSucceededPayment(reservation.id, intentOf(reservation))).toBe("paid");
  });

  it("rembourse un paiement tardif si le matériel a été réservé entre-temps", async () => {
    const { reservation, variant } = await pending(1);
    await repo().update(reservation.id, { status: ReservationStatus.EXPIRED });
    // Un autre client prend le dernier exemplaire pendant ce temps.
    const other = await createUser();
    await createPendingReservation(other.id, inDays(10), inDays(10), [{ variantId: variant.id, quantity: 1 }], billing);

    expect(await settleSucceededPayment(reservation.id, intentOf(reservation))).toBe("refunded");
    expect((await repo().findOneByOrFail({ id: reservation.id })).status).toBe(ReservationStatus.CANCELLED);
  });
});
