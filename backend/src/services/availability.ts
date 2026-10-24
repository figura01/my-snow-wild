import type { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { ReservationStatus } from "../entities/Reservation";
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
      "(reservation.status = :paid OR (reservation.status = :pending AND reservation.expiresAt > now()))",
      { paid: ReservationStatus.PAID, pending: ReservationStatus.PENDING },
    )
    .andWhere("reservation.startDate <= :end", { end })
    .andWhere("reservation.endDate >= :start", { start })
    .groupBy("variant.id")
    .getRawMany<{ variantId: string; reserved: string }>();

  return new Map(rows.map((row) => [row.variantId, Number(row.reserved)]));
}

/** Exemplaires encore disponibles = stock − quantités réservées sur la période. */
export function available(stock: number, reserved: number | undefined): number {
  return Math.max(0, stock - (reserved ?? 0));
}
