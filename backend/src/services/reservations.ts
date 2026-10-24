import { AppDataSource } from "../data-source";
import { MaterialVariant } from "../entities/MaterialVariant";
import { PAYMENT_DELAY_MINUTES, Reservation, ReservationStatus } from "../entities/Reservation";
import { ReservationItem } from "../entities/ReservationItem";
import { badInput } from "../utils/errors";
import { buildQuote, type QuoteRequestItem } from "./quote";

export type Billing = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
};

/**
 * Crée une réservation « en attente de paiement » qui bloque le matériel.
 *
 * Tout se passe dans une transaction qui verrouille les tailles concernées
 * (SELECT … FOR UPDATE) : deux clients qui commandent le dernier exemplaire
 * au même moment sont traités l'un après l'autre, et le second voit la
 * réservation du premier. Pas de surréservation possible.
 */
export async function createPendingReservation(
  userId: string,
  startDate: string,
  endDate: string,
  items: QuoteRequestItem[],
  billing: Billing,
): Promise<Reservation> {
  if (items.length === 0) throw badInput("Ton panier est vide.");
  const variantIds = [...new Set(items.map((i) => i.variantId))];

  const id = await AppDataSource.transaction(async (manager) => {
    await manager
      .getRepository(MaterialVariant)
      .createQueryBuilder("variant")
      .setLock("pessimistic_write")
      .where("variant.id IN (:...variantIds)", { variantIds })
      .getMany();

    const quote = await buildQuote(startDate, endDate, items, manager);
    if (!quote.valid) {
      throw badInput("Certains articles ne sont plus disponibles sur ces dates : vérifie ton panier.");
    }

    const reservation = manager.create(Reservation, {
      user: { id: userId },
      startDate: quote.startDate,
      endDate: quote.endDate,
      status: ReservationStatus.PENDING,
      totalCents: quote.totalCents,
      expiresAt: new Date(Date.now() + PAYMENT_DELAY_MINUTES * 60_000),
      billingFirstName: billing.firstName.trim(),
      billingLastName: billing.lastName.trim(),
      billingEmail: billing.email.trim().toLowerCase(),
      billingPhone: billing.phone.trim(),
      billingAddress: billing.address.trim(),
      billingPostalCode: billing.postalCode.trim(),
      billingCity: billing.city.trim(),
      items: quote.lines.map((line) =>
        manager.create(ReservationItem, {
          variant: { id: line.variantId },
          material: { id: line.materialId! },
          quantity: line.quantity,
          dailyPriceCents: line.dailyPriceCents,
        }),
      ),
    });
    return (await manager.save(reservation)).id;
  });

  return findReservation(id);
}

export async function findReservation(id: string): Promise<Reservation> {
  const reservation = await AppDataSource.getRepository(Reservation).findOne({
    where: { id },
    relations: { items: { variant: true, material: true }, user: true },
  });
  if (!reservation) throw badInput("Réservation introuvable.");
  return reservation;
}

/** Passe une réservation en « payée ». Idempotent : sans effet si déjà payée. */
export async function markPaid(id: string): Promise<void> {
  await AppDataSource.getRepository(Reservation).update(
    { id, status: ReservationStatus.PENDING },
    { status: ReservationStatus.PAID, paidAt: new Date(), expiresAt: null },
  );
}

export async function markCancelled(id: string): Promise<void> {
  await AppDataSource.getRepository(Reservation).update(
    { id, status: ReservationStatus.PENDING },
    { status: ReservationStatus.CANCELLED, expiresAt: null },
  );
}

export const isExpired = (r: Reservation) =>
  r.status === ReservationStatus.PENDING && !!r.expiresAt && r.expiresAt.getTime() <= Date.now();

export const userReservations = (userId: string) =>
  AppDataSource.getRepository(Reservation).find({
    where: { user: { id: userId } },
    relations: { items: { variant: true, material: true } },
    order: { createdAt: "DESC" },
  });

export const allReservations = () =>
  AppDataSource.getRepository(Reservation).find({
    relations: { items: { variant: true, material: true }, user: true },
    order: { createdAt: "DESC" },
  });

