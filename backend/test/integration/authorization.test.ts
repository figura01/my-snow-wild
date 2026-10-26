import { billing, closeDb, createMaterial, createUser, gql, inDays, openDb, resetDb, UserRole } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

const code = (result: Awaited<ReturnType<typeof gql>>) => result.errors?.[0]?.extensions?.code;
const message = (result: Awaited<ReturnType<typeof gql>>) => result.errors?.[0]?.message;

const CREATE = `mutation ($data: CheckoutInput!) { createReservation(data: $data) { reservationId paymentUrl } }`;
const RESERVATION = `query ($id: ID!) { reservation(id: $id) { id status } }`;

async function checkout(user: Awaited<ReturnType<typeof createUser>>) {
  const { variants } = await createMaterial({ M: 5 });
  const result = await gql(
    CREATE,
    { data: { startDate: inDays(5), endDate: inDays(6), items: [{ variantId: variants[0].id, quantity: 1 }], billing } },
    user,
  );
  return result.data?.createReservation as { reservationId: string; paymentUrl: string };
}

describe("autorisations GraphQL", () => {
  it.each(["{ adminUsers { id } }", "{ adminReservations { id } }", "{ adminMaterials { id } }"])(
    "refuse %s à un client",
    async (query) => {
      const client = await createUser(UserRole.USER);
      expect(code(await gql(query, {}, client))).toBe("UNAUTHORIZED");
      expect(code(await gql(query))).toMatch(/^UNAUTH/);
    },
  );

  it("autorise le back-office à un administrateur", async () => {
    const admin = await createUser(UserRole.ADMIN);
    const result = await gql("{ adminUsers { id role } }", {}, admin);
    expect(result.errors).toBeUndefined();
    expect(result.data?.adminUsers).toHaveLength(1);
  });

  it("exige d'être connecté pour réserver", async () => {
    const { variants } = await createMaterial({ M: 1 });
    const result = await gql(CREATE, {
      data: { startDate: inDays(5), endDate: inDays(6), items: [{ variantId: variants[0].id, quantity: 1 }], billing },
    });
    expect(code(result)).toBe("UNAUTHENTICATED");
  });

  it("valide les informations de facturation", async () => {
    const client = await createUser();
    const { variants } = await createMaterial({ M: 1 });
    const result = await gql(
      CREATE,
      {
        data: {
          startDate: inDays(5), endDate: inDays(6), items: [{ variantId: variants[0].id, quantity: 1 }],
          billing: { ...billing, postalCode: "123" },
        },
      },
      client,
    );
    expect(code(result)).toBe("BAD_USER_INPUT");
  });

  it("crée une réservation avec un paiement simulé", async () => {
    const client = await createUser();
    const { reservationId, paymentUrl } = await checkout(client);
    expect(reservationId).toBeDefined();
    expect(paymentUrl).toContain("paiement-simule");
  });

  it("ne montre une réservation qu'à son propriétaire et aux administrateurs", async () => {
    const [owner, stranger, admin] = [await createUser(), await createUser(), await createUser(UserRole.ADMIN)];
    const { reservationId } = await checkout(owner);

    expect((await gql(RESERVATION, { id: reservationId }, owner)).data?.reservation).not.toBeNull();
    expect((await gql(RESERVATION, { id: reservationId }, stranger)).data?.reservation).toBeNull();
    expect((await gql(RESERVATION, { id: reservationId }, admin)).data?.reservation).not.toBeNull();

    const confirm = await gql(`mutation ($id: ID!) { confirmPayment(id: $id) { status } }`, { id: reservationId }, stranger);
    expect(message(confirm)).toBe("Réservation introuvable.");
  });

  it("empêche un administrateur de retirer ses propres droits ou de supprimer son compte", async () => {
    const admin = await createUser(UserRole.ADMIN);
    const demote = await gql(
      `mutation ($id: ID!) { updateUserRole(id: $id, role: USER) { id } }`,
      { id: admin.id },
      admin,
    );
    expect(message(demote)).toContain("tes propres droits");
    const remove = await gql(`mutation ($id: ID!) { deleteUser(id: $id) }`, { id: admin.id }, admin);
    expect(message(remove)).toContain("ton propre compte");
  });
});
