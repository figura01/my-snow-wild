import { existsSync } from "node:fs";
import path from "node:path";
import { env } from "../../src/config/env";
import { addMaterialImage, MAX_IMAGES_PER_MATERIAL } from "../../src/services/images";
import { closeDb, createMaterial, createUser, gql, openDb, resetDb, UserRole } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

// Plus petit PNG valide (1 × 1 pixel).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const IMAGES = `query ($slug: String!) { material(slug: $slug) { coverUrl images { id url alt position } } }`;

describe("photos des matériels", () => {
  it("enregistre le fichier sous un nom aléatoire et l'expose dans l'ordre", async () => {
    const { material } = await createMaterial({ M: 1 });
    const first = await addMaterialImage(material.id, PNG, "Vue de face");
    const second = await addMaterialImage(material.id, PNG);

    expect(first.filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(existsSync(path.join(env.uploadDir, first.filename))).toBe(true);

    const { data } = await gql(IMAGES, { slug: material.slug });
    const read = data?.material as { coverUrl: string; images: { id: string; url: string; alt: string }[] };
    expect(read.images.map((i) => i.id)).toEqual([first.id, second.id]);
    expect(read.images[0]).toMatchObject({ url: `/uploads/${first.filename}`, alt: "Vue de face" });
    expect(read.coverUrl).toBe(`/uploads/${first.filename}`);
  });

  it("refuse un fichier qui n'est pas une image JPEG, PNG ou WebP", async () => {
    const { material } = await createMaterial({ M: 1 });
    await expect(addMaterialImage(material.id, Buffer.from("<svg></svg>"))).rejects.toThrow("JPEG, PNG ou WebP");
  });

  it(`limite la galerie à ${MAX_IMAGES_PER_MATERIAL} photos`, async () => {
    const { material } = await createMaterial({ M: 1 });
    for (let i = 0; i < MAX_IMAGES_PER_MATERIAL; i++) await addMaterialImage(material.id, PNG);
    await expect(addMaterialImage(material.id, PNG)).rejects.toThrow("au maximum");
  });

  it("réordonne, renomme et supprime (admin uniquement), fichier compris", async () => {
    const [admin, client] = [await createUser(UserRole.ADMIN), await createUser()];
    const { material } = await createMaterial({ M: 1 });
    const a = await addMaterialImage(material.id, PNG);
    const b = await addMaterialImage(material.id, PNG);

    const REORDER = `mutation ($m: ID!, $ids: [ID!]!) { reorderMaterialImages(materialId: $m, ids: $ids) }`;
    expect((await gql(REORDER, { m: material.id, ids: [b.id, a.id] }, client)).errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED");
    expect((await gql(REORDER, { m: material.id, ids: [b.id] }, admin)).errors?.[0]?.message).toContain("invalide");
    expect((await gql(REORDER, { m: material.id, ids: [b.id, a.id] }, admin)).errors).toBeUndefined();

    await gql(`mutation ($id: ID!) { updateMaterialImageAlt(id: $id, alt: "Semelle") { alt } }`, { id: a.id }, admin);
    const removed = await gql(`mutation ($id: ID!) { deleteMaterialImage(id: $id) }`, { id: b.id }, admin);
    expect(removed.errors).toBeUndefined();
    expect(existsSync(path.join(env.uploadDir, b.filename))).toBe(false);

    const { data } = await gql(IMAGES, { slug: material.slug });
    expect((data?.material as { images: unknown[] }).images).toEqual([
      expect.objectContaining({ id: a.id, alt: "Semelle" }),
    ]);
  });

  it("enregistre le niveau et les points forts d'un matériel", async () => {
    const admin = await createUser(UserRole.ADMIN);
    const { material, variants } = await createMaterial({ M: 1 });
    const result = await gql(
      `mutation ($id: ID!, $data: MaterialInput!) { updateMaterial(id: $id, data: $data) { level features } }`,
      {
        id: material.id,
        data: {
          name: material.name,
          dailyPriceCents: material.dailyPriceCents,
          isActive: true,
          categoryId: material.category.id,
          variants: [{ id: variants[0].id, size: "M", stock: 1 }],
          level: "EXPERT",
          features: ["  Carres   affûtées ", "", "Fixations réglées"],
        },
      },
      admin,
    );
    expect(result.errors).toBeUndefined();
    expect(result.data?.updateMaterial).toEqual({ level: "EXPERT", features: ["Carres affûtées", "Fixations réglées"] });
  });
});
