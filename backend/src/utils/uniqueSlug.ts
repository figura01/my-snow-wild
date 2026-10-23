import type { ObjectLiteral, Repository } from "typeorm";
import { slugify } from "./slugify";

// Génère un slug unique dans la table : « ski », puis « ski-2 », « ski-3 »…
// `excludeId` permet de garder son propre slug lors d'une modification.
export async function uniqueSlug<T extends ObjectLiteral & { id: string; slug: string }>(
  repo: Repository<T>,
  source: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(source) || "element";
  let candidate = base;
  for (let i = 2; ; i++) {
    const existing = await repo.findOne({ where: { slug: candidate } as never });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${i}`;
  }
}
