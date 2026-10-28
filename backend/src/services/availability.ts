import type { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { ReservationStatus } from "../entities/Reservation";
import { Maintenance } from "../entities/Maintenance";
import { ReservationItem } from "../entities/ReservationItem";

/**
 * Quantités déjà réservées par taille (variante) sur une période.
 *
 * Une réservation immobilise le matériel si elle est payée, ou si elle attend
 * son paiement et n'a pas encore expiré. Deux périodes se chevauchent si :
 * début_résa <= fin_demandée ET fin_résa >= début_demandé.
 * Une seule requête SQL agrégée, quel que soit le nombre de tailles.
 */
export async function reservedQuantities(
  variantIds: string[],
  start: string,
  end: string,
  manager: EntityManager = AppDataSource.manager,
): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();

  const rows = await manager
    .getRepository(ReservationItem)
    .createQueryBuilder("item")
    .innerJoin("item.reservation", "reservation")
    .innerJoin("item.variant", "variant")
    .select("variant.id", "variantId")
    .addSelect("COALESCE(SUM(item.quantity), 0)", "reserved")
    .where("variant.id IN (:...variantIds)", { variantIds })
    .andWhere(
      "NOT reservation.demo AND (reservation.status = :paid OR (reservation.status = :pending AND reservation.expiresAt > now()))",
      { paid: ReservationStatus.PAID, pending: ReservationStatus.PENDING },
    )
    .andWhere("reservation.startDate <= :end", { end })
    .andWhere("reservation.endDate >= :start", { start })
    .groupBy("variant.id")
    .getRawMany<{ variantId: string; reserved: string }>();

  return new Map(rows.map((row) => [row.variantId, Number(row.reserved)]));
}

/**
 * Exemplaires en maintenance (en cours) par taille. Ils sont immobilisés quelles
 * que soient les dates, jusqu'à leur remise en service.
 */
export async function maintenanceQuantities(
  variantIds: string[],
  manager: EntityManager = AppDataSource.manager,
): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const rows = await manager
    .getRepository(Maintenance)
    .createQueryBuilder("maintenance")
    .innerJoin("maintenance.variant", "variant")
    .select("variant.id", "variantId")
    .addSelect("SUM(maintenance.quantity)", "quantity")
    .where("variant.id IN (:...variantIds)", { variantIds })
    .andWhere("maintenance.endedAt IS NULL")
    .groupBy("variant.id")
    .getRawMany<{ variantId: string; quantity: string }>();
  return new Map(rows.map((row) => [row.variantId, Number(row.quantity)]));
}

/** Exemplaires disponibles = stock − en maintenance − réservés sur la période. */
export function available(stock: number, reserved: number | undefined, maintenance = 0): number {
  return Math.max(0, stock - maintenance - (reserved ?? 0));
}
