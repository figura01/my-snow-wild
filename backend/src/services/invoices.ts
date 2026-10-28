import type { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { Invoice, type InvoiceLine } from "../entities/Invoice";
import { Reservation, ReservationStatus } from "../entities/Reservation";
import { countDays } from "../utils/dates";
import { badInput } from "../utils/errors";

/** TVA française, taux normal : 20 % (en points de base). */
export const VAT_RATE_BPS = 2000;

/** Les prix affichés sont TTC : on en déduit le HT et la TVA, arrondis au centime. */
export function splitVat(totalTtcCents: number, rateBps = VAT_RATE_BPS) {
  const totalHtCents = Math.round((totalTtcCents * 10_000) / (10_000 + rateBps));
  return { totalHtCents, vatCents: totalTtcCents - totalHtCents, totalTtcCents };
}

export const formatInvoiceNumber = (year: number, sequence: number) => `FA-${year}-${String(sequence).padStart(4, "0")}`;

/** Année de facturation à l'heure de Paris (une facture du 31/12 à 23 h 30 reste sur l'année en cours). */
export function invoiceYear(date: Date): number {
  return Number(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric" }).format(date));
}

/** Prochain numéro de l'année, dans la transaction en cours (ligne verrouillée jusqu'au commit). */
async function nextSequence(manager: EntityManager, year: number): Promise<number> {
  const rows: { last: number }[] = await manager.query(
    `INSERT INTO "invoice_counter" ("year", "last") VALUES ($1, 1)
     ON CONFLICT ("year") DO UPDATE SET "last" = "invoice_counter"."last" + 1
     RETURNING "last"`,
    [year],
  );
  return rows[0].last;
}

/**
 * Émet la facture d'une réservation payée. Idempotent : renvoie la facture existante
 * si elle a déjà été émise (la réservation est verrouillée pendant l'opération, deux
 * appels simultanés — webhook et retour du navigateur — ne créent pas deux factures).
 */
export async function issueInvoice(reservationId: string, now = new Date()): Promise<Invoice> {
  return AppDataSource.transaction(async (manager) => {
    const reservation = await manager
      .getRepository(Reservation)
      .createQueryBuilder("reservation")
      .setLock("pessimistic_write")
      .where("reservation.id = :id", { id: reservationId })
      .getOne();
    if (!reservation) throw badInput("Réservation introuvable.");

    const existing = await manager.getRepository(Invoice).findOneBy({ reservationId });
    if (existing) return existing;
    if (reservation.status !== ReservationStatus.PAID) {
      throw badInput("La facture est disponible une fois la réservation payée.");
    }

    const items = await manager.getRepository(Reservation).findOneOrFail({
      where: { id: reservationId },
      relations: { items: { variant: true, material: true } },
    });
    const days = countDays(reservation.startDate, reservation.endDate);
    const lines: InvoiceLine[] = items.items
      .map((item) => ({
        label: item.material.name,
        size: item.variant.size,
        quantity: item.quantity,
        days,
        unitPriceCents: item.dailyPriceCents,
        totalCents: item.dailyPriceCents * item.quantity * days,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr") || a.size.localeCompare(b.size, "fr"));

    // Le montant facturé est celui qui a été payé.
    const amounts = splitVat(reservation.totalCents);
    const linesTotal = lines.reduce((sum, line) => sum + line.totalCents, 0);
    if (linesTotal !== reservation.totalCents) {
      console.warn("[facture] total des lignes différent du montant payé", reservationId, linesTotal, reservation.totalCents);
    }

    const year = invoiceYear(now);
    const sequence = await nextSequence(manager, year);

    return manager.getRepository(Invoice).save(
      manager.create(Invoice, {
        number: formatInvoiceNumber(year, sequence),
        year,
        sequence,
        reservationId,
        issuedAt: now,
        customerName: `${reservation.billingFirstName} ${reservation.billingLastName}`.trim(),
        customerEmail: reservation.billingEmail,
        customerAddress: reservation.billingAddress,
        customerPostalCode: reservation.billingPostalCode,
        customerCity: reservation.billingCity,
        periodStart: reservation.startDate,
        periodEnd: reservation.endDate,
        lines,
        vatRateBps: VAT_RATE_BPS,
        ...amounts,
        paymentReference: reservation.stripePaymentIntentId ?? reservation.stripeSessionId ?? null,
      }),
    );
  });
}

/**
 * Appelé juste après le passage en PAID. Une erreur ici ne doit jamais faire échouer
 * la prise en compte du paiement : la facture sera alors émise au premier téléchargement.
 */
export async function issueInvoiceSafely(reservationId: string): Promise<void> {
  try {
    await issueInvoice(reservationId);
  } catch (error) {
    console.error("[facture] émission différée", reservationId, error);
  }
}

export const findInvoiceOf = (reservationId: string) =>
  AppDataSource.getRepository(Invoice).findOneBy({ reservationId });
