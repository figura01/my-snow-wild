import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import { Material, MaterialLevel } from "../entities/Material";
import { MaterialVariant } from "../entities/MaterialVariant";
import { parseCsv, toCsv } from "../utils/csv";
import { badInput } from "../utils/errors";
import { slugify } from "../utils/slugify";
import { uniqueSlug } from "../utils/uniqueSlug";
import { maintenanceQuantities } from "./availability";
import { env } from "../config/env";
import { addMaterialImage, imageUrl, MAX_IMAGES_PER_MATERIAL } from "./images";
import { checkImageUrl, fetchRemoteImage } from "./remote-image";

/*
 * Import du catalogue depuis un fichier CSV : une ligne par taille de matériel.
 * Les champs du matériel (catégorie, prix…) sont repris de sa première ligne.
 * Un matériel déjà présent (même nom) est mis à jour ; ses tailles absentes du fichier sont conservées.
 */

export const MAX_CSV_CHARS = 500_000;
export const MAX_ROWS = 2000;

export const COLUMNS = ["nom", "categorie", "prix_jour", "taille", "stock", "niveau", "points_forts", "description", "images", "visible"] as const;
type Column = (typeof COLUMNS)[number];
const REQUIRED: Column[] = ["nom", "categorie", "prix_jour", "taille", "stock"];

const LEVELS: Record<string, MaterialLevel> = {
  "tous niveaux": MaterialLevel.ALL, tous: MaterialLevel.ALL, all: MaterialLevel.ALL,
  debutant: MaterialLevel.BEGINNER, beginner: MaterialLevel.BEGINNER,
  intermediaire: MaterialLevel.INTERMEDIATE, intermediate: MaterialLevel.INTERMEDIATE,
  confirme: MaterialLevel.EXPERT, expert: MaterialLevel.EXPERT,
};
const LEVEL_LABELS: Record<MaterialLevel, string> = {
  [MaterialLevel.ALL]: "tous niveaux",
  [MaterialLevel.BEGINNER]: "débutant",
  [MaterialLevel.INTERMEDIATE]: "intermédiaire",
  [MaterialLevel.EXPERT]: "confirmé",
};

// « Prix / jour » → « prix_jour », « Catégorie » → « categorie » : en-têtes tolérants.
const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/[\s/-]+/g, "_").replace(/_+/g, "_");

const split = (value: string) => value.split("|").map((v) => v.trim()).filter(Boolean);

export type ImportIssue = { line: number; message: string };

export type PlannedMaterial = {
  line: number;
  name: string;
  slug: string;
  categoryName: string;
  dailyPriceCents: number;
  level: MaterialLevel | null;
  features: string[];
  description: string | null;
  images: string[];
  isActive: boolean;
  sizes: { size: string; stock: number; line: number }[];
  // Calculé à l'aperçu :
  existingId: string | null;
  categoryExists: boolean;
  imagesSkipped: boolean;
};

export type ImportPlan = { materials: PlannedMaterial[]; errors: ImportIssue[]; warnings: ImportIssue[]; rows: number };

/** Analyse et valide le fichier, sans rien enregistrer. */
export async function planImport(csv: string): Promise<ImportPlan> {
  if (csv.length > MAX_CSV_CHARS) throw badInput("Fichier trop volumineux (500 Ko au maximum).");
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];

  const table = parseCsv(csv).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (table.length < 2) throw badInput("Le fichier ne contient aucune ligne de données.");
  if (table.length - 1 > MAX_ROWS) throw badInput(`${MAX_ROWS} lignes au maximum par import.`);

  const header = table[0].map(normalize);
  const index = new Map<string, number>();
  header.forEach((name, i) => {
    if ((COLUMNS as readonly string[]).includes(name)) index.set(name, i);
    else if (name) warnings.push({ line: 1, message: `Colonne « ${table[0][i].trim()} » ignorée.` });
  });
  const missing = REQUIRED.filter((c) => !index.has(c));
  if (missing.length) throw badInput(`Colonnes obligatoires manquantes : ${missing.join(", ")}.`);

  const get = (row: string[], column: Column) => (index.has(column) ? (row[index.get(column)!] ?? "").trim() : "");
  const groups = new Map<string, PlannedMaterial>();

  table.slice(1).forEach((row, i) => {
    const line = i + 2; // ligne 1 = en-tête
    const fail = (message: string) => errors.push({ line, message });

    const name = get(row, "nom");
    const categoryName = get(row, "categorie");
    const size = get(row, "taille");
    if (name.length < 2 || name.length > 120) return fail("nom : 2 à 120 caractères.");
    if (!categoryName || categoryName.length > 60) return fail("categorie : obligatoire, 60 caractères au plus.");
    if (!size || size.length > 40) return fail("taille : obligatoire, 40 caractères au plus.");

    const stock = Number(get(row, "stock"));
    if (!Number.isInteger(stock) || stock < 0 || stock > 10_000) return fail("stock : nombre entier entre 0 et 10 000.");

    const slug = slugify(name);
    if (!slug) return fail("nom : doit contenir au moins une lettre ou un chiffre.");
    const existing = groups.get(slug);
    if (existing) {
      // Ligne supplémentaire d'un matériel déjà vu : seule la taille compte.
      if (existing.sizes.some((s) => s.size.toLowerCase() === size.toLowerCase())) {
        return fail(`taille « ${size} » en double pour « ${name} » (voir ligne ${existing.sizes.find((s) => s.size.toLowerCase() === size.toLowerCase())!.line}).`);
      }
      if (existing.sizes.length >= 40) return fail("40 tailles au maximum par matériel.");
      if (categoryName.toLowerCase() !== existing.categoryName.toLowerCase()) {
        warnings.push({ line, message: `catégorie différente de la ligne ${existing.line} : celle de la ligne ${existing.line} est gardée.` });
      }
      existing.sizes.push({ size, stock, line });
      return;
    }

    const priceText = get(row, "prix_jour").replace(/\s|€/g, "").replace(",", ".");
    const price = Number(priceText);
    if (!priceText || !Number.isFinite(price) || price < 0 || price > 100_000) return fail("prix_jour : montant en euros (ex. 25 ou 25,50).");
    if (Math.round(price * 100) !== Number((price * 100).toFixed(4))) return fail("prix_jour : deux décimales au plus.");

    const levelText = normalize(get(row, "niveau")).replace(/_/g, " ");
    const level = levelText ? LEVELS[levelText] : null;
    if (levelText && !level) return fail("niveau : tous niveaux, débutant, intermédiaire ou confirmé.");

    const features = split(get(row, "points_forts"));
    if (features.length > 12) return fail("points_forts : 12 au maximum (séparés par « | »).");
    if (features.some((f) => f.length > 120)) return fail("points_forts : 120 caractères au plus chacun.");

    const description = get(row, "description");
    if (description.length > 2000) return fail("description : 2 000 caractères au plus.");

    const images = split(get(row, "images"));
    if (images.length > MAX_IMAGES_PER_MATERIAL) return fail(`images : ${MAX_IMAGES_PER_MATERIAL} au maximum (séparées par « | »).`);
    for (const url of images) {
      try {
        checkImageUrl(url);
      } catch (error) {
        return fail(`images : « ${url.slice(0, 60)} » refusée (${(error as Error).message}).`);
      }
    }

    const visibleText = normalize(get(row, "visible"));
    if (visibleText && !["oui", "non", "true", "false", "1", "0"].includes(visibleText)) return fail("visible : oui ou non.");

    groups.set(slug, {
      line, name, slug, categoryName,
      dailyPriceCents: Math.round(price * 100),
      level: level ?? null, features, description: description || null, images,
      isActive: !["non", "false", "0"].includes(visibleText),
      sizes: [{ size, stock, line }],
      existingId: null, categoryExists: false, imagesSkipped: false,
    });
  });

  const materials = [...groups.values()];

  // Comparaison avec la base : création ou mise à jour, catégories à créer, photos déjà présentes.
  const categories = await AppDataSource.getRepository(Category).find();
  const existing = materials.length
    ? await AppDataSource.getRepository(Material).find({ where: materials.map((m) => ({ slug: m.slug })) })
    : [];
  const bySlug = new Map(existing.map((m) => [m.slug, m]));
  const inMaintenance = await maintenanceQuantities(existing.flatMap((m) => m.variants.map((v) => v.id)));

  for (const planned of materials) {
    planned.categoryExists = categories.some((c) => c.name.toLowerCase() === planned.categoryName.toLowerCase());
    const current = bySlug.get(planned.slug);
    if (!current) continue;
    planned.existingId = current.id;
    planned.imagesSkipped = planned.images.length > 0 && current.images.length > 0;
    if (planned.imagesSkipped) {
      warnings.push({ line: planned.line, message: `« ${planned.name} » a déjà des photos : la colonne images est ignorée.` });
    }
    for (const size of planned.sizes) {
      const variant = current.variants.find((v) => v.size.toLowerCase() === size.size.toLowerCase());
      const blocked = variant ? inMaintenance.get(variant.id) ?? 0 : 0;
      if (size.stock < blocked) {
        errors.push({ line: size.line, message: `stock : ${blocked} exemplaire(s) de « ${planned.name} » en ${size.size} sont en maintenance, le stock ne peut pas être inférieur.` });
      }
    }
  }

  errors.sort((a, b) => a.line - b.line);
  return { materials, errors, warnings, rows: table.length - 1 };
}

export type ImportResult = {
  created: number;
  updated: number;
  categoriesCreated: number;
  imagesAdded: number;
  warnings: ImportIssue[];
};

/** Enregistre l'import : tout ou rien pour les données ; les photos sont ajoutées ensuite, une par une. */
export async function runImport(csv: string): Promise<ImportResult> {
  const plan = await planImport(csv);
  if (plan.errors.length) throw badInput(`Le fichier contient ${plan.errors.length} erreur(s) : corrigez-les avant d'importer.`);

  const result: ImportResult = { created: 0, updated: 0, categoriesCreated: 0, imagesAdded: 0, warnings: [...plan.warnings] };
  const imageJobs: { materialId: string; name: string; urls: string[]; line: number }[] = [];

  await AppDataSource.transaction(async (manager) => {
    const categoryRepo = manager.getRepository(Category);
    const materialRepo = manager.getRepository(Material);
    const variantRepo = manager.getRepository(MaterialVariant);
    const categories = await categoryRepo.find();

    for (const planned of plan.materials) {
      let category = categories.find((c) => c.name.toLowerCase() === planned.categoryName.toLowerCase());
      if (!category) {
        category = await categoryRepo.save(
          categoryRepo.create({ name: planned.categoryName, slug: await uniqueSlug(categoryRepo, planned.categoryName) }),
        );
        categories.push(category);
        result.categoriesCreated++;
      }

      const fields = {
        name: planned.name,
        category,
        dailyPriceCents: planned.dailyPriceCents,
        level: planned.level,
        features: planned.features,
        description: planned.description,
        isActive: planned.isActive,
      };

      let material = planned.existingId ? await materialRepo.findOneBy({ id: planned.existingId }) : null;
      if (material) {
        await materialRepo.update(material.id, fields);
        let position = Math.max(-1, ...material.variants.map((v) => v.position));
        for (const size of planned.sizes) {
          const variant = material.variants.find((v) => v.size.toLowerCase() === size.size.toLowerCase());
          if (variant) await variantRepo.update(variant.id, { stock: size.stock });
          else await variantRepo.save(variantRepo.create({ material: { id: material.id }, size: size.size, stock: size.stock, position: ++position }));
        }
        result.updated++;
      } else {
        material = await materialRepo.save(
          materialRepo.create({
            ...fields,
            slug: planned.slug,
            variants: planned.sizes.map((s, position) => variantRepo.create({ size: s.size, stock: s.stock, position })),
          }),
        );
        result.created++;
      }

      if (planned.images.length && !planned.imagesSkipped) {
        imageJobs.push({ materialId: material.id, name: planned.name, urls: planned.images, line: planned.line });
      }
    }
  });

  // Photos : téléchargées puis envoyées au stockage. Un échec n'annule pas l'import, il est signalé.
  for (const job of imageJobs) {
    for (const url of job.urls) {
      try {
        await addMaterialImage(job.materialId, await fetchRemoteImage(url), job.name);
        result.imagesAdded++;
      } catch (error) {
        result.warnings.push({ line: job.line, message: `photo « ${url.slice(0, 60)} » non importée : ${(error as Error).message}` });
      }
    }
  }
  return result;
}

/** Export du catalogue au même format (réimportable), une ligne par taille. */
export async function exportCatalog(): Promise<string> {
  const materials = await AppDataSource.getRepository(Material).find({ order: { name: "ASC" } });
  const rows: string[][] = [[...COLUMNS]];
  for (const m of materials) {
    // Adresses complètes des photos, pour qu'un réimport ailleurs puisse les récupérer.
    const images = [...m.images]
      .sort((a, b) => a.position - b.position)
      .map((i) => {
        const url = imageUrl(i, "large");
        return url.startsWith("/") ? `${env.frontendUrl}${url}` : url;
      });
    for (const v of [...m.variants].sort((a, b) => a.position - b.position)) {
      rows.push([
        m.name,
        m.category.name,
        (m.dailyPriceCents / 100).toFixed(2).replace(".", ","),
        v.size,
        String(v.stock),
        m.level ? LEVEL_LABELS[m.level] : "",
        m.features.join(" | "),
        m.description ?? "",
        images.join(" | "),
        m.isActive ? "oui" : "non",
      ]);
    }
  }
  return toCsv(rows);
}

/** Modèle à remplir : en-têtes et deux lignes d'exemple. */
export function importTemplate(): string {
  return toCsv([
    [...COLUMNS],
    ["Ski Freeride", "Skis", "35", "178 cm", "2", "confirmé", "Spatule large | Flottaison en poudreuse", "Pour la neige fraîche.", "https://exemple.com/photo-ski.jpg", "oui"],
    ["Ski Freeride", "Skis", "35", "186 cm", "1", "", "", "", "", ""],
  ]);
}
