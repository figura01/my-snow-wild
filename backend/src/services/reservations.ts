import { In, Not } from "typeorm";
import { AppDataSource } from "../data-source";
import { MaterialVariant } from "../entities/MaterialVariant";
import { PAYMENT_DELAY_MINUTES, Reservation, ReservationStatus } from "../entities/Reservation";
import { ReservationItem } from "../entities/ReservationItem";
import { badInput } from "../utils/errors";
import { deleteDraft } from "./cart";
import { issueInvoiceSafely } from "./invoices";
import { cancelPaymentIntent, refundPaymentIntent } from "./payment";
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
    const saved = await manager.save(reservation);
    // Le panier en base du client devient cette commande : on le supprime.
    await deleteDraft(userId, manager);
    return saved.id;
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

/** Passe une réservation en « payée » et émet sa facture. Idempotent : sans effet si déjà payée. */
export async function markPaid(id: string): Promise<void> {
  const result = await AppDataSource.getRepository(Reservation).update(
    { id, status: ReservationStatus.PENDING },
    { status: ReservationStatus.PAID, paidAt: new Date(), expiresAt: null },
  );
  if (result.affected) await issueInvoiceSafely(id);
}

export async function markCancelled(id: string): Promise<void> {
  await AppDataSource.getRepository(Reservation).update(
    { id, status: ReservationStatus.PENDING },
    { status: ReservationStatus.CANCELLED, expiresAt: null },
  );
}

export const isExpired = (r: Reservation) =>
  r.status === ReservationStatus.EXPIRED ||
  (r.status === ReservationStatus.PENDING && !!r.expiresAt && r.expiresAt.getTime() <= Date.now());

/**
 * Passe en EXPIRED les réservations en attente dont le délai de paiement est dépassé.
 * Lancé au démarrage puis chaque minute ; la disponibilité ne dépend pas de ce passage
 * (une réservation en attente expirée ne bloque déjà plus rien), il rend juste le statut explicite.
 */
export async function expireStaleReservations(): Promise<number> {
  const result = await AppDataSource.getRepository(Reservation)
    .createQueryBuilder()
    .update()
    .set({ status: ReservationStatus.EXPIRED })
    .where("status = :pending AND expiresAt <= now()", { pending: ReservationStatus.PENDING })
    .returning(["id", "stripePaymentIntentId"])
    .execute();
  // Le paiement Stripe de ces réservations ne doit plus pouvoir aboutir.
  const expired = (result.raw ?? []) as { stripePaymentIntentId: string | null }[];
  await Promise.all(expired.filter((r) => r.stripePaymentIntentId).map((r) => cancelPaymentIntent(r.stripePaymentIntentId!)));
  return result.affected ?? expired.length;
}

// Les paniers (DRAFT) ne sont pas des réservations : exclus des listes.
export const userReservations = (userId: string) =>
  AppDataSource.getRepository(Reservation).find({
    where: { user: { id: userId }, status: Not(ReservationStatus.DRAFT) },
    relations: { items: { variant: true, material: true } },
    order: { createdAt: "DESC" },
  });

export const allReservations = (statuses?: ReservationStatus[]) =>
  AppDataSource.getRepository(Reservation).find({
    where: { status: statuses?.length ? In(statuses) : Not(ReservationStatus.DRAFT) },
    relations: { items: { variant: true, material: true }, user: true },
    order: { createdAt: "DESC" },
  });


/**
 * Paiement confirmé par Stripe (webhook ou retour du navigateur). Idempotent.
 * - réservation en attente : elle passe en PAID ;
 * - réservation déjà expirée ou annulée (paiement arrivé au dernier moment) : si le matériel
 *   est toujours libre, elle est validée quand même ; sinon le client est remboursé.
 * Le montant payé doit correspondre exactement au total de la réservation.
 */
export async function settleSucceededPayment(
  reservationId: string,
  intent: { id: string; amount: number; currency: string },
): Promise<"paid" | "already" | "refunded" | "ignored"> {
  const repo = AppDataSource.getRepository(Reservation);
  const reservation = await repo.findOne({ where: { id: reservationId }, relations: { items: { variant: true } } });
  if (!reservation || reservation.stripePaymentIntentId !== intent.id) return "ignored";
  if (reservation.status === ReservationStatus.PAID) return "already";
  if (intent.amount !== reservation.totalCents || intent.currency !== "eur") {
    console.error("[paiement] montant inattendu", reservationId, intent.amount, reservation.totalCents);
    return "ignored";
  }

  if (reservation.status === ReservationStatus.PENDING) {
    await markPaid(reservationId);
    return "paid";
  }

  // Paiement tardif : on revérifie la disponibilité, avec verrou comme pour une commande.
  const stillAvailable = await AppDataSource.transaction(async (manager) => {
    const variantIds = reservation.items.map((i) => i.variant.id);
    await manager
      .getRepository(MaterialVariant)
      .createQueryBuilder("variant")
      .setLock("pessimistic_write")
      .where("variant.id IN (:...variantIds)", { variantIds })
      .getMany();
    const quote = await buildQuote(
      reservation.startDate,
      reservation.endDate,
      reservation.items.map((i) => ({ variantId: i.variant.id, quantity: i.quantity })),
      manager,
    ).catch(() => null); // période passée entre-temps : plus réservable
    if (!quote?.valid) return false;
    await manager.getRepository(Reservation).update(reservationId, {
      status: ReservationStatus.PAID,
      paidAt: new Date(),
      expiresAt: null,
    });
    return true;
  });
  if (stillAvailable) {
    await issueInvoiceSafely(reservationId);
    return "paid";
  }

  await refundPaymentIntent(intent.id);
  await repo.update(reservationId, { status: ReservationStatus.CANCELLED, expiresAt: null });
  return "refunded";
}
