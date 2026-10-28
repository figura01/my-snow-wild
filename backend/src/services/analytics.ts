import { AppDataSource } from "../data-source";
import { badInput } from "../utils/errors";
import { addDays, daysBetween, parisDay, sameDayLastYear, season, seasonOf, type Season } from "../utils/season";

/*
 * Tableau de bord du back-office : agrégats calculés en SQL, par saison
 * (1er octobre → 30 avril), comparés à la saison précédente au même moment.
 * Le chiffre d'affaires est compté à la date de paiement (TTC payé).
 */

// Jour de paiement / de commande, à l'heure de Paris.
const PAID_DAY = `(r."paidAt" AT TIME ZONE 'Europe/Paris')::date`;
// createdAt est un horodatage sans fuseau, enregistré en UTC.
const CREATED_DAY = `((r."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris')::date`;

export type Kpis = {
  revenueCents: number;
  paidCount: number;
  averageBasketCents: number;
  fillRate: number; // part de la capacité de la saison (exemplaires × jours) déjà réservée, 0 → 1
};

export type WeekPoint = { week: number; weekStart: string; current: number | null; previous: number | null };
export type MaterialStat = { id: string; name: string; category: string; rentalDays: number; revenueCents: number };
export type CategoryStat = { name: string; rentalDays: number; revenueCents: number };
export type Outcomes = { paid: number; pending: number; expired: number; cancelled: number };

export type Dashboard = {
  season: Season;
  previousSeason: Season;
  asOf: string;
  previousAsOf: string;
  isCurrent: boolean;
  seasons: Season[];
  current: Kpis;
  previous: Kpis;
  weeks: WeekPoint[];
  materials: MaterialStat[];
  categories: CategoryStat[];
  outcomes: Outcomes;
  demoReservations: number;
};

const num = (value: unknown) => Number(value ?? 0);

async function totalStock(): Promise<number> {
  const [row] = await AppDataSource.query(
    `SELECT COALESCE(SUM(v."stock"), 0) AS stock FROM "material_variant" v JOIN "material" m ON m."id" = v."materialId" WHERE m."isActive"`,
  );
  return num(row.stock);
}

async function kpis(s: Season, asOf: string, stock: number): Promise<Kpis> {
  const [sales] = await AppDataSource.query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(r."totalCents"), 0) AS revenue
     FROM "reservation" r WHERE r."status" = 'PAID' AND ${PAID_DAY} BETWEEN $1 AND $2`,
    [s.start, asOf],
  );
  // Exemplaires × jours de location tombant dans la saison, pour les réservations payées à cette date.
  const [booked] = await AppDataSource.query(
    `SELECT COALESCE(SUM(i."quantity" * (LEAST(r."endDate", $2::date) - GREATEST(r."startDate", $1::date) + 1)), 0) AS days
     FROM "reservation_item" i JOIN "reservation" r ON r."id" = i."reservationId"
     WHERE r."status" = 'PAID' AND ${PAID_DAY} <= $3 AND r."startDate" <= $2 AND r."endDate" >= $1`,
    [s.start, s.end, asOf],
  );
  const capacity = stock * (daysBetween(s.start, s.end) + 1);
  const paidCount = num(sales.count);
  const revenueCents = num(sales.revenue);
  return {
    revenueCents,
    paidCount,
    averageBasketCents: paidCount ? Math.round(revenueCents / paidCount) : 0,
    fillRate: capacity ? num(booked.days) / capacity : 0,
  };
}

/** Chiffre d'affaires par semaine depuis le début de la saison (index → centimes). */
async function weeklyRevenue(s: Season, asOf: string): Promise<Map<number, number>> {
  const rows: { week: number; revenue: string }[] = await AppDataSource.query(
    `SELECT FLOOR((${PAID_DAY} - $1::date) / 7)::int AS week, SUM(r."totalCents") AS revenue
     FROM "reservation" r WHERE r."status" = 'PAID' AND ${PAID_DAY} BETWEEN $1 AND $2
     GROUP BY 1`,
    [s.start, asOf],
  );
  return new Map(rows.map((row) => [row.week, num(row.revenue)]));
}

function cumulative(byWeek: Map<number, number>, weeks: number, lastWeek: number): (number | null)[] {
  let total = 0;
  return Array.from({ length: weeks }, (_, week) => {
    if (week > lastWeek) return null;
    total += byWeek.get(week) ?? 0;
    return total;
  });
}

async function materialStats(s: Season, asOf: string): Promise<MaterialStat[]> {
  const rows: { id: string; name: string; category: string; days: string; revenue: string }[] = await AppDataSource.query(
    `SELECT m."id", m."name", c."name" AS category,
            SUM(i."quantity" * (r."endDate" - r."startDate" + 1)) AS days,
            SUM(i."quantity" * (r."endDate" - r."startDate" + 1) * i."dailyPriceCents") AS revenue
     FROM "reservation_item" i
     JOIN "reservation" r ON r."id" = i."reservationId"
     JOIN "material" m ON m."id" = i."materialId"
     JOIN "category" c ON c."id" = m."categoryId"
     WHERE r."status" = 'PAID' AND ${PAID_DAY} BETWEEN $1 AND $2
     GROUP BY m."id", m."name", c."name"
     ORDER BY revenue DESC, m."name"`,
    [s.start, asOf],
  );
  return rows.map((row) => ({ id: row.id, name: row.name, category: row.category, rentalDays: num(row.days), revenueCents: num(row.revenue) }));
}

async function outcomes(s: Season, asOf: string): Promise<Outcomes> {
  const rows: { status: string; stale: boolean; count: string }[] = await AppDataSource.query(
    `SELECT r."status", (r."status" = 'PENDING' AND r."expiresAt" <= now()) AS stale, COUNT(*) AS count
     FROM "reservation" r WHERE r."status" <> 'DRAFT' AND ${CREATED_DAY} BETWEEN $1 AND $2
     GROUP BY 1, 2`,
    [s.start, asOf],
  );
  const result: Outcomes = { paid: 0, pending: 0, expired: 0, cancelled: 0 };
  for (const row of rows) {
    const count = num(row.count);
    if (row.status === "PAID") result.paid += count;
    else if (row.status === "CANCELLED") result.cancelled += count;
    else if (row.status === "EXPIRED" || row.stale) result.expired += count;
    else result.pending += count;
  }
  return result;
}

/** Saisons proposées : de la plus ancienne ayant un paiement jusqu'à la saison en cours. */
async function availableSeasons(current: Season): Promise<Season[]> {
  const [row] = await AppDataSource.query(`SELECT MIN(${PAID_DAY}) AS first FROM "reservation" r WHERE r."status" = 'PAID'`);
  const first = row.first ? seasonOf(parisDay(new Date(row.first))).startYear : current.startYear;
  const seasons: Season[] = [];
  for (let year = current.startYear; year >= Math.min(first, current.startYear); year--) seasons.push(season(year));
  return seasons;
}

export async function buildDashboard(startYear?: number | null, today = parisDay()): Promise<Dashboard> {
  const currentSeason = seasonOf(today);
  const s = season(startYear ?? currentSeason.startYear);
  if (s.startYear > currentSeason.startYear) throw badInput("Cette saison n'a pas encore commencé.");
  if (s.startYear < currentSeason.startYear - 20) throw badInput("Saison trop ancienne.");

  const isCurrent = s.startYear === currentSeason.startYear;
  const asOf = isCurrent && today < s.end ? today : s.end;
  const previousSeason = season(s.startYear - 1);
  const previousAsOf = asOf === s.end ? previousSeason.end : sameDayLastYear(asOf);

  const stock = await totalStock();
  const weekCount = Math.floor(daysBetween(s.start, s.end) / 7) + 1;
  const [current, previous, currentWeeks, previousWeeks, materials, outcomesResult, seasons, demo] = await Promise.all([
    kpis(s, asOf, stock),
    kpis(previousSeason, previousAsOf, stock),
    weeklyRevenue(s, asOf),
    weeklyRevenue(previousSeason, previousSeason.end),
    materialStats(s, asOf),
    outcomes(s, asOf),
    availableSeasons(currentSeason),
    AppDataSource.query(`SELECT COUNT(*) AS count FROM "reservation" r WHERE r."demo" AND ${PAID_DAY} BETWEEN $1 AND $2`, [previousSeason.start, s.end]),
  ]);

  const currentSeries = cumulative(currentWeeks, weekCount, Math.floor(daysBetween(s.start, asOf) / 7));
  const previousSeries = cumulative(previousWeeks, weekCount, weekCount - 1);

  const categories = new Map<string, CategoryStat>();
  for (const m of materials) {
    const c = categories.get(m.category) ?? { name: m.category, rentalDays: 0, revenueCents: 0 };
    c.rentalDays += m.rentalDays;
    c.revenueCents += m.revenueCents;
    categories.set(m.category, c);
  }

  return {
    season: s,
    previousSeason,
    asOf,
    previousAsOf,
    isCurrent,
    seasons,
    current,
    previous,
    weeks: currentSeries.map((value, week) => ({
      week,
      weekStart: addDays(s.start, week * 7),
      current: value,
      previous: previousSeries[week],
    })),
    materials,
    categories: [...categories.values()].sort((a, b) => b.revenueCents - a.revenueCents),
    outcomes: outcomesResult,
    demoReservations: num(demo[0].count),
  };
}
