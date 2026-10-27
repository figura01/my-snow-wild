import { In, type EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { MaterialVariant } from "../entities/MaterialVariant";
import { parsePeriod } from "../utils/dates";
import { badInput } from "../utils/errors";
import { available, maintenanceQuantities, reservedQuantities } from "./availability";

export type QuoteRequestItem = { variantId: string; quantity: number };

export type QuoteLine = {
  variantId: string;
  materialId: string | null;
  materialName: string;
  materialSlug: string | null;
  size: string;
  quantity: number;
  available: number;
  dailyPriceCents: number;
  lineTotalCents: number;
  ok: boolean;
  message: string | null;
};

export type Quote = {
  startDate: string;
  endDate: string;
  days: number;
  lines: QuoteLine[];
  totalCents: number;
  valid: boolean;
};

export const MAX_QUANTITY_PER_LINE = 20;
export const MAX_LINES = 50;

/**
 * Calcule un devis à partir du contenu du panier envoyé par le navigateur.
 * Seuls les identifiants de taille et les quantités sont repris : les prix et
 * la disponibilité viennent toujours de la base. Sert à l'affichage du panier
 * et servira à la création de la réservation.
 */
export async function buildQuote(
  startDate: string,
  endDate: string,
  requested: QuoteRequestItem[],
  manager: EntityManager = AppDataSource.manager,
): Promise<Quote> {
  const period = parsePeriod(startDate, endDate);
  if (!period) throw badInput("Choisis les dates de location.");
  if (requested.length > MAX_LINES) throw badInput("Le panier contient trop d'articles.");

  // Regroupe une même taille ajoutée plusieurs fois.
  const quantities = new Map<string, number>();
  for (const item of requested) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw badInput("Quantité invalide.");
    quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
  }
  const ids = [...quantities.keys()];

  const variants = ids.length
    ? await manager.getRepository(MaterialVariant).find({
        where: { id: In(ids) },
        relations: { material: true },
      })
    : [];
  const byId = new Map(variants.map((v) => [v.id, v]));
  const reserved = await reservedQuantities(ids, period.start, period.end, manager);
  const inMaintenance = await maintenanceQuantities(ids, manager);

  const lines: QuoteLine[] = ids.map((variantId) => {
    const quantity = quantities.get(variantId)!;
    const variant = byId.get(variantId);

    if (!variant || !variant.material.isActive) {
      return {
        variantId, materialId: variant?.material.id ?? null, materialName: variant?.material.name ?? "Article retiré",
        materialSlug: null, size: variant?.size ?? "", quantity, available: 0,
        dailyPriceCents: 0, lineTotalCents: 0, ok: false,
        message: "Cet article n'est plus proposé à la location.",
      };
    }

    const free = available(variant.stock, reserved.get(variantId), inMaintenance.get(variantId));
    const ok = quantity <= free && quantity <= MAX_QUANTITY_PER_LINE;
    const price = variant.material.dailyPriceCents;
    return {
      variantId,
      materialId: variant.material.id,
      materialName: variant.material.name,
      materialSlug: variant.material.slug,
      size: variant.size,
      quantity,
      available: free,
      dailyPriceCents: price,
      lineTotalCents: price * period.days * quantity,
      ok,
      message: ok
        ? null
        : quantity > MAX_QUANTITY_PER_LINE
          ? `Maximum ${MAX_QUANTITY_PER_LINE} exemplaires par taille.`
          : free === 0
            ? "Plus disponible sur ces dates."
            : `Seulement ${free} disponible${free > 1 ? "s" : ""} sur ces dates.`,
    };
  });

  const totalCents = lines.reduce((sum, line) => sum + (line.ok ? line.lineTotalCents : 0), 0);
  return {
    startDate: period.start,
    endDate: period.end,
    days: period.days,
    lines,
    totalCents,
    valid: lines.length > 0 && lines.every((line) => line.ok),
  };
}
