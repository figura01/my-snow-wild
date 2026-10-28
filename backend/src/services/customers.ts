import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Customer, CustomerSource } from "../entities/Customer";
import { normalizeHeader, parseCsv, toCsv } from "../utils/csv";
import { badInput } from "../utils/errors";

/*
 * Fichier clients (CSV) : import et export depuis le back-office.
 * Ne contient que des fiches clients : jamais de mot de passe ni de donnée de connexion.
 * - Une ligne dont l'e-mail correspond à une fiche sans compte la met à jour
 *   (une cellule vide garde la valeur existante).
 * - Une ligne dont l'e-mail correspond à un client inscrit est ignorée : ses
 *   coordonnées sont gérées par le client lui-même, depuis son profil.
 * - Sinon, une fiche est créée (sans compte).
 */

export const MAX_CSV_CHARS = 500_000;
export const MAX_ROWS = 5000;

export const CUSTOMER_COLUMNS = ["email", "prenom", "nom", "telephone", "adresse", "code_postal", "ville"] as const;
type Column = (typeof CUSTOMER_COLUMNS)[number];
const REQUIRED: Column[] = ["email", "prenom", "nom"];
// Colonnes ajoutées par l'export : ignorées sans avertissement à l'import (aller-retour).
const EXPORT_ONLY = ["compte", "origine", "cree_le", "reservations", "total_paye"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9 +().-]{6,20}$/;
const POSTAL_CODE = /^\d{5}$/;

export type CustomerIssue = { line: number; message: string };

export type PlannedCustomer = {
  line: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  action: "create" | "update" | "skip";
  existingId: string | null;
};

export type CustomerImportPlan = {
  rows: number;
  customers: PlannedCustomer[];
  errors: CustomerIssue[];
  warnings: CustomerIssue[];
};

/** Analyse et valide le fichier, sans rien enregistrer. */
export async function planCustomerImport(csv: string): Promise<CustomerImportPlan> {
  if (csv.length > MAX_CSV_CHARS) throw badInput("Fichier trop volumineux (500 Ko au maximum).");
  const errors: CustomerIssue[] = [];
  const warnings: CustomerIssue[] = [];

  const table = parseCsv(csv).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (table.length < 2) throw badInput("Le fichier ne contient aucune ligne de données.");
  if (table.length - 1 > MAX_ROWS) throw badInput(`${MAX_ROWS} lignes au maximum par import.`);

  const index = new Map<string, number>();
  table[0].map(normalizeHeader).forEach((name, i) => {
    if ((CUSTOMER_COLUMNS as readonly string[]).includes(name)) index.set(name, i);
    else if (name && !EXPORT_ONLY.includes(name)) warnings.push({ line: 1, message: `Colonne « ${table[0][i].trim()} » ignorée.` });
  });
  const missing = REQUIRED.filter((c) => !index.has(c));
  if (missing.length) throw badInput(`Colonnes obligatoires manquantes : ${missing.join(", ")}.`);
  const get = (row: string[], column: Column) => (index.has(column) ? (row[index.get(column)!] ?? "").trim() : "");

  const planned: PlannedCustomer[] = [];
  const seen = new Map<string, number>();

  table.slice(1).forEach((row, i) => {
    const line = i + 2;
    const fail = (message: string) => errors.push({ line, message });

    const email = get(row, "email").toLowerCase();
    if (!EMAIL.test(email) || email.length > 254) return fail("email : adresse invalide.");
    if (seen.has(email)) return fail(`email « ${email} » déjà présent ligne ${seen.get(email)}.`);

    const firstName = get(row, "prenom");
    const lastName = get(row, "nom");
    if (!firstName || firstName.length > 100) return fail("prenom : obligatoire, 100 caractères au plus.");
    if (!lastName || lastName.length > 100) return fail("nom : obligatoire, 100 caractères au plus.");

    const phone = get(row, "telephone");
    if (phone && !PHONE.test(phone)) return fail("telephone : 6 à 20 chiffres, espaces, + ( ) . -");
    const address = get(row, "adresse");
    if (address && (address.length < 3 || address.length > 200)) return fail("adresse : 3 à 200 caractères.");
    const postalCode = get(row, "code_postal");
    if (postalCode && !POSTAL_CODE.test(postalCode)) return fail("code_postal : 5 chiffres.");
    const city = get(row, "ville");
    if (city.length > 100) return fail("ville : 100 caractères au plus.");

    seen.set(email, line);
    planned.push({
      line, email, firstName, lastName,
      phone: phone || null, address: address || null, postalCode: postalCode || null, city: city || null,
      action: "create", existingId: null,
    });
  });

  // Fiches existantes avec ces adresses (avec ou sans compte).
  const emails = planned.map((p) => p.email);
  const existing = emails.length
    ? await AppDataSource.getRepository(Customer).find({
        where: { email: In(emails) },
        relations: { user: true },
        order: { createdAt: "ASC" },
      })
    : [];
  for (const p of planned) {
    const matches = existing.filter((c) => c.email === p.email);
    if (matches.some((c) => c.user)) {
      p.action = "skip";
      warnings.push({ line: p.line, message: `${p.email} a un compte client : ses coordonnées sont gérées par le client, ligne ignorée.` });
    } else if (matches.length) {
      p.action = "update";
      p.existingId = matches[0].id;
    }
  }

  return { rows: table.length - 1, customers: planned, errors, warnings };
}

export type CustomerImportResult = { created: number; updated: number; skipped: number };

/** Importe le fichier : tout ou rien. Refusé s'il reste des erreurs. */
export async function runCustomerImport(csv: string): Promise<CustomerImportResult> {
  const plan = await planCustomerImport(csv);
  if (plan.errors.length) throw badInput(`Le fichier contient ${plan.errors.length} erreur(s) : corrigez-les avant l'import.`);

  const result: CustomerImportResult = { created: 0, updated: 0, skipped: 0 };
  await AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(Customer);
    for (const p of plan.customers) {
      if (p.action === "skip") {
        result.skipped++;
      } else if (p.action === "update") {
        const customer = await repo.findOneByOrFail({ id: p.existingId! });
        Object.assign(customer, {
          firstName: p.firstName,
          lastName: p.lastName,
          // Cellule vide : la valeur déjà connue est conservée.
          phone: p.phone ?? customer.phone,
          address: p.address ?? customer.address,
          postalCode: p.postalCode ?? customer.postalCode,
          city: p.city ?? customer.city,
        });
        await repo.save(customer);
        result.updated++;
      } else {
        await repo.save(
          repo.create({
            email: p.email, firstName: p.firstName, lastName: p.lastName,
            phone: p.phone, address: p.address, postalCode: p.postalCode, city: p.city,
            source: CustomerSource.IMPORT,
          }),
        );
        result.created++;
      }
    }
  });
  return result;
}

export type CustomerRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  source: CustomerSource;
  createdAt: Date;
  hasAccount: boolean;
  reservationCount: number;
  paidCents: number;
};

/** Toutes les fiches, avec leur compte éventuel et le résumé de leurs réservations. */
export async function listCustomers(): Promise<CustomerRow[]> {
  const rows: (Omit<CustomerRow, "hasAccount" | "reservationCount" | "paidCents"> & {
    userId: string | null;
    reservationCount: string;
    paidCents: string;
  })[] = await AppDataSource.query(`
    SELECT c."id", c."email", c."firstName", c."lastName", c."phone", c."address", c."postalCode", c."city",
           c."source", c."createdAt", u."id" AS "userId",
           COUNT(r."id") FILTER (WHERE r."status" <> 'DRAFT') AS "reservationCount",
           COALESCE(SUM(r."totalCents") FILTER (WHERE r."status" = 'PAID'), 0) AS "paidCents"
    FROM "customer" c
    LEFT JOIN "user" u ON u."customerId" = c."id"
    LEFT JOIN "reservation" r ON r."userId" = u."id"
    GROUP BY c."id", u."id"
    ORDER BY lower(c."lastName"), lower(c."firstName"), c."createdAt"`);
  return rows.map(({ userId, reservationCount, paidCents, ...c }) => ({
    ...c,
    hasAccount: userId !== null,
    reservationCount: Number(reservationCount),
    paidCents: Number(paidCents),
  }));
}

const SOURCE_LABELS: Record<CustomerSource, string> = {
  [CustomerSource.SIGNUP]: "inscription",
  [CustomerSource.IMPORT]: "import",
};

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
const euros = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

/** Export au format d'import, plus quelques colonnes d'information (ignorées au réimport). */
export async function exportCustomers(): Promise<string> {
  const rows: string[][] = [[...CUSTOMER_COLUMNS, ...EXPORT_ONLY]];
  for (const c of await listCustomers()) {
    rows.push([
      c.email, c.firstName, c.lastName, c.phone ?? "", c.address ?? "", c.postalCode ?? "", c.city ?? "",
      c.hasAccount ? "oui" : "non",
      SOURCE_LABELS[c.source],
      formatDay(c.createdAt),
      String(c.reservationCount),
      euros(c.paidCents),
    ]);
  }
  return toCsv(rows);
}

export function customerImportTemplate(): string {
  return toCsv([
    [...CUSTOMER_COLUMNS],
    ["camille.martin@exemple.fr", "Camille", "Martin", "06 12 34 56 78", "4 rue des Alpes", "73000", "Chambéry"],
    ["sam.durand@exemple.fr", "Sam", "Durand", "", "", "", ""],
  ]);
}
