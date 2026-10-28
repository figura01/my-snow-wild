/*
 * Saison de ski : du 1er octobre au 30 avril. Les mois de mai à septembre
 * (hors saison) sont rattachés à la saison qui vient de se terminer.
 * Dates au format AAAA-MM-JJ, à l'heure de Paris.
 */

export type Season = { startYear: number; label: string; start: string; end: string };

export function season(startYear: number): Season {
  return {
    startYear,
    label: `${startYear}-${startYear + 1}`,
    start: `${startYear}-10-01`,
    end: `${startYear + 1}-04-30`,
  };
}

/** Date du jour (ou d'un instant) à Paris, AAAA-MM-JJ. */
export function parisDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function seasonOf(day: string): Season {
  const [year, month] = day.split("-").map(Number);
  return season(month >= 10 ? year : year - 1);
}

const toTime = (day: string) => Date.parse(`${day}T00:00:00Z`);
const fromTime = (time: number) => new Date(time).toISOString().slice(0, 10);

export const addDays = (day: string, days: number) => fromTime(toTime(day) + days * 86_400_000);
export const daysBetween = (from: string, to: string) => Math.round((toTime(to) - toTime(from)) / 86_400_000);

/** Même jour un an plus tôt (le 29 février devient le 28). */
export function sameDayLastYear(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const last = new Date(Date.UTC(year - 1, month - 1, date));
  if (last.getUTCMonth() !== month - 1) last.setUTCDate(0);
  return fromTime(last.getTime());
}
