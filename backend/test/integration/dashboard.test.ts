import { AppDataSource } from "../../src/data-source";
import { Reservation } from "../../src/entities/Reservation";
import { buildDashboard } from "../../src/services/analytics";
import { buildQuote } from "../../src/services/quote";
import { allReservations } from "../../src/services/reservations";
import { clearDemoHistory, demand, generateSeason, seedHistory, type CatalogItem } from "../../src/seed-history";
import { closeDb, createMaterial, createUser, gql, inDays, insertReservation, openDb, resetDb, ReservationStatus } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

const repo = () => AppDataSource.getRepository(Reservation);

/** Réservation payée à une date donnée (heure de Paris), pour une période donnée. */
async function paid(material: Awaited<ReturnType<typeof createMaterial>>, opts: { paidOn: string; start: string; end: string; quantity?: number; status?: ReservationStatus }) {
  const user = await createUser();
  const r = await insertReservation({
    user, variant: material.variants[0], material: material.material, start: opts.start, end: opts.end,
    quantity: opts.quantity ?? 1, status: opts.status ?? ReservationStatus.PAID,
  });
  const days = Math.round((Date.parse(opts.end) - Date.parse(opts.start)) / 86_400_000) + 1;
  await repo().update(r.id, {
    totalCents: material.material.dailyPriceCents * (opts.quantity ?? 1) * days,
    paidAt: opts.status && opts.status !== ReservationStatus.PAID ? null : new Date(`${opts.paidOn}T10:00:00+01:00`),
  });
  await AppDataSource.query(`UPDATE "reservation" SET "createdAt" = $2 WHERE "id" = $1`, [r.id, `${opts.paidOn} 08:00:00`]);
  return r;
}

describe("tableau de bord", () => {
  it("calcule les KPI de la saison et les compare à la saison précédente au même moment", async () => {
    const ski = await createMaterial({ M: 10 }, 2000); // 20 €/jour, 10 exemplaires
    // Saison précédente : une vente avant le 28/10, une après (hors comparaison).
    await paid(ski, { paidOn: "2025-10-20", start: "2025-12-27", end: "2025-12-28" }); // 40 €
    await paid(ski, { paidOn: "2025-11-15", start: "2026-02-10", end: "2026-02-14" }); // 100 €
    // Saison en cours.
    await paid(ski, { paidOn: "2026-10-05", start: "2026-12-26", end: "2026-12-30", quantity: 2 }); // 200 €
    await paid(ski, { paidOn: "2026-10-27", start: "2027-02-13", end: "2027-02-13" }); // 20 €
    await paid(ski, { paidOn: "2026-10-27", start: "2027-02-13", end: "2027-02-13", status: ReservationStatus.EXPIRED });

    const d = await buildDashboard(null, "2026-10-28");
    expect(d.season.label).toBe("2026-2027");
    expect(d.isCurrent).toBe(true);
    expect([d.asOf, d.previousAsOf]).toEqual(["2026-10-28", "2025-10-28"]);

    expect(d.current).toMatchObject({ revenueCents: 22000, paidCount: 2, averageBasketCents: 11000 });
    expect(d.previous).toMatchObject({ revenueCents: 4000, paidCount: 1 });
    // Remplissage : 11 exemplaires-jours réservés / (10 exemplaires × 212 jours).
    expect(d.current.fillRate).toBeCloseTo(11 / (10 * 212), 6);

    // Courbe cumulée : la saison en cours s'arrête à la semaine du jour, la précédente va jusqu'au bout.
    expect(d.weeks).toHaveLength(31);
    expect(d.weeks[0]).toMatchObject({ weekStart: "2026-10-01", current: 20000, previous: 0 });
    expect(d.weeks[3]).toMatchObject({ current: 22000, previous: 4000 });
    expect(d.weeks[4].current).toBeNull();
    expect(d.weeks[30].previous).toBe(14000);

    expect(d.materials).toEqual([expect.objectContaining({ rentalDays: 11, revenueCents: 22000 })]);
    expect(d.outcomes).toEqual({ paid: 2, pending: 0, expired: 1, cancelled: 0 });
    expect(d.seasons.map((s) => s.label)).toEqual(["2026-2027", "2025-2026"]);
  });

  it("affiche une saison terminée en entier", async () => {
    const ski = await createMaterial({ M: 10 }, 2000);
    await paid(ski, { paidOn: "2026-03-01", start: "2026-03-02", end: "2026-03-02" });
    const d = await buildDashboard(2025, "2026-10-28");
    expect(d.isCurrent).toBe(false);
    expect([d.asOf, d.previousAsOf]).toEqual(["2026-04-30", "2025-04-30"]);
    expect(d.current.revenueCents).toBe(2000);
    await expect(buildDashboard(2027, "2026-10-28")).rejects.toThrow(/pas encore commencé/);
  });

  it("est réservé aux administrateurs", async () => {
    const res = await gql("{ adminDashboard { asOf } }", {}, await createUser());
    expect(res.errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED");
  });
});

describe("historique fictif (seed:history)", () => {
  const catalog: CatalogItem[] = [
    { materialId: "m-ski", category: "Skis", variantIds: ["v1", "v2"], dailyPriceCents: 2500 },
    { materialId: "m-casque", category: "Casques", variantIds: ["v3"], dailyPriceCents: 500 },
  ];

  it("est reproductible et ne crée que des commandes déjà passées", () => {
    const strip = (list: ReturnType<typeof generateSeason>) => list.map(({ id, ...r }) => r);
    const a = generateSeason(catalog, 2026, 300, "2026-10-28", 7);
    expect(strip(a)).toEqual(strip(generateSeason(catalog, 2026, 300, "2026-10-28", 7)));
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeLessThan(300);
    expect(a.every((r) => r.createdAt.getTime() <= Date.parse("2026-10-29T00:00:00+01:00"))).toBe(true);
  });

  it("met les vacances de février bien au-dessus de novembre", () => {
    expect(demand("2026-02-14")).toBeGreaterThan(demand("2025-11-15") * 10);
  });

  it("n'occupe aucun matériel réel, n'apparaît pas dans les listes et se supprime seule", async () => {
    const real = await createMaterial({ M: 1 }, 2000);
    await paid(real, { paidOn: "2026-10-01", start: inDays(30), end: inDays(31) }); // vraie réservation

    const result = await seedHistory("2026-10-28");
    expect(result.previous).toBe(480);
    expect(await repo().countBy({ demo: true })).toBe(result.previous + result.current);

    // Aucun exemplaire n'est bloqué par l'historique fictif.
    const quote = await buildQuote(inDays(40), inDays(41), [{ variantId: real.variants[0].id, quantity: 1 }]);
    expect(quote.valid).toBe(true);
    expect((await allReservations()).every((r) => !r.demo)).toBe(true);
    expect(await allReservations()).toHaveLength(1);

    await clearDemoHistory();
    expect(await repo().countBy({ demo: true })).toBe(0);
    expect(await repo().count()).toBe(1); // la vraie réservation est intacte
  });
});
