import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { MAX_IMAGE_BYTES } from "./images";

/**
 * Télécharge une image distante pour l'import CSV, en se protégeant d'une adresse piégée
 * (SSRF : faire interroger par le serveur une machine interne) :
 * - https uniquement, port par défaut ;
 * - le nom doit pointer vers des adresses IP publiques ;
 * - pas de redirection suivie ; délai et taille limités.
 */
export function isPublicIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return !(
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // lien local (dont métadonnées cloud)
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224 // multicast et réservé
    );
  }
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPublicIp(v.slice(7));
    return !(v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("ff"));
  }
  return false;
}

/** Vérifie la forme de l'adresse (utilisé aussi par la validation du fichier). */
export function checkImageUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("adresse invalide");
  }
  if (url.protocol !== "https:") throw new Error("seules les adresses https sont acceptées");
  if (url.port && url.port !== "443") throw new Error("port non autorisé");
  if (url.username || url.password) throw new Error("identifiants interdits dans l'adresse");
  if (isIP(url.hostname.replace(/^\[|\]$/g, "")) && !isPublicIp(url.hostname.replace(/^\[|\]$/g, ""))) {
    throw new Error("adresse IP privée");
  }
  return url;
}

export async function fetchRemoteImage(raw: string, timeoutMs = 10_000): Promise<Buffer> {
  const url = checkImageUrl(raw);
  const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
  if (addresses.length === 0) throw new Error("nom de domaine introuvable");
  if (addresses.some((a) => !isPublicIp(a.address))) throw new Error("le domaine pointe vers une adresse privée");

  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
  if (response.status >= 300 && response.status < 400) throw new Error("redirection refusée : indiquez l'adresse finale de l'image");
  if (!response.ok || !response.body) throw new Error(`le serveur a répondu ${response.status}`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_IMAGE_BYTES) throw new Error("image trop lourde (5 Mo au maximum)");

  // Lecture avec plafond : on s'arrête dès que la taille maximale est dépassée.
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("image trop lourde (5 Mo au maximum)");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
