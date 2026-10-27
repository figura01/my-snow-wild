import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { In } from "typeorm";
import { env } from "../config/env";
import { AppDataSource } from "../data-source";
import { Material } from "../entities/Material";
import { MaterialImage } from "../entities/MaterialImage";
import { badInput, notFound } from "../utils/errors";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_MATERIAL = 8;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const images = () => AppDataSource.getRepository(MaterialImage);

/**
 * Type réel d'une image d'après ses premiers octets (« signature »), sans se fier
 * à l'extension ni à l'en-tête envoyé par le navigateur. Seuls JPEG, PNG et WebP
 * sont acceptés : pas de SVG, qui peut contenir du script.
 */
export function detectImageType(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

export const imageUrl = (image: Pick<MaterialImage, "filename">) => `/uploads/${image.filename}`;

/** Ajoute une photo à la fin de la galerie d'un matériel. */
export async function addMaterialImage(materialId: string, buffer: Buffer, alt = ""): Promise<MaterialImage> {
  if (buffer.length === 0) throw badInput("Fichier vide.");
  if (buffer.length > MAX_IMAGE_BYTES) throw badInput("Photo trop lourde (5 Mo au maximum).");
  const ext = detectImageType(buffer);
  if (!ext) throw badInput("Format non pris en charge : JPEG, PNG ou WebP uniquement.");

  const material = await AppDataSource.getRepository(Material).findOne({ where: { id: materialId }, relations: { images: true } });
  if (!material) throw notFound("Matériel");
  if (material.images.length >= MAX_IMAGES_PER_MATERIAL) {
    throw badInput(`${MAX_IMAGES_PER_MATERIAL} photos au maximum par matériel.`);
  }

  const filename = `${randomUUID()}.${ext}`;
  await mkdir(env.uploadDir, { recursive: true });
  await writeFile(path.join(env.uploadDir, filename), buffer, { flag: "wx" });

  const position = Math.max(-1, ...material.images.map((i) => i.position)) + 1;
  try {
    return await images().save(images().create({ material: { id: materialId }, filename, alt: alt.trim().slice(0, 200), position }));
  } catch (error) {
    await removeFile(filename);
    throw error;
  }
}

async function removeFile(filename: string) {
  // Le nom vient de la base (généré par l'API) : on vérifie quand même qu'il ne sort pas du dossier.
  const target = path.join(env.uploadDir, path.basename(filename));
  await unlink(target).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

export async function deleteMaterialImage(id: string): Promise<void> {
  const image = await images().findOneBy({ id });
  if (!image) throw notFound("Photo");
  await images().remove(image);
  await removeFile(image.filename);
}

/** Supprime les fichiers de toutes les photos d'un matériel (avant sa suppression). */
export async function deleteFilesOf(materialId: string): Promise<void> {
  const list = await images().find({ where: { material: { id: materialId } } });
  await Promise.all(list.map((image) => removeFile(image.filename)));
}

/** Nouvel ordre de la galerie : la liste doit contenir exactement les photos du matériel. */
export async function reorderMaterialImages(materialId: string, ids: string[]): Promise<void> {
  const current = await images().find({ where: { material: { id: materialId } } });
  const known = new Set(current.map((i) => i.id));
  if (ids.length !== current.length || new Set(ids).size !== ids.length || ids.some((id) => !known.has(id))) {
    throw badInput("Ordre des photos invalide.");
  }
  await AppDataSource.transaction(async (manager) => {
    for (const [position, id] of ids.entries()) {
      await manager.getRepository(MaterialImage).update({ id, material: { id: materialId } }, { position });
    }
  });
}

export async function updateImageAlt(id: string, alt: string): Promise<MaterialImage> {
  const image = await images().findOneBy({ id });
  if (!image) throw notFound("Photo");
  image.alt = alt.trim().slice(0, 200);
  return images().save(image);
}

export const findImages = (ids: string[]) => images().findBy({ id: In(ids) });
