import { IsNull, In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Maintenance } from "../entities/Maintenance";
import { MaterialVariant } from "../entities/MaterialVariant";
import { Reservation, ReservationStatus } from "../entities/Reservation";
import { ReservationItem } from "../entities/ReservationItem";
import { isIsoDate, todayIso } from "../utils/dates";
import { badInput, notFound } from "../utils/errors";
import { maintenanceQuantities, reservedQuantities } from "./availability";

const maintenances = () => AppDataSource.getRepository(Maintenance);

export type MaintenanceRequest = {
  variantId: string;
  quantity: number;
  reason: string;
  expectedReturnDate?: string | null;
};

/**
 * Met des exemplaires d'une taille en maintenance. La taille est verrouillée
 * (SELECT … FOR UPDATE) le temps de vérifier le nombre d'exemplaires encore en service,
 * comme pour la création d'une réservation.
 */
export async function startMaintenance(request: MaintenanceRequest): Promise<Maintenance> {
  const reason = request.reason.trim();
  if (reason.length < 2) throw badInput("Indique le motif de la maintenance.");
  const expected = request.expectedReturnDate?.trim() || null;
  if (expected && !isIsoDate(expected)) throw badInput("Date de retour invalide (format AAAA-MM-JJ).");
  if (expected && expected < todayIso()) throw badInput("La date de retour prévue ne peut pas être passée.");

  const id = await AppDataSource.transaction(async (manager) => {
    const variant = await manager
      .getRepository(MaterialVariant)
      .createQueryBuilder("variant")
      .setLock("pessimistic_write")
      .where("variant.id = :id", { id: request.variantId })
      .getOne();
    if (!variant) throw notFound("Taille");

    const already = (await maintenanceQuantities([variant.id], manager)).get(variant.id) ?? 0;
    const inService = variant.stock - already;
    if (request.quantity > inService) {
      throw badInput(
        inService === 0
          ? "Tous les exemplaires de cette taille sont déjà en maintenance."
          : `Seulement ${inService} exemplaire${inService > 1 ? "s" : ""} en service pour cette taille.`,
      );
    }

    const saved = await manager.getRepository(Maintenance).save(
      manager.getRepository(Maintenance).create({
        variant: { id: variant.id },
        quantity: request.quantity,
        reason,
        expectedReturnDate: expected,
      }),
    );
    return saved.id;
  });
  return findMaintenance(id);
}

/** Remet les exemplaires en service. Sans effet si c'est déjà fait. */
export async function endMaintenance(id: string): Promise<Maintenance> {
  await maintenances().update({ id, endedAt: IsNull() }, { endedAt: new Date() });
  return findMaintenance(id);
}

export async function findMaintenance(id: string): Promise<Maintenance> {
  const maintenance = await maintenances().findOne({ where: { id }, relations: { variant: { material: true } } });
  if (!maintenance) throw notFound("Maintenance");
  return maintenance;
}

/** Maintenances, les plus récentes d'abord ; filtrables par matériel et par statut. */
export function listMaintenances(filter: { materialId?: string; activeOnly?: boolean } = {}) {
  return maintenances().find({
    where: {
      ...(filter.activeOnly ? { endedAt: IsNull() } : {}),
      ...(filter.materialId ? { variant: { material: { id: filter.materialId } } } : {}),
    },
    relations: { variant: { material: true } },
    order: { startedAt: "DESC" },
  });
}

export type Conflict = {
  reservation: Reservation;
  variant: MaterialVariant;
  materialName: string;
  size: string;
  reserved: number;
  inService: number;
};

/**
 * Réservations à venir qui ne peuvent plus être honorées à cause d'une maintenance :
 * sur leur période, les réservations de la taille dépassent les exemplaires en service.
 */
export async function findConflicts(variantIds?: string[]): Promise<Conflict[]> {
  const active = await maintenances().find({
    where: { endedAt: IsNull(), ...(variantIds ? { variant: { id: In(variantIds) } } : {}) },
    relations: { variant: { material: true } },
  });
  if (active.length === 0) return [];

  const variants = new Map(active.map((m) => [m.variant.id, m.variant]));
  const ids = [...variants.keys()];
  const inMaintenance = await maintenanceQuantities(ids);
  const today = todayIso();

  // Lignes de réservations qui bloquent encore du matériel et ne sont pas terminées.
  const items = await AppDataSource.getRepository(ReservationItem)
    .createQueryBuilder("item")
    .innerJoinAndSelect("item.reservation", "reservation")
    .innerJoinAndSelect("item.variant", "variant")
    .leftJoinAndSelect("reservation.user", "user")
    .where("variant.id IN (:...ids)", { ids })
    .andWhere("reservation.endDate >= :today", { today })
    .andWhere(
      "NOT reservation.demo AND (reservation.status = :paid OR (reservation.status = :pending AND reservation.expiresAt > now()))",
      { paid: ReservationStatus.PAID, pending: ReservationStatus.PENDING },
    )
    .orderBy("reservation.startDate", "ASC")
    .getMany();

  const conflicts: Conflict[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = `${item.reservation.id}:${item.variant.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const variant = variants.get(item.variant.id)!;
    const start = item.reservation.startDate < today ? today : item.reservation.startDate;
    const reserved = (await reservedQuantities([variant.id], start, item.reservation.endDate)).get(variant.id) ?? 0;
    const inService = Math.max(0, variant.stock - (inMaintenance.get(variant.id) ?? 0));
    if (reserved > inService) {
      const reservation = await AppDataSource.getRepository(Reservation).findOneOrFail({
        where: { id: item.reservation.id },
        relations: { items: { variant: true, material: true }, user: true },
      });
      conflicts.push({ reservation, variant, materialName: variant.material.name, size: variant.size, reserved, inService });
    }
  }
  return conflicts;
}

/**
 * Charge les quantités en maintenance de plusieurs tailles en une seule requête
 * (même principe que DataLoader) : les demandes d'une même requête GraphQL sont
 * regroupées, au lieu d'une requête SQL par taille affichée.
 */
const loaders = new WeakMap<object, (variantId: string) => Promise<number>>();

export function maintenanceLoader(scope: object) {
  const existing = loaders.get(scope);
  if (existing) return existing;

  let pending: { id: string; resolve: (n: number) => void; reject: (e: unknown) => void }[] = [];
  const load = (variantId: string) =>
    new Promise<number>((resolve, reject) => {
      pending.push({ id: variantId, resolve, reject });
      if (pending.length > 1) return;
      process.nextTick(async () => {
        const batch = pending;
        pending = [];
        try {
          const quantities = await maintenanceQuantities([...new Set(batch.map((b) => b.id))]);
          batch.forEach((b) => b.resolve(quantities.get(b.id) ?? 0));
        } catch (error) {
          batch.forEach((b) => b.reject(error));
        }
      });
    });
  loaders.set(scope, load);
  return load;
}
