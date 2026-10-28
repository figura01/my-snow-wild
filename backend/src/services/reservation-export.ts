import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Invoice } from "../entities/Invoice";
import { ReservationStatus } from "../entities/Reservation";
import { countDays } from "../utils/dates";
import { toCsv } from "../utils/csv";
import { allReservations, isExpired } from "./reservations";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.DRAFT]: "panier en cours",
  [ReservationStatus.PENDING]: "en attente de paiement",
  [ReservationStatus.PAID]: "payée",
  [ReservationStatus.EXPIRED]: "expirée",
  [ReservationStatus.CANCELLED]: "annulée",
};

const COLUMNS = [
  "reference", "statut", "passee_le", "payee_le", "debut", "fin", "jours",
  "client", "email", "telephone", "adresse", "code_postal", "ville",
  "articles", "quantite", "total_ttc", "total_ht", "tva", "facture",
];

const paris = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", ...options });
const dateTime = paris({ day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const isoToFr = (iso: string) => iso.split("-").reverse().join("/");
const euros = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

/**
 * Réservations au format CSV (tableur), pour la comptabilité ou le suivi.
 * Mêmes filtres que la liste du back-office ; montants HT et TVA repris de la facture.
 */
export async function exportReservations(statuses?: ReservationStatus[]): Promise<string> {
  const reservations = await allReservations(statuses);
  const invoices = reservations.length
    ? await AppDataSource.getRepository(Invoice).find({ where: { reservationId: In(reservations.map((r) => r.id)) } })
    : [];
  const invoiceOf = new Map(invoices.map((i) => [i.reservationId, i]));

  const rows: string[][] = [COLUMNS];
  for (const r of reservations) {
    const invoice = invoiceOf.get(r.id);
    const status = r.status === ReservationStatus.PENDING && isExpired(r) ? ReservationStatus.EXPIRED : r.status;
    rows.push([
      r.id.slice(0, 8).toUpperCase(),
      STATUS_LABELS[status],
      dateTime.format(r.createdAt),
      r.paidAt ? dateTime.format(r.paidAt) : "",
      isoToFr(r.startDate),
      isoToFr(r.endDate),
      String(countDays(r.startDate, r.endDate)),
      `${r.billingFirstName} ${r.billingLastName}`.trim(),
      r.billingEmail,
      r.billingPhone,
      r.billingAddress,
      r.billingPostalCode,
      r.billingCity,
      r.items.map((i) => `${i.quantity} × ${i.material.name} (${i.variant.size})`).join(" | "),
      String(r.items.reduce((sum, i) => sum + i.quantity, 0)),
      euros(r.totalCents),
      invoice ? euros(invoice.totalHtCents) : "",
      invoice ? euros(invoice.vatCents) : "",
      invoice?.number ?? "",
    ]);
  }
  return toCsv(rows);
}
