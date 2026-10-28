import { AppDataSource } from "../../src/data-source";
import { Customer, CustomerSource } from "../../src/entities/Customer";
import { User } from "../../src/entities/User";
import { exportCustomers, listCustomers, planCustomerImport, runCustomerImport } from "../../src/services/customers";
import { exportReservations } from "../../src/services/reservation-export";
import { createPendingReservation, markPaid } from "../../src/services/reservations";
import { parseCsv } from "../../src/utils/csv";
import { billing, closeDb, createMaterial, createUser, gql, inDays, openDb, resetDb, ReservationStatus, UserRole } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

const customers = () => AppDataSource.getRepository(Customer);
const csv = (...lines: string[]) => lines.join("\n");
const HEADER = "email;prenom;nom;telephone;adresse;code_postal;ville";

describe("compte et fiche client", () => {
  it("l'inscription crée le compte et sa fiche ; le profil écrit dans la fiche", async () => {
    const res = await gql(
      `mutation($data: RegisterInput!) { register(data: $data) { id email firstName lastName } }`,
      { data: { email: "Lea@Test.dev", password: "motdepasse-solide", firstName: " Léa ", lastName: "Roux" } },
    );
    expect(res.errors).toBeUndefined();
    const user = await AppDataSource.getRepository(User).findOneByOrFail({ email: "lea@test.dev" });
    expect(user.customer).toMatchObject({ email: "lea@test.dev", firstName: "Léa", lastName: "Roux", source: CustomerSource.SIGNUP });

    const update = await gql(
      `mutation($data: ProfileInput!) { updateProfile(data: $data) { firstName city postalCode } }`,
      { data: { firstName: "Léa", lastName: "Roux", phone: "0600000000", address: "1 rue Haute", postalCode: "38000", city: "Grenoble" } },
      user,
    );
    expect(update.errors).toBeUndefined();
    expect(update.data).toEqual({ updateProfile: { firstName: "Léa", city: "Grenoble", postalCode: "38000" } });
    expect((await customers().findOneByOrFail({ id: user.customer.id })).address).toBe("1 rue Haute");
  });

  it("la table des comptes ne contient plus aucune coordonnée", async () => {
    const columns: { column_name: string }[] = await AppDataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'user'`,
    );
    expect(columns.map((c) => c.column_name).sort()).toEqual(
      ["createdAt", "customerId", "email", "id", "passwordHash", "role", "updatedAt"].sort(),
    );
  });

  it("supprimer un compte supprime sa fiche", async () => {
    const admin = await createUser(UserRole.ADMIN);
    const user = await createUser();
    const res = await gql(`mutation($id: ID!) { deleteUser(id: $id) }`, { id: user.id }, admin);
    expect(res.errors).toBeUndefined();
    expect(await customers().existsBy({ id: user.customer.id })).toBe(false);
  });
});

describe("import de clients", () => {
  it("prévoit créations, mises à jour et lignes ignorées sans rien enregistrer", async () => {
    const member = await createUser(); // client inscrit
    await customers().save({ email: "ancien@test.dev", firstName: "A", lastName: "Ancien", city: "Annecy", source: CustomerSource.IMPORT });

    const plan = await planCustomerImport(
      csv(
        HEADER,
        "nouveau@test.dev;Nina;Neuf;;;;",
        "ANCIEN@test.dev;Alex;Ancien;;;;",
        `${member.email};X;Y;;;;`,
      ),
    );
    expect(plan.errors).toEqual([]);
    expect(plan.customers.map((c) => [c.email, c.action])).toEqual([
      ["nouveau@test.dev", "create"],
      ["ancien@test.dev", "update"],
      [member.email, "skip"],
    ]);
    expect(plan.warnings[0].message).toMatch(/compte client/);
    expect(await customers().count()).toBe(2); // rien n'a été enregistré
  });

  it("signale les erreurs ligne par ligne et refuse l'import", async () => {
    const file = csv(
      HEADER,
      "pas-un-email;A;B;;;;",
      "a@test.dev;;B;;;;",
      "b@test.dev;A;B;abc;;;",
      "c@test.dev;A;B;;;7300;",
      "d@test.dev;A;B;;;;",
      "D@test.dev;A;B;;;;",
    );
    const plan = await planCustomerImport(file);
    expect(plan.errors.map((e) => e.line)).toEqual([2, 3, 4, 5, 7]);
    expect(plan.errors[4].message).toMatch(/ligne 6/);
    await expect(runCustomerImport(file)).rejects.toThrow(/erreur/);
    expect(await customers().count()).toBe(0);
  });

  it("exige les colonnes email, prenom et nom", async () => {
    await expect(planCustomerImport("email;ville\na@test.dev;Lyon")).rejects.toThrow(/prenom, nom/);
  });

  it("importe : crée des fiches sans compte et met à jour en gardant les valeurs des cellules vides", async () => {
    await customers().save({
      email: "ancien@test.dev", firstName: "A", lastName: "Ancien", phone: "0611111111", city: "Annecy", source: CustomerSource.IMPORT,
    });
    const result = await runCustomerImport(csv(HEADER, "nouveau@test.dev;Nina;Neuf;0622222222;2 rue Basse;69001;Lyon", "ancien@test.dev;Alex;Ancien;;;;Albertville"));
    expect(result).toEqual({ created: 1, updated: 1, skipped: 0 });

    const created = await customers().findOne({ where: { email: "nouveau@test.dev" }, relations: { user: true } });
    expect(created).toMatchObject({ firstName: "Nina", city: "Lyon", source: CustomerSource.IMPORT, user: null });
    const updated = await customers().findOneByOrFail({ email: "ancien@test.dev" });
    expect(updated).toMatchObject({ firstName: "Alex", phone: "0611111111", city: "Albertville" });
  });

  it("export puis réimport : mêmes données, rien de créé", async () => {
    await createUser();
    await customers().save({ email: "x@test.dev", firstName: "=HYPERLINK(1)", lastName: "+33", phone: "+33 6 12 34 56 78", source: CustomerSource.IMPORT });

    const exported = await exportCustomers();
    // Les cellules qui ressemblent à une formule sont neutralisées pour le tableur.
    expect(exported).toContain("'=HYPERLINK(1)");
    expect(exported).toContain("'+33 6 12 34 56 78");
    expect(exported).not.toMatch(/passwordHash|\$2[aby]\$/);

    const before = await customers().find({ order: { email: "ASC" } });
    const result = await runCustomerImport(exported);
    expect(result).toEqual({ created: 0, updated: 1, skipped: 1 });
    const after = await customers().find({ order: { email: "ASC" } });
    expect(after.map(({ updatedAt, ...c }) => c)).toEqual(before.map(({ updatedAt, ...c }) => c));
  });
});

describe("back-office : clients et réservations", () => {
  async function paidReservation() {
    const user = await createUser();
    const { variants } = await createMaterial({ M: 2 }, 2000);
    const r = await createPendingReservation(user.id, inDays(5), inDays(6), [{ variantId: variants[0].id, quantity: 1 }], billing);
    await markPaid(r.id);
    return { user, reservation: r };
  }

  it("liste les fiches avec leur compte et leurs réservations payées", async () => {
    const { user } = await paidReservation();
    await customers().save({ email: "sans-compte@test.dev", firstName: "S", lastName: "Zz", source: CustomerSource.IMPORT });
    const rows = await listCustomers();
    expect(rows.map((r) => [r.email, r.hasAccount, r.reservationCount, r.paidCents])).toEqual([
      [user.email, true, 1, 4000],
      ["sans-compte@test.dev", false, 0, 0],
    ]);
  });

  it("réserve les fiches clients et les exports aux administrateurs", async () => {
    const user = await createUser();
    for (const query of ["{ adminCustomers { id } }", "{ exportCustomersCsv }", "{ exportReservationsCsv }"]) {
      const res = await gql(query, {}, user);
      expect(res.errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED");
    }
  });

  it("exporte les réservations avec le numéro de facture, filtrables par statut", async () => {
    const { reservation } = await paidReservation();
    const rows = parseCsv(await exportReservations([ReservationStatus.PAID]));
    expect(rows).toHaveLength(2);
    const [header, line] = rows;
    const cell = (name: string) => line[header.indexOf(name)];
    expect(cell("reference")).toBe(reservation.id.slice(0, 8).toUpperCase());
    expect(cell("statut")).toBe("payée");
    expect(cell("total_ttc")).toBe("40,00");
    expect(cell("total_ht")).toBe("33,33");
    expect(cell("tva")).toBe("6,67");
    expect(cell("facture")).toMatch(/^FA-\d{4}-0001$/);
    expect(cell("client")).toBe("Camille Test");

    expect(parseCsv(await exportReservations([ReservationStatus.CANCELLED]))).toHaveLength(1);
  });
});
