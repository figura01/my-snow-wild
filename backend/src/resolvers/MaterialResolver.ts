import { Arg, Authorized, FieldResolver, ID, Int, Mutation, Query, Resolver, Root } from "type-graphql";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import { Material } from "../entities/Material";
import { MaterialVariant } from "../entities/MaterialVariant";
import { ReservationItem } from "../entities/ReservationItem";
import { UserRole } from "../entities/User";
import { badInput, notFound } from "../utils/errors";
import { uniqueSlug } from "../utils/uniqueSlug";
import { MaterialInput, VariantInput } from "./catalog.inputs";

const materials = () => AppDataSource.getRepository(Material);
const variantsRepo = () => AppDataSource.getRepository(MaterialVariant);
const categories = () => AppDataSource.getRepository(Category);
const reservationItems = () => AppDataSource.getRepository(ReservationItem);

async function findCategory(id: string) {
  const category = await categories().findOneBy({ id });
  if (!category) throw notFound("Catégorie");
  return category;
}

function checkDuplicateSizes(variants: VariantInput[]) {
  const seen = new Set<string>();
  for (const variant of variants) {
    const key = variant.size.trim().toLowerCase();
    if (seen.has(key)) throw badInput(`La taille « ${variant.size.trim()} » apparaît deux fois.`);
    seen.add(key);
  }
}

@Resolver(() => Material)
export class MaterialResolver {
  @FieldResolver(() => [MaterialVariant], { description: "Tailles, dans l'ordre de saisie." })
  variants(@Root() material: Material): MaterialVariant[] {
    return [...(material.variants ?? [])].sort((a, b) => a.position - b.position);
  }

  @FieldResolver(() => Int, { description: "Stock total, toutes tailles confondues." })
  totalStock(@Root() material: Material): number {
    return (material.variants ?? []).reduce((sum, v) => sum + v.stock, 0);
  }

  // --- Lecture publique : uniquement les matériels actifs -----------------

  @Query(() => Material, { nullable: true })
  material(@Arg("slug") slug: string): Promise<Material | null> {
    return materials().findOneBy({ slug, isActive: true });
  }

  // --- Gestion (ADMIN) : y compris les matériels masqués ------------------

  @Authorized(UserRole.ADMIN)
  @Query(() => [Material])
  adminMaterials(): Promise<Material[]> {
    return materials().find({ order: { createdAt: "DESC" } });
  }

  @Authorized(UserRole.ADMIN)
  @Query(() => Material, { nullable: true })
  adminMaterial(@Arg("id", () => ID) id: string): Promise<Material | null> {
    return materials().findOneBy({ id });
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => Material)
  async createMaterial(@Arg("data") data: MaterialInput): Promise<Material> {
    checkDuplicateSizes(data.variants);
    const name = data.name.trim();
    return materials().save(
      materials().create({
        name,
        slug: await uniqueSlug(materials(), name),
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        dailyPriceCents: data.dailyPriceCents,
        isActive: data.isActive,
        category: await findCategory(data.categoryId),
        variants: data.variants.map((v, position) =>
          variantsRepo().create({ size: v.size.trim(), stock: v.stock, position }),
        ),
      }),
    );
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => Material)
  async updateMaterial(
    @Arg("id", () => ID) id: string,
    @Arg("data") data: MaterialInput,
  ): Promise<Material> {
    const material = await materials().findOneBy({ id });
    if (!material) throw notFound("Matériel");
    checkDuplicateSizes(data.variants);

    // Synchronisation des tailles : mise à jour, ajout, suppression.
    const existing = new Map(material.variants.map((v) => [v.id, v]));
    const keptIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id!));

    for (const removed of material.variants.filter((v) => !keptIds.has(v.id))) {
      if (await reservationItems().existsBy({ variant: { id: removed.id } })) {
        throw badInput(
          `La taille « ${removed.size} » figure dans des réservations : mets son stock à 0 au lieu de la supprimer.`,
        );
      }
    }
    await variantsRepo().remove(material.variants.filter((v) => !keptIds.has(v.id)));

    const name = data.name.trim();
    Object.assign(material, {
      name,
      slug: await uniqueSlug(materials(), name, id),
      description: data.description?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      dailyPriceCents: data.dailyPriceCents,
      isActive: data.isActive,
      category: await findCategory(data.categoryId),
      variants: data.variants.map((v, position) => {
        const current = v.id ? existing.get(v.id) : undefined;
        if (v.id && !current) throw badInput("Taille inconnue pour ce matériel.");
        return Object.assign(current ?? variantsRepo().create(), {
          size: v.size.trim(),
          stock: v.stock,
          position,
        });
      }),
    });
    await materials().save(material);
    return (await materials().findOneBy({ id }))!;
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => Boolean)
  async deleteMaterial(@Arg("id", () => ID) id: string): Promise<boolean> {
    const material = await materials().findOneBy({ id });
    if (!material) throw notFound("Matériel");
    // Un matériel déjà réservé est conservé pour l'historique des commandes.
    if (await reservationItems().existsBy({ material: { id } })) {
      throw badInput(
        "Ce matériel figure dans des réservations : décoche « Visible dans le catalogue » pour le masquer.",
      );
    }
    await materials().remove(material);
    return true;
  }
}
