// Données de démonstration pour le développement.
// Lancement : docker compose exec backend npm run seed:demo
// Idempotent : relancer le script ne crée pas de doublons.
import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Category } from "./entities/Category";
import { Material } from "./entities/Material";
import { slugify } from "./utils/slugify";

const catalog: Record<string, { name: string; price: number; stock: number; description: string }[]> = {
  Skis: [
    { name: "Ski All Mountain 160 cm", price: 25, stock: 8, description: "Polyvalent, pour skier sur toutes les pistes." },
    { name: "Ski piste Performance 170 cm", price: 32, stock: 5, description: "Précis et nerveux, pour les skieurs confirmés." },
    { name: "Ski junior 120 cm", price: 15, stock: 6, description: "Léger et maniable, pour les enfants." },
  ],
  Snowboards: [
    { name: "Snowboard Freestyle 152 cm", price: 28, stock: 4, description: "Souple, idéal pour le snowpark." },
    { name: "Snowboard All Mountain 158 cm", price: 30, stock: 4, description: "Stable sur piste comme en poudreuse." },
  ],
  Chaussures: [
    { name: "Chaussures de ski confort", price: 12, stock: 10, description: "Chaussant large et chaud." },
    { name: "Boots de snowboard", price: 12, stock: 6, description: "Laçage rapide, bon maintien." },
  ],
  Casques: [
    { name: "Casque adulte avec visière", price: 8, stock: 12, description: "Visière intégrée, réglage molette." },
    { name: "Casque enfant", price: 6, stock: 8, description: "Léger et ajustable." },
  ],
  "Bâtons": [{ name: "Bâtons de ski aluminium", price: 4, stock: 15, description: "Légers et résistants." }],
  Accessoires: [{ name: "Masque de ski", price: 5, stock: 10, description: "Écran anti-buée, protection UV." }],
};

async function main() {
  await AppDataSource.initialize();
  const categories = AppDataSource.getRepository(Category);
  const materials = AppDataSource.getRepository(Material);

  for (const [categoryName, items] of Object.entries(catalog)) {
    let category = await categories.findOneBy({ name: categoryName });
    if (!category) {
      category = await categories.save(
        categories.create({ name: categoryName, slug: slugify(categoryName) }),
      );
    }
    for (const item of items) {
      const slug = slugify(item.name);
      if (await materials.existsBy({ slug })) continue;
      await materials.save(
        materials.create({
          name: item.name,
          slug,
          description: item.description,
          dailyPriceCents: item.price * 100,
          stock: item.stock,
          isActive: true,
          category,
        }),
      );
    }
  }

  console.log(`[seed] ${await categories.count()} catégories, ${await materials.count()} matériels.`);
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
