import { badInput } from "./errors";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Nombre de jours facturés, bornes incluses (du 10 au 12 = 3 jours). */
export function countDays(start: string, end: string): number {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

export const MAX_RENTAL_DAYS = 60;

/** Vérifie une période de location ; renvoie null si aucune date n'est fournie. */
export function parsePeriod(start?: string | null, end?: string | null) {
  if (!start && !end) return null;
  if (!start || !end) throw badInput("Indique une date de début et une date de fin.");
  if (!isIsoDate(start) || !isIsoDate(end)) throw badInput("Dates invalides (format AAAA-MM-JJ).");
  if (start < todayIso()) throw badInput("La date de début ne peut pas être passée.");
  if (end < start) throw badInput("La date de fin doit être après la date de début.");
  if (countDays(start, end) > MAX_RENTAL_DAYS) {
    throw badInput(`La location est limitée à ${MAX_RENTAL_DAYS} jours.`);
  }
  return { start, end, days: countDays(start, end) };
}
