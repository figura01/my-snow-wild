import { Arg, Authorized, ID, Int, Mutation, Query, Resolver, FieldResolver, Root } from "type-graphql";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import { Material } from "../entities/Material";
import { UserRole } from "../entities/User";
import { badInput, notFound } from "../utils/errors";
import { uniqueSlug } from "../utils/uniqueSlug";
import { CategoryInput } from "./catalog.inputs";

const categories = () => AppDataSource.getRepository(Category);
const materials = () => AppDataSource.getRepository(Material);

@Resolver(() => Category)
export class CategoryResolver {
  // --- Lecture publique ---------------------------------------------------

  @Query(() => [Category])
  categories(): Promise<Category[]> {
    return categories().find({ order: { name: "ASC" } });
  }

  @Query(() => Category, { nullable: true })
  category(@Arg("slug") slug: string): Promise<Category | null> {
    return categories().findOneBy({ slug });
  }

  @FieldResolver(() => Int, { description: "Nombre de matériels rattachés." })
  materialCount(@Root() category: Category): Promise<number> {
    return materials().countBy({ category: { id: category.id } });
  }

  // --- Gestion (ADMIN) ----------------------------------------------------

  @Authorized(UserRole.ADMIN)
  @Mutation(() => Category)
  async createCategory(@Arg("data") data: CategoryInput): Promise<Category> {
    const name = data.name.trim();
    if (await categories().existsBy({ name })) {
      throw badInput("Une catégorie porte déjà ce nom.");
    }
    return categories().save(
      categories().create({
        name,
        slug: await uniqueSlug(categories(), name),
        description: data.description?.trim() || null,
      }),
    );
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => Category)
  async updateCategory(
    @Arg("id", () => ID) id: string,
    @Arg("data") data: CategoryInput,
  ): Promise<Category> {
    const category = await categories().findOneBy({ id });
    if (!category) throw notFound("Catégorie");

    const name = data.name.trim();
    const duplicate = await categories().findOneBy({ name });
    if (duplicate && duplicate.id !== id) {
      throw badInput("Une catégorie porte déjà ce nom.");
    }

    category.name = name;
    category.slug = await uniqueSlug(categories(), name, id);
    category.description = data.description?.trim() || null;
    return categories().save(category);
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => Boolean)
  async deleteCategory(@Arg("id", () => ID) id: string): Promise<boolean> {
    const category = await categories().findOneBy({ id });
    if (!category) throw notFound("Catégorie");

    // On refuse de supprimer une catégorie qui contient encore des matériels,
    // plutôt que de les supprimer en cascade sans prévenir.
    const count = await materials().countBy({ category: { id } });
    if (count > 0) {
      throw badInput(
        `Impossible de supprimer : ${count} matériel(s) appartiennent encore à cette catégorie.`,
      );
    }
    await categories().remove(category);
    return true;
  }
}
