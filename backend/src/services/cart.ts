import { In, type EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { MaterialVariant } from "../entities/MaterialVariant";
import { Reservation, ReservationStatus } from "../entities/Reservation";
import { ReservationItem } from "../entities/ReservationItem";
import { isIsoDate } from "../utils/dates";
import { badInput } from "../utils/errors";
import { MAX_LINES, MAX_QUANTITY_PER_LINE, type QuoteRequestItem } from "./quote";

/*
 * Panier en base d'un client connecté : une réservation au statut DRAFT (une seule par client).
 * Il ne bloque aucun matériel ; prix et disponibilité sont recalculés au moment de commander.
 */

const reservations = (manager: EntityManager = AppDataSource.manager) => manager.getRepository(Reservation);

/** Supprime le panier d'un client (requête explicite sur la colonne de jointure). */
export function deleteDraft(userId: string, manager: EntityManager = AppDataSource.manager) {
  return manager
    .createQueryBuilder()
    .delete()
    .from(Reservation)
    .where('"userId" = :userId AND status = :draft', { userId, draft: ReservationStatus.DRAFT })
    .execute();
}

export function findDraft(userId: string, manager?: EntityManager): Promise<Reservation | null> {
  return reservations(manager).findOne({
    where: { user: { id: userId }, status: ReservationStatus.DRAFT },
    relations: { items: { variant: true, material: true } },
  });
}

export type CartData = { startDate: string; endDate: string; items: QuoteRequestItem[] };

/**
 * Remplace le panier du client. Un panier vide le supprime.
 * Les tailles inconnues ou retirées du catalogue sont ignorées (le panier du navigateur peut être ancien).
 */
export async function saveDraft(userId: string, cart: CartData): Promise<Reservation | null> {
  if (cart.items.length === 0) {
    await deleteDraft(userId);
    return null;
  }
  if (!isIsoDate(cart.startDate) || !isIsoDate(cart.endDate) || cart.endDate < cart.startDate) {
    throw badInput("Période du panier invalide.");
  }
  if (cart.items.length > MAX_LINES) throw badInput("Le panier contient trop d'articles.");

  // Regroupe une même taille et plafonne les quantités.
  const quantities = new Map<string, number>();
  for (const item of cart.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw badInput("Quantité invalide.");
    quantities.set(item.variantId, Math.min(MAX_QUANTITY_PER_LINE, (quantities.get(item.variantId) ?? 0) + item.quantity));
  }

  return AppDataSource.transaction(async (manager) => {
    const variants = await manager.getRepository(MaterialVariant).find({
      where: { id: In([...quantities.keys()]) },
      relations: { material: true },
    });
    const usable = variants.filter((v) => v.material.isActive);

    let draft = await findDraft(userId, manager);
    if (draft) {
      await manager.createQueryBuilder().delete().from(ReservationItem).where('"reservationId" = :id', { id: draft.id }).execute();
      await reservations(manager).update(draft.id, { startDate: cart.startDate, endDate: cart.endDate, updatedAt: new Date() });
    } else {
      draft = await reservations(manager).save(
        reservations(manager).create({
          user: { id: userId },
          status: ReservationStatus.DRAFT,
          startDate: cart.startDate,
          endDate: cart.endDate,
          totalCents: 0,
          // Coordonnées de facturation : saisies au moment de commander.
          billingFirstName: "", billingLastName: "", billingEmail: "", billingPhone: "",
          billingAddress: "", billingPostalCode: "", billingCity: "",
          items: [],
        }),
      );
    }

    if (usable.length === 0) {
      await reservations(manager).delete(draft.id);
      return null;
    }
    await manager.getRepository(ReservationItem).save(
      usable.map((variant) =>
        manager.getRepository(ReservationItem).create({
          reservation: { id: draft!.id },
          variant: { id: variant.id },
          material: { id: variant.material.id },
          quantity: quantities.get(variant.id)!,
          dailyPriceCents: variant.material.dailyPriceCents, // indicatif : recalculé à la commande
        }),
      ),
    );
    return findDraft(userId, manager);
  });
}
