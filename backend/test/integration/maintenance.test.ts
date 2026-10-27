import { buildQuote } from "../../src/services/quote";
import { endMaintenance, findConflicts, startMaintenance } from "../../src/services/maintenance";
import {
  closeDb,
  createMaterial,
  createUser,
  gql,
  inDays,
  insertReservation,
  openDb,
  resetDb,
  ReservationStatus,
  UserRole,
} from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

const reason = "Carre abîmée";

describe("maintenance", () => {
  it("retire les exemplaires en maintenance de la disponibilité, à toutes les dates", async () => {
    const { variants } = await createMaterial({ "160 cm": 4 });
    const id = variants[0].id;
    await startMaintenance({ variantId: id, quantity: 3, reason });

    for (const day of [2, 40]) {
      const quote = await buildQuote(inDays(day), inDays(day), [{ variantId: id, quantity: 2 }]);
      expect(quote.lines[0]).toMatchObject({ ok: false, available: 1 });
    }
  });

  it("rend les exemplaires louables après la remise en service", async () => {
    const { variants } = await createMaterial({ "160 cm": 2 });
    const id = variants[0].id;
    const maintenance = await startMaintenance({ variantId: id, quantity: 2, reason });
    expect((await buildQuote(inDays(3), inDays(3), [{ variantId: id, quantity: 1 }])).valid).toBe(false);

    const ended = await endMaintenance(maintenance.id);
    expect(ended.endedAt).toBeInstanceOf(Date);
    expect((await buildQuote(inDays(3), inDays(3), [{ variantId: id, quantity: 2 }])).valid).toBe(true);
  });

  it("refuse de mettre en maintenance plus d'exemplaires qu'il n'y en a en service", async () => {
    const { variants } = await createMaterial({ M: 3 });
    const id = variants[0].id;
    await startMaintenance({ variantId: id, quantity: 2, reason });
    await expect(startMaintenance({ variantId: id, quantity: 2, reason })).rejects.toThrow("Seulement 1 exemplaire");
    await startMaintenance({ variantId: id, quantity: 1, reason });
    await expect(startMaintenance({ variantId: id, quantity: 1, reason })).rejects.toThrow("déjà en maintenance");
  });

  it("valide le motif et la date de retour", async () => {
    const { variants } = await createMaterial({ M: 3 });
    const variantId = variants[0].id;
    await expect(startMaintenance({ variantId, quantity: 1, reason: " " })).rejects.toThrow("motif");
    await expect(
      startMaintenance({ variantId, quantity: 1, reason, expectedReturnDate: inDays(-1) }),
    ).rejects.toThrow("passée");
  });

  it("signale les réservations à venir qui n'ont plus assez d'exemplaires", async () => {
    const user = await createUser();
    const { material, variants } = await createMaterial({ "160 cm": 2, "170 cm": 2 });
    const [v160, v170] = variants;
    await insertReservation({ user, material, variant: v160, start: inDays(5), end: inDays(7), quantity: 2, status: ReservationStatus.PAID });
    await insertReservation({ user, material, variant: v170, start: inDays(5), end: inDays(7), quantity: 1, status: ReservationStatus.PAID });
    // Réservation terminée : jamais en conflit.
    await insertReservation({ user, material, variant: v160, start: inDays(-5), end: inDays(-3), quantity: 2, status: ReservationStatus.PAID });

    await startMaintenance({ variantId: v160.id, quantity: 1, reason });
    await startMaintenance({ variantId: v170.id, quantity: 1, reason });

    const conflicts = await findConflicts();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ size: "160 cm", reserved: 2, inService: 1 });
  });

  it("expose les quantités en maintenance et en service dans l'API, réservées aux admins pour la gestion", async () => {
    const [admin, client] = [await createUser(UserRole.ADMIN), await createUser()];
    const { material, variants } = await createMaterial({ "160 cm": 4 });

    const START = `mutation ($data: MaintenanceInput!) {
      startMaintenance(data: $data) { maintenance { id quantity isActive material { name } } conflicts { size } }
    }`;
    const data = { variantId: variants[0].id, quantity: 1, reason };
    expect((await gql(START, { data }, client)).errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED");

    const started = await gql(START, { data }, admin);
    expect(started.errors).toBeUndefined();
    expect(started.data?.startMaintenance).toMatchObject({
      maintenance: { quantity: 1, isActive: true, material: { name: material.name } },
      conflicts: [],
    });

    const read = await gql(
      `query ($slug: String!) { material(slug: $slug) { variants { size stock inMaintenance inService } } }`,
      { slug: material.slug },
    );
    expect(read.data?.material.variants[0]).toEqual({ size: "160 cm", stock: 4, inMaintenance: 1, inService: 3 });
  });

  it("empêche de descendre le stock sous le nombre d'exemplaires en maintenance", async () => {
    const admin = await createUser(UserRole.ADMIN);
    const { material, variants } = await createMaterial({ "160 cm": 4 });
    await startMaintenance({ variantId: variants[0].id, quantity: 3, reason });

    const result = await gql(
      `mutation ($id: ID!, $data: MaterialInput!) { updateMaterial(id: $id, data: $data) { id } }`,
      {
        id: material.id,
        data: {
          name: material.name,
          dailyPriceCents: material.dailyPriceCents,
          isActive: true,
          categoryId: material.category.id,
          variants: [{ id: variants[0].id, size: "160 cm", stock: 2 }],
        },
      },
      admin,
    );
    expect(result.errors?.[0]?.message).toContain("en maintenance");
  });
});
