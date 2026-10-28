import { AppDataSource } from "../../src/data-source";
import { Material } from "../../src/entities/Material";
import { startMaintenance } from "../../src/services/maintenance";
import { exportCatalog, planImport, runImport } from "../../src/services/catalog-import";
import { closeDb, createMaterial, createUser, gql, openDb, resetDb, UserRole } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

const HEADER = "nom;categorie;prix_jour;taille;stock;niveau;points_forts;description;visible";
const csv = (...lines: string[]) => [HEADER, ...lines].join("\n");

const findBySlug = (slug: string) => AppDataSource.getRepository(Material).findOneByOrFail({ slug });

describe("import du catalogue (CSV)", () => {
  it("signale les erreurs ligne par ligne, sans rien enregistrer", async () => {
    const plan = await planImport(
      csv(
        "Ski Freeride;Skis;35;178 cm;2;confirmé;Spatule large | Poudreuse;;oui",
        "Ski Freeride;Skis;35;178 cm;1;;;;", // taille en double
        "Casque;Casques;abc;M;3;;;;", // prix invalide
        "Masque;Accessoires;5;Unique;-1;;;;", // stock négatif
        "Bâtons;Bâtons;4;120 cm;5;expert++;;;", // niveau inconnu
      ),
    );
    expect(plan.errors.map((e) => e.line)).toEqual([3, 4, 5, 6]);
    expect(plan.errors[0].message).toContain("en double");
    expect(await AppDataSource.getRepository(Material).count()).toBe(0);
  });

  it("refuse un fichier sans les colonnes obligatoires", async () => {
    await expect(planImport("nom;prix\nSki;3")).rejects.toThrow("Colonnes obligatoires manquantes");
  });

  it("crée matériels, tailles et catégories manquantes", async () => {
    const result = await runImport(
      csv(
        "Ski Freeride;Skis;35,50;178 cm;2;confirmé;Spatule large | Poudreuse;Pour la neige fraîche.;oui",
        "Ski Freeride;Skis;35,50;186 cm;1;;;;",
        "Casque junior;Casques;6;XS;4;débutant;;;non",
      ),
    );
    expect(result).toMatchObject({ created: 2, updated: 0, categoriesCreated: 2, imagesAdded: 0 });

    const ski = await findBySlug("ski-freeride");
    expect(ski).toMatchObject({ dailyPriceCents: 3550, level: "EXPERT", features: ["Spatule large", "Poudreuse"], isActive: true });
    expect(ski.variants.map((v) => [v.size, v.stock]).sort()).toEqual([["178 cm", 2], ["186 cm", 1]]);
    expect((await findBySlug("casque-junior")).isActive).toBe(false);
  });

  it("met à jour un matériel existant (même nom) et ajoute les nouvelles tailles", async () => {
    const { material } = await createMaterial({ "160 cm": 4 }, 2500);
    const name = material.name;
    const result = await runImport(csv(`${name};Skis;30;160 cm;6;;;;`, `${name};Skis;30;170 cm;2;;;;`));
    expect(result).toMatchObject({ created: 0, updated: 1 });

    const updated = await findBySlug(material.slug);
    expect(updated.dailyPriceCents).toBe(3000);
    expect(updated.category.name).toBe("Skis");
    expect(updated.variants.map((v) => [v.size, v.stock]).sort()).toEqual([["160 cm", 6], ["170 cm", 2]]);
  });

  it("refuse de baisser le stock sous les exemplaires en maintenance", async () => {
    const { material, variants } = await createMaterial({ "160 cm": 4 });
    await startMaintenance({ variantId: variants[0].id, quantity: 3, reason: "Carre abîmée" });
    const plan = await planImport(csv(`${material.name};Skis;25;160 cm;2;;;;`));
    expect(plan.errors[0].message).toContain("en maintenance");
  });

  it("exporte un fichier réimportable sans changement", async () => {
    await runImport(csv('Ski Freeride;Skis;35;178 cm;2;confirmé;Spatule large;"Pour la neige; fraîche.";oui'));
    const exported = await exportCatalog();
    const plan = await planImport(exported);
    expect(plan.errors).toEqual([]);
    expect(plan.materials[0]).toMatchObject({ name: "Ski Freeride", existingId: expect.any(String), level: "EXPERT", description: "Pour la neige; fraîche." });
  });

  it("réserve l'import et l'export aux administrateurs", async () => {
    const [admin, client] = [await createUser(UserRole.ADMIN), await createUser()];
    const PREVIEW = `mutation ($csv: String!) { previewCatalogImport(csv: $csv) { valid rows materials { name action categoryCreated } } }`;
    expect((await gql(PREVIEW, { csv: csv("Casque;Casques;6;M;2;;;;") }, client)).errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED");
    const ok = await gql(PREVIEW, { csv: csv("Casque;Casques;6;M;2;;;;") }, admin);
    expect(ok.data?.previewCatalogImport).toEqual({
      valid: true,
      rows: 1,
      materials: [{ name: "Casque", action: "create", categoryCreated: true }],
    });
    expect((await gql("{ exportCatalogCsv }", {}, client)).errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED");
  });
});
