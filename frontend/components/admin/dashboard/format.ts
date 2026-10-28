// Formats du tableau de bord.

const euros0 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const decimal1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const percent1 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("fr-FR");

/** 1 234 567 c → « 12 346 € » */
export const euros = (cents: number) => euros0.format(Math.round(cents / 100));

/** Pour les axes et étiquettes : « 850 € », « 12,5 k€ ». */
export function compactEuros(cents: number): string {
  const value = cents / 100;
  if (Math.abs(value) >= 1000) return `${decimal1.format(value / 1000)} k€`;
  return `${integer.format(Math.round(value))} €`;
}

export const percent = (ratio: number) => percent1.format(ratio);
export const count = (n: number) => integer.format(n);

const months = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const monthLabel = (iso: string) => months.format(utc(iso)).replace(".", "");
export const dayMonthLabel = (iso: string) => dayMonth.format(utc(iso));
export const fullDateLabel = (iso: string) => fullDate.format(utc(iso));

export type Delta = { text: string; direction: "up" | "down" | "flat" };

/** Évolution relative : « +12,4 % » ; sans base de comparaison : « nouveau ». */
export function relativeDelta(current: number, previous: number): Delta {
  if (previous === 0) return current === 0 ? { text: "=", direction: "flat" } : { text: "nouveau", direction: "up" };
  const change = (current - previous) / previous;
  if (Math.abs(change) < 0.0005) return { text: "=", direction: "flat" };
  return { text: `${change > 0 ? "+" : "−"}${percent1.format(Math.abs(change))}`, direction: change > 0 ? "up" : "down" };
}

/** Évolution d'un taux, en points : « +3,2 pts ». */
export function pointsDelta(current: number, previous: number): Delta {
  const diff = (current - previous) * 100;
  if (Math.abs(diff) < 0.05) return { text: "=", direction: "flat" };
  return { text: `${diff > 0 ? "+" : "−"}${decimal1.format(Math.abs(diff))} pt${Math.abs(diff) >= 2 ? "s" : ""}`, direction: diff > 0 ? "up" : "down" };
}
