import { Arg, Authorized, Field, Int, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { UserRole } from "../entities/User";
import { exportCatalog, importTemplate, planImport, runImport } from "../services/catalog-import";

@ObjectType()
class ImportIssueType {
  @Field(() => Int, { description: "Numéro de ligne dans le fichier (1 = en-têtes)." }) line: number;
  @Field() message: string;
}

@ObjectType()
class ImportPreviewMaterial {
  @Field() name: string;
  @Field({ description: "« create » ou « update »." }) action: string;
  @Field() category: string;
  @Field() categoryCreated: boolean;
  @Field(() => Int) dailyPriceCents: number;
  @Field(() => [String]) sizes: string[];
  @Field(() => Int) totalStock: number;
  @Field(() => Int, { description: "Photos qui seront récupérées." }) images: number;
}

@ObjectType()
class ImportPreview {
  @Field(() => Int) rows: number;
  @Field() valid: boolean;
  @Field(() => [ImportPreviewMaterial]) materials: ImportPreviewMaterial[];
  @Field(() => [ImportIssueType]) errors: ImportIssueType[];
  @Field(() => [ImportIssueType]) warnings: ImportIssueType[];
}

@ObjectType()
class ImportResultType {
  @Field(() => Int) created: number;
  @Field(() => Int) updated: number;
  @Field(() => Int) categoriesCreated: number;
  @Field(() => Int) imagesAdded: number;
  @Field(() => [ImportIssueType]) warnings: ImportIssueType[];
}

@Resolver()
export class ImportResolver {
  @Authorized(UserRole.ADMIN)
  @Mutation(() => ImportPreview, { description: "Analyse un fichier CSV sans rien enregistrer." })
  async previewCatalogImport(@Arg("csv") csv: string): Promise<ImportPreview> {
    const plan = await planImport(csv);
    return {
      rows: plan.rows,
      valid: plan.errors.length === 0,
      errors: plan.errors,
      warnings: plan.warnings,
      materials: plan.materials.map((m) => ({
        name: m.name,
        action: m.existingId ? "update" : "create",
        category: m.categoryName,
        categoryCreated: !m.categoryExists,
        dailyPriceCents: m.dailyPriceCents,
        sizes: m.sizes.map((s) => s.size),
        totalStock: m.sizes.reduce((sum, s) => sum + s.stock, 0),
        images: m.imagesSkipped ? 0 : m.images.length,
      })),
    };
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => ImportResultType, { description: "Importe un fichier CSV (tout ou rien pour les données)." })
  importCatalog(@Arg("csv") csv: string): Promise<ImportResultType> {
    return runImport(csv);
  }

  @Authorized(UserRole.ADMIN)
  @Query(() => String, { description: "Catalogue complet au format CSV d'import." })
  exportCatalogCsv(): Promise<string> {
    return exportCatalog();
  }

  @Authorized(UserRole.ADMIN)
  @Query(() => String, { description: "Modèle CSV avec deux lignes d'exemple." })
  catalogImportTemplate(): string {
    return importTemplate();
  }
}
