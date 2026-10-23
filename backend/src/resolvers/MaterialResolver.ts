import { Arg, Authorized, ID, Mutation, Query, Resolver } from "type-graphql";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import { Material } from "../entities/Material";
import { UserRole } from "../entities/User";
import { notFound } from "../utils/errors";
import { uniqueSlug } from "../utils/uniqueSlug";
import { MaterialInput } from "./catalog.inputs";

const materials = () => AppDataSource.getRepository(Material);
const categories = () => AppDataSource.getRepository(Category);

async function findCategory(id: string) {
  const category = await categories().findOneBy({ id });
  if (!category) throw notFound("Catégorie");
  return category;
}

@Resolver(() => Material)
export class MaterialResolver {
  // --- Lecture publique : uniquement les matériels actifs -----------------

  @Query(() => [Material])
  materials(
    @Arg("categorySlug", { nullable: true }) categorySlug?: string,
  ): Promise<Material[]> {
    return materials().find({
      where: {
        isActive: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      order: { name: "ASC" },
    });
  }

  @Query(() => Material, { nullable: true })
  material(@Arg("slug") slug: string): Promise<Material | null> {
    return materials().findOneBy({ slug, isActive: true });
  }

  // --- Gestion (ADMIN) : y compris les matériels désactivés ---------------

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
    const name = data.name.trim();
    return materials().save(
      materials().create({
        name,
        slug: await uniqueSlug(materials(), name),
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        dailyPriceCents: data.dailyPriceCents,
        stock: data.stock,
        isActive: data.isActive,
        category: await findCategory(data.categoryId),
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

    const name = data.name.trim();
    Object.assign(material, {
      name,
      slug: await uniqueSlug(materials(), name, id),
      description: data.description?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      dailyPriceCents: data.dailyPriceCents,
      stock: data.stock,
      isActive: data.isActive,
      category: await findCategory(data.categoryId),
    });
    return materials().save(material);
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => Boolean)
  async deleteMaterial(@Arg("id", () => ID) id: string): Promise<boolean> {
    const material = await materials().findOneBy({ id });
    if (!material) throw notFound("Matériel");
    // Quand les réservations existeront, un matériel déjà réservé sera
    // désactivé plutôt que supprimé, pour garder l'historique.
    await materials().remove(material);
    return true;
  }
}
