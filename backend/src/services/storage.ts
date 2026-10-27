import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env";

/**
 * Stockage des photos, derrière une interface commune :
 * - « local »      : fichiers sur le disque de l'API, servis sous /uploads (développement, ou sans compte Cloudinary) ;
 * - « cloudinary » : envoi sur Cloudinary, qui sert les images en WebP/AVIF, aux bonnes dimensions, via son CDN.
 * Chaque photo retient le stockage qui la conserve : changer de configuration ne casse pas les photos existantes.
 */
export type ImageVariant = "thumb" | "large";
export type StorageName = "local" | "cloudinary";

export interface ImageStorage {
  name: StorageName;
  save(buffer: Buffer, ext: string): Promise<string>;
  remove(key: string): Promise<void>;
  url(key: string, variant: ImageVariant): string;
}

// --- Disque local ----------------------------------------------------------------

const localStorage: ImageStorage = {
  name: "local",
  async save(buffer, ext) {
    const key = `${randomUUID()}.${ext}`;
    await mkdir(env.uploadDir, { recursive: true });
    await writeFile(path.join(env.uploadDir, key), buffer, { flag: "wx" });
    return key;
  },
  async remove(key) {
    // La clé vient de la base (générée par l'API) : on vérifie quand même qu'elle ne sort pas du dossier.
    await unlink(path.join(env.uploadDir, path.basename(key))).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  },
  // Pas de redimensionnement en local : la même image sert pour toutes les tailles.
  url: (key) => `/uploads/${key}`,
};

// --- Cloudinary (API REST, sans dépendance) ------------------------------------------

export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

/** Lit CLOUDINARY_URL au format « cloudinary://<api_key>:<api_secret>@<cloud_name> ». */
export function parseCloudinaryUrl(value: string | undefined): CloudinaryConfig | null {
  if (!value) return null;
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@([\w-]+)$/.exec(value.trim());
  if (!match) throw new Error("CLOUDINARY_URL invalide (attendu : cloudinary://<api_key>:<api_secret>@<cloud_name>).");
  return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
}

/** Signature Cloudinary : SHA-1 des paramètres triés « a=1&b=2 » suivis du secret. */
export function cloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

// Transformations appliquées à la volée par Cloudinary : format et qualité automatiques.
const TRANSFORMS: Record<ImageVariant, string> = {
  thumb: "c_fill,g_auto,w_640,h_480,f_auto,q_auto",
  large: "c_limit,w_1600,h_1200,f_auto,q_auto",
};

export function cloudinaryStorage(config: CloudinaryConfig): ImageStorage {
  const api = `https://api.cloudinary.com/v1_1/${config.cloudName}/image`;

  async function call(action: "upload" | "destroy", params: Record<string, string>, file?: Buffer) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signed = { ...params, timestamp };
    const form = new FormData();
    for (const [k, v] of Object.entries(signed)) form.append(k, v);
    form.append("api_key", config.apiKey);
    form.append("signature", cloudinarySignature(signed, config.apiSecret));
    if (file) form.append("file", new Blob([new Uint8Array(file)]));
    const response = await fetch(`${api}/${action}`, { method: "POST", body: form });
    const body = (await response.json().catch(() => ({}))) as { error?: { message?: string }; public_id?: string; result?: string };
    if (!response.ok) throw new Error(`Cloudinary ${action} : ${body.error?.message ?? response.status}`);
    return body;
  }

  return {
    name: "cloudinary",
    async save(buffer) {
      const body = await call("upload", { folder: "snow-wild/materials", public_id: randomUUID() }, buffer);
      if (!body.public_id) throw new Error("Cloudinary : réponse sans identifiant.");
      return body.public_id;
    },
    async remove(key) {
      await call("destroy", { public_id: key, invalidate: "true" });
    },
    url: (key, variant) => `https://res.cloudinary.com/${config.cloudName}/image/upload/${TRANSFORMS[variant]}/${key}`,
  };
}

// --- Choix du stockage -------------------------------------------------------------

const cloudinaryConfig = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
const drivers: Partial<Record<StorageName, ImageStorage>> = {
  local: localStorage,
  ...(cloudinaryConfig ? { cloudinary: cloudinaryStorage(cloudinaryConfig) } : {}),
};

/** Stockage des nouvelles photos : Cloudinary s'il est configuré, sinon le disque. */
export const activeStorage: ImageStorage = drivers.cloudinary ?? localStorage;

/** Stockage qui conserve une photo existante. */
export function storageFor(name: string): ImageStorage {
  const driver = drivers[name as StorageName];
  if (!driver) throw new Error(`Stockage « ${name} » non configuré (CLOUDINARY_URL manquante ?).`);
  return driver;
}
