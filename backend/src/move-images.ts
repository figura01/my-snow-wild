// Déplace vers le stockage actif (Cloudinary s'il est configuré) les photos encore
// stockées sur le disque local, puis supprime les fichiers locaux.
// Lancement : docker compose exec backend npm run images:move   (production : node dist/move-images.js)
import "reflect-metadata";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { env } from "./config/env";
import { AppDataSource } from "./data-source";
import { MaterialImage } from "./entities/MaterialImage";
import { activeStorage, storageFor } from "./services/storage";

async function main() {
  if (activeStorage.name === "local") {
    console.log("[images] Aucun stockage distant configuré (CLOUDINARY_URL) : rien à déplacer.");
    return;
  }
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(MaterialImage);
  const local = await repo.find({ where: { storage: "local" } });
  let moved = 0;

  for (const image of local) {
    try {
      const buffer = await readFile(path.join(env.uploadDir, path.basename(image.key)));
      const ext = path.extname(image.key).slice(1) || "jpg";
      const key = await activeStorage.save(buffer, ext);
      const oldKey = image.key;
      await repo.update(image.id, { storage: activeStorage.name, key });
      await storageFor("local").remove(oldKey);
      moved++;
    } catch (error) {
      console.error(`[images] ${image.id} non déplacée :`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`[images] ${moved} / ${local.length} photo(s) déplacée(s) vers ${activeStorage.name}.`);
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
