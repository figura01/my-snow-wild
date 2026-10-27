// Données de démonstration pour le développement.
// Lancement : docker compose exec backend npm run seed:demo
// Idempotent : relancer le script ne crée pas de doublons.
import "reflect-metadata";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { AppDataSource } from "./data-source";
import { Category } from "./entities/Category";
import { Material, MaterialLevel } from "./entities/Material";
import { MaterialVariant } from "./entities/MaterialVariant";
import { addMaterialImage } from "./services/images";
import { slugify } from "./utils/slugify";

// Visuels de démonstration (un par matériel, nommés d'après son slug) : backend/seed-images.
const SEED_IMAGES = path.resolve(__dirname, "..", "seed-images");

type Item = {
  name: string;
  price: number;
  description: string;
  sizes: Record<string, number>;
  level?: MaterialLevel;
  features?: string[];
};

const { ALL, BEGINNER, INTERMEDIATE, EXPERT } = MaterialLevel;

// Niveau conseillé et points forts, ajoutés aussi aux matériels déjà créés qui n'en ont pas.
const DETAILS: Record<string, Pick<Item, "level" | "features">> = {
  "Ski All Mountain": { level: INTERMEDIATE, features: ["Rocker en spatule : virages faciles", "Polyvalent piste et bord de piste", "Fixations réglées à votre poids et niveau", "Fartage et affûtage avant chaque location"] },
  "Ski piste Performance": { level: EXPERT, features: ["Cambre classique, accroche sur neige dure", "Carres affûtées pour le carving", "Fixations réglées à votre poids et niveau"] },
  "Ski junior": { level: BEGINNER, features: ["Léger et facile à tourner", "Fixations enfant à déclenchement doux", "Idéal pour l'école de ski"] },
  "Snowboard Freestyle": { level: INTERMEDIATE, features: ["Shape twin : se ride dans les deux sens", "Flex souple pour le snowpark", "Fixations réglables incluses"] },
  "Snowboard All Mountain": { level: ALL, features: ["Stable à haute vitesse", "Flottaison en poudreuse", "Fixations réglables incluses"] },
  "Chaussures de ski confort": { level: ALL, features: ["Chaussant large", "Flex souple, idéal pour progresser", "Désinfectées et séchées après chaque location"] },
  "Boots de snowboard": { level: ALL, features: ["Laçage rapide", "Bon maintien de la cheville", "Désinfectées et séchées après chaque location"] },
  "Casque adulte avec visière": { level: ALL, features: ["Visière intégrée : pas besoin de masque", "Réglage par molette", "Norme EN 1077"] },
  "Casque enfant": { level: ALL, features: ["Léger et ajustable", "Norme EN 1077"] },
  "Bâtons de ski aluminium": { level: ALL, features: ["Aluminium léger", "Dragonne réglable"] },
  "Masque de ski": { level: ALL, features: ["Écran anti-buée", "Protection UV 100 %", "Compatible avec un casque"] },
};

export const DEMO_CATALOG: Record<string, Item[]> = {
  Skis: [
    { name: "Ski All Mountain", price: 25, description: "Polyvalent, pour skier sur toutes les pistes.", sizes: { "150 cm": 3, "160 cm": 4, "170 cm": 2 } },
    { name: "Ski piste Performance", price: 32, description: "Précis et nerveux, pour les skieurs confirmés.", sizes: { "165 cm": 2, "175 cm": 2 } },
    { name: "Ski junior", price: 15, description: "Léger et maniable, pour les enfants.", sizes: { "100 cm": 2, "120 cm": 3, "130 cm": 2 } },
  ],
  Snowboards: [
    { name: "Snowboard Freestyle", price: 28, description: "Souple, idéal pour le snowpark.", sizes: { "148 cm": 2, "152 cm": 2 } },
    { name: "Snowboard All Mountain", price: 30, description: "Stable sur piste comme en poudreuse.", sizes: { "154 cm": 2, "158 cm": 2, "162 cm": 1 } },
  ],
  Chaussures: [
    { name: "Chaussures de ski confort", price: 12, description: "Chaussant large et chaud.", sizes: { "38": 2, "40": 3, "42": 3, "44": 2, "46": 1 } },
    { name: "Boots de snowboard", price: 12, description: "Laçage rapide, bon maintien.", sizes: { "39": 2, "41": 2, "43": 2 } },
  ],
  Casques: [
    { name: "Casque adulte avec visière", price: 8, description: "Visière intégrée, réglage molette.", sizes: { S: 3, M: 5, L: 4 } },
    { name: "Casque enfant", price: 6, description: "Léger et ajustable.", sizes: { XS: 4, S: 4 } },
  ],
  "Bâtons": [
    { name: "Bâtons de ski aluminium", price: 4, description: "Légers et résistants.", sizes: { "110 cm": 4, "120 cm": 6, "130 cm": 5 } },
  ],
  Accessoires: [
    { name: "Masque de ski", price: 5, description: "Écran anti-buée, protection UV.", sizes: { "Taille unique": 10 } },
  ],
};

async function main() {
  await AppDataSource.initialize();
  const categories = AppDataSource.getRepository(Category);
  const materials = AppDataSource.getRepository(Material);
  const variants = AppDataSource.getRepository(MaterialVariant);

  let images = 0;
  for (const [categoryName, items] of Object.entries(DEMO_CATALOG)) {
    let category = await categories.findOneBy({ name: categoryName });
    if (!category) {
      category = await categories.save(categories.create({ name: categoryName, slug: slugify(categoryName) }));
    }
    for (const item of items) {
      const slug = slugify(item.name);
      const details = DETAILS[item.name] ?? {};
      let material = await materials.findOneBy({ slug });
      if (material) {
        if (material.features.length === 0 && details.features) {
          await materials.update(material.id, { level: details.level ?? null, features: details.features });
        }
      } else {
        material = await materials.save(
          materials.create({
            name: item.name,
            slug,
            description: item.description,
            dailyPriceCents: item.price * 100,
            level: details.level ?? null,
            features: details.features ?? [],
            isActive: true,
            category,
            variants: Object.entries(item.sizes).map(([size, stock], position) =>
              variants.create({ size, stock, position }),
            ),
          }),
        );
      }

      // Visuel de démonstration, seulement pour un matériel encore sans photo.
      const file = path.join(SEED_IMAGES, `${slug}.jpg`);
      if ((material.images ?? []).length === 0 && existsSync(file)) {
        await addMaterialImage(material.id, readFileSync(file), item.name);
        images++;
      }
    }
  }

  console.log(`[seed] ${await categories.count()} catégories, ${await materials.count()} matériels, ${images} visuel(s) ajouté(s).`);
  await AppDataSource.destroy();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
