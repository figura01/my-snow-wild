import { AppDataSource } from "../data-source";
import { Reservation, ReservationStatus } from "../entities/Reservation";
import { sendMail, type Attachment } from "../mail/mailer";
import { reservationConfirmed } from "../mail/templates";
import { countDays } from "../utils/dates";
import { renderInvoicePdf } from "./invoice-pdf";
import { findInvoiceOf } from "./invoices";

/**
 * E-mail de confirmation d'une réservation payée, facture PDF jointe.
 * Envoyé à l'adresse de facturation saisie à la commande.
 */
export async function sendReservationConfirmation(reservationId: string): Promise<void> {
  const reservation = await AppDataSource.getRepository(Reservation).findOne({
    where: { id: reservationId },
    relations: { items: { variant: true, material: true } },
  });
  if (!reservation || reservation.demo || reservation.status !== ReservationStatus.PAID) return;

  const invoice = await findInvoiceOf(reservationId);
  const attachments: Attachment[] = invoice
    ? [{ filename: `${invoice.number}.pdf`, content: await renderInvoicePdf(invoice, { paidAt: reservation.paidAt, reservationId }) }]
    : [];

  const days = countDays(reservation.startDate, reservation.endDate);
  const mail = reservationConfirmed({
    firstName: reservation.billingFirstName,
    reference: reservationId.slice(0, 8).toUpperCase(),
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    days,
    lines: reservation.items.map((i) => ({
      label: i.material.name,
      size: i.variant.size,
      quantity: i.quantity,
      totalCents: i.quantity * i.dailyPriceCents * days,
    })),
    totalCents: reservation.totalCents,
    invoiceNumber: invoice?.number ?? null,
  });

  await sendMail({
    to: reservation.billingEmail,
    ...mail,
    attachments,
    // Webhook et retour du navigateur peuvent arriver ensemble : un seul e-mail.
    idempotencyKey: `reservation-confirmed/${reservationId}`,
  });
}

/** Ne fait jamais échouer la prise en compte du paiement. */
export async function sendReservationConfirmationSafely(reservationId: string): Promise<void> {
  try {
    await sendReservationConfirmation(reservationId);
  } catch (error) {
    console.error("[mail] confirmation non envoyée", reservationId, error instanceof Error ? error.message : error);
  }
}
