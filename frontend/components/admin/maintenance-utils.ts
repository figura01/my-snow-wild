import type { Maintenance } from "@/lib/types";

const day = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export const formatDate = (value: string) =>
  day.format(new Date(value.length === 10 ? `${value}T12:00:00` : value));

/** Retour prévu dépassé alors que la maintenance est toujours en cours. */
export const isLate = (m: Pick<Maintenance, "isActive" | "expectedReturnDate">) =>
  m.isActive && !!m.expectedReturnDate && m.expectedReturnDate < new Date().toISOString().slice(0, 10);
