import { MaxLength, IsOptional } from "class-validator";
import { Arg, Field, ID, InputType, Int, ObjectType, Query, Resolver } from "type-graphql";
import { ILike, type FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../data-source";
import { Material } from "../entities/Material";
import { available, reservedQuantities } from "../services/availability";
import { parsePeriod } from "../utils/dates";
import { notFound } from "../utils/errors";

@InputType()
class CatalogFilter {
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(80)
  categorySlug?: string;

  @Field({ nullable: true, description: "AAAA-MM-JJ" })
  @IsOptional()
  startDate?: string;

  @Field({ nullable: true, description: "AAAA-MM-JJ, inclus" })
  @IsOptional()
  endDate?: string;
}

@ObjectType()
class VariantAvailability {
  @Field(() => ID)
  variantId: string;

  @Field()
  size: string;

  @Field(() => Int, { description: "Exemplaires de cette taille libres sur la période." })
  available: number;
}

@ObjectType()
class CatalogItem {
  @Field(() => Material)
  material: Material;

  @Field(() => Int, {
    nullable: true,
    description: "Exemplaires disponibles toutes tailles confondues (null si aucune date n'est choisie).",
  })
  available: number | null;

  @Field(() => [VariantAvailability], {
    nullable: true,
    description: "Disponibilité taille par taille (null si aucune date n'est choisie).",
  })
  sizes: VariantAvailability[] | null;
}

@ObjectType()
class CatalogResult {
  @Field(() => [CatalogItem])
  items: CatalogItem[];

  @Field(() => Int, { nullable: true, description: "Nombre de jours de la période." })
  days: number | null;

  @Field(() => Int, { description: "Matériels correspondants mais indisponibles sur la période." })
  unavailableCount: number;
}

/** Disponibilité par taille d'une liste de matériels sur une période. */
async function sizesAvailability(list: Material[], start: string, end: string) {
  const variantIds = list.flatMap((m) => m.variants.map((v) => v.id));
  const reserved = await reservedQuantities(variantIds, start, end);
  return new Map(
    list.map((m) => [
      m.id,
      [...m.variants]
        .sort((a, b) => a.position - b.position)
        .map((v) => ({ variantId: v.id, size: v.size, available: available(v.stock, reserved.get(v.id)) })),
    ]),
  );
}

// Échappe les caractères spéciaux de LIKE (% et _) saisis par l'utilisateur.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

const materials = () => AppDataSource.getRepository(Material);

@Resolver()
export class CatalogResolver {
  @Query(() => CatalogResult, {
    description: "Recherche dans le catalogue par nom, catégorie et période de location.",
  })
  async catalog(
    @Arg("filter", () => CatalogFilter, { nullable: true }) filter?: CatalogFilter,
  ): Promise<CatalogResult> {
    const period = parsePeriod(filter?.startDate, filter?.endDate);

    const base: FindOptionsWhere<Material> = {
      isActive: true,
      ...(filter?.categorySlug ? { category: { slug: filter.categorySlug } } : {}),
    };
    const term = filter?.search?.trim();
    const where = term
      ? [
          { ...base, name: ILike(`%${escapeLike(term)}%`) },
          { ...base, description: ILike(`%${escapeLike(term)}%`) },
        ]
      : base;

    const found = await materials().find({ where, order: { name: "ASC" } });

    if (!period) {
      return {
        items: found.map((material) => ({ material, available: null, sizes: null })),
        days: null,
        unavailableCount: 0,
      };
    }

    const bySize = await sizesAvailability(found, period.start, period.end);
    const withAvailability = found.map((material) => {
      const sizes = bySize.get(material.id) ?? [];
      return { material, sizes, available: sizes.reduce((sum, s) => sum + s.available, 0) };
    });
    const items = withAvailability.filter((item) => item.available > 0);

    return { items, days: period.days, unavailableCount: withAvailability.length - items.length };
  }

  @Query(() => [VariantAvailability], {
    description: "Disponibilité taille par taille d'un matériel sur une période.",
  })
  async materialAvailability(
    @Arg("slug") slug: string,
    @Arg("startDate") startDate: string,
    @Arg("endDate") endDate: string,
  ): Promise<VariantAvailability[]> {
    const period = parsePeriod(startDate, endDate)!;
    const material = await materials().findOneBy({ slug, isActive: true });
    if (!material) throw notFound("Matériel");
    const bySize = await sizesAvailability([material], period.start, period.end);
    return bySize.get(material.id) ?? [];
  }
}
