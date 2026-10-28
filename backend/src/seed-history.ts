// Historique fictif de réservations pour le tableau de bord de démonstration.
// Lancement : docker compose exec backend npm run seed:history          (remplace l'historique fictif)
//             docker compose exec backend npm run seed:history -- --clear (le supprime seulement)
// En production : docker compose exec backend node dist/seed-history.js
//
// Les réservations créées sont marquées « demo » : elles alimentent les statistiques
// mais ne bloquent jamais de matériel, et n'apparaissent ni dans les listes ni dans
// les exports. Les vraies réservations ne sont jamais modifiées.
import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { AppDataSource } from "./data-source";
import { Material } from "./entities/Material";
import { addDays, daysBetween, parisDay, season, seasonOf } from "./utils/season";

export type CatalogItem = { materialId: string; category: string; variantIds: string[]; dailyPriceCents: number };

export type DemoReservation = {
  id: string;
  status: "PAID" | "EXPIRED" | "CANCELLED";
  startDate: string;
  endDate: string;
  createdAt: Date;
  paidAt: Date | null;
  totalCents: number;
  firstName: string;
  lastName: string;
  city: [string, string];
  items: { variantId: string; materialId: string; quantity: number; dailyPriceCents: number }[];
};

/** Générateur pseudo-aléatoire reproductible (mulberry32) : même graine, même historique. */
export function random(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(items: readonly T[], weights?: readonly number[]): T => {
    const w = weights ?? items.map(() => 1);
    let r = next() * w.reduce((s, x) => s + x, 0);
    for (let i = 0; i < items.length; i++) if ((r -= w[i]) < 0) return items[i];
    return items[items.length - 1];
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return { next, pick, int };
}

// Fréquentation d'un jour de début de location : vacances de Noël et de février en pointe,
// début et fin de saison calmes, départs plus nombreux le week-end.
export function demand(day: string): number {
  const [, month, date] = day.split("-").map(Number);
  const md = month * 100 + date;
  let weight =
    md >= 1001 && md <= 1130 ? 0.12
    : md >= 1201 && md <= 1219 ? 0.55
    : md >= 1220 || md <= 104 ? 2.3
    : md <= 131 ? 0.85
    : md <= 308 ? 2.7 // vacances d'hiver, toutes zones
    : md <= 331 ? 1.0
    : md <= 420 ? 0.7
    : 0.25;
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  if (weekday === 6) weight *= 1.6;
  else if (weekday === 0) weight *= 1.25;
  return weight;
}

const isHoliday = (day: string) => {
  const md = Number(day.slice(5, 7)) * 100 + Number(day.slice(8, 10));
  return md >= 1220 || md <= 104 || (md >= 201 && md <= 308);
};

const FIRST_NAMES = ["Camille", "Léa", "Hugo", "Louis", "Emma", "Jules", "Chloé", "Lucas", "Manon", "Nathan", "Inès", "Tom", "Sarah", "Théo", "Zoé", "Paul"];
const LAST_NAMES = ["Martin", "Bernard", "Dubois", "Durand", "Lefebvre", "Moreau", "Laurent", "Simon", "Michel", "Garcia", "Roux", "Fournier", "Girard", "Bonnet"];
const CITIES: [string, string][] = [["75011", "Paris"], ["69003", "Lyon"], ["13006", "Marseille"], ["38000", "Grenoble"], ["73000", "Chambéry"], ["74000", "Annecy"], ["44000", "Nantes"], ["33000", "Bordeaux"], ["59000", "Lille"], ["67000", "Strasbourg"]];

// Poids de chaque catégorie dans les paniers (les skis et chaussures dominent).
const CATEGORY_WEIGHT: [RegExp, number][] = [[/ski/i, 1], [/chauss/i, 0.8], [/casque/i, 0.5], [/b[âa]ton/i, 0.4], [/snow/i, 0.35]];
const categoryWeight = (name: string) => CATEGORY_WEIGHT.find(([re]) => re.test(name))?.[1] ?? 0.3;

/**
 * Génère les réservations fictives d'une saison. Pour la saison en cours, seules celles
 * déjà « commandées » à la date du jour sont gardées (les autres n'existeraient pas encore).
 */
export function generateSeason(catalog: CatalogItem[], startYear: number, count: number, today: string, seed: number): DemoReservation[] {
  const rng = random(seed);
  const s = season(startYear);
  const days = Array.from({ length: daysBetween(s.start, s.end) + 1 }, (_, i) => addDays(s.start, i));
  const dayWeights = days.map(demand);

  // Popularité : dans chaque catégorie, quelques matériels font l'essentiel des locations.
  const categories = [...new Set(catalog.map((c) => c.category))];
  const popularity = new Map<string, number>();
  for (const category of categories) {
    catalog
      .filter((c) => c.category === category)
      .map((c) => ({ c, key: rng.next() }))
      .sort((a, b) => a.key - b.key)
      .forEach(({ c }, rank) => popularity.set(c.materialId, 1 / (rank + 1) ** 0.9));
  }
  const catWeights = categories.map(categoryWeight);

  const result: DemoReservation[] = [];
  for (let n = 0; n < count; n++) {
    const startDate = rng.pick(days, dayWeights);
    const length = rng.pick([1, 2, 3, 4, 5, 6, 7], [14, 18, 9, 7, 12, 24, 16]);
    const endDate = [addDays(startDate, length - 1), s.end].sort()[0];
    const rentalDays = daysBetween(startDate, endDate) + 1;

    // Délai de réservation : plus long pour les vacances scolaires.
    const lead = isHoliday(startDate) ? rng.int(10, 110) : Math.floor(-Math.log(1 - rng.next()) * 9);
    let orderDay = addDays(startDate, -lead);
    if (orderDay < s.start) orderDay = addDays(s.start, rng.int(0, 6));
    if (orderDay > startDate) orderDay = startDate;
    if (orderDay > today) continue; // pas encore commandée

    const hour = rng.int(7, 22);
    const minute = rng.int(0, 59);
    const createdAt = new Date(`${orderDay}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+01:00`);
    const status = rng.pick(["PAID", "EXPIRED", "CANCELLED"] as const, [89, 8, 3]);

    const items: DemoReservation["items"] = [];
    const lines = rng.pick([1, 2, 3, 4], [45, 34, 15, 6]);
    for (let l = 0; l < lines; l++) {
      const category = rng.pick(categories, catWeights);
      const choices = catalog.filter((c) => c.category === category);
      const material = rng.pick(choices, choices.map((c) => popularity.get(c.materialId)!));
      const variantId = rng.pick(material.variantIds);
      if (items.some((i) => i.variantId === variantId)) continue;
      items.push({ variantId, materialId: material.materialId, quantity: rng.pick([1, 2, 3, 4], [70, 22, 6, 2]), dailyPriceCents: material.dailyPriceCents });
    }

    result.push({
      id: randomUUID(),
      status,
      startDate,
      endDate,
      createdAt,
      paidAt: status === "PAID" ? new Date(createdAt.getTime() + rng.int(1, 6) * 60_000) : null,
      totalCents: items.reduce((sum, i) => sum + i.quantity * i.dailyPriceCents * rentalDays, 0),
      firstName: rng.pick(FIRST_NAMES),
      lastName: rng.pick(LAST_NAMES),
      city: rng.pick(CITIES),
      items,
    });
  }
  return result;
}

async function insert(reservations: DemoReservation[]) {
  await AppDataSource.transaction(async (manager) => {
    for (let i = 0; i < reservations.length; i += 200) {
      const chunk = reservations.slice(i, i + 200);
      const values: unknown[] = [];
      const rows = chunk.map((r, k) => {
        const n = (r.firstName + r.lastName).normalize("NFD").replace(/[^a-zA-Z]/g, "").toLowerCase();
        values.push(
          r.id, r.startDate, r.endDate, r.status, r.firstName, r.lastName, `${n}.${i + k}@demo.snowwild.dev`, "06 00 00 00 00",
          "Adresse de démonstration", r.city[0], r.city[1], r.paidAt, r.totalCents, r.createdAt.toISOString().replace("T", " ").slice(0, 19),
        );
        const b = k * 14;
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8}, $${b + 9}, $${b + 10}, $${b + 11}, $${b + 12}, $${b + 13}, $${b + 14}, $${b + 14}, true)`;
      });
      await manager.query(
        `INSERT INTO "reservation" ("id", "startDate", "endDate", "status", "billingFirstName", "billingLastName", "billingEmail", "billingPhone",
           "billingAddress", "billingPostalCode", "billingCity", "paidAt", "totalCents", "createdAt", "updatedAt", "demo")
         VALUES ${rows.join(", ")}`,
        values,
      );

      const itemValues: unknown[] = [];
      const itemRows: string[] = [];
      for (const r of chunk) {
        for (const item of r.items) {
          const b = itemValues.length;
          itemValues.push(randomUUID(), r.id, item.variantId, item.materialId, item.quantity, item.dailyPriceCents);
          itemRows.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6})`);
        }
      }
      if (itemRows.length) {
        await manager.query(
          `INSERT INTO "reservation_item" ("id", "reservationId", "variantId", "materialId", "quantity", "dailyPriceCents") VALUES ${itemRows.join(", ")}`,
          itemValues,
        );
      }
    }
  });
}

export async function clearDemoHistory(): Promise<number> {
  const result = await AppDataSource.query(`DELETE FROM "reservation" WHERE "demo" RETURNING "id"`);
  return (result[0] ?? []).length ?? 0;
}

/** Remplace l'historique fictif : saison précédente complète + saison en cours jusqu'à aujourd'hui. */
export async function seedHistory(today = parisDay()): Promise<{ previous: number; current: number }> {
  const materials = await AppDataSource.getRepository(Material).find({ where: { isActive: true } });
  const catalog: CatalogItem[] = materials
    .filter((m) => m.variants.length > 0)
    .map((m) => ({ materialId: m.id, category: m.category.name, variantIds: m.variants.map((v) => v.id), dailyPriceCents: m.dailyPriceCents }));
  if (catalog.length === 0) throw new Error("Catalogue vide : lance d'abord npm run seed:demo.");

  const current = seasonOf(today).startYear;
  const previous = generateSeason(catalog, current - 1, 480, today, 2025);
  // Saison en cours : environ 12 % de demande en plus.
  const ongoing = generateSeason(catalog, current, 540, today, 2026);
  await clearDemoHistory();
  await insert([...previous, ...ongoing]);
  return { previous: previous.length, current: ongoing.length };
}

if (require.main === module) {
  (async () => {
    await AppDataSource.initialize();
    if (process.argv.includes("--clear")) {
      console.log(`[seed:history] ${await clearDemoHistory()} réservation(s) fictive(s) supprimée(s).`);
    } else {
      const { previous, current } = await seedHistory();
      console.log(`[seed:history] ${previous} réservations fictives sur la saison précédente, ${current} sur la saison en cours.`);
    }
    await AppDataSource.destroy();
  })().catch((error) => {
    console.error("[seed:history]", error);
    process.exit(1);
  });
}
