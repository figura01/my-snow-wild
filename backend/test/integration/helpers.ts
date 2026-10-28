import { graphql } from "graphql";
import type { GraphQLSchema } from "graphql";
import { AppDataSource } from "../../src/data-source";
import { Category } from "../../src/entities/Category";
import { Material } from "../../src/entities/Material";
import { MaterialVariant } from "../../src/entities/MaterialVariant";
import { Reservation, ReservationStatus } from "../../src/entities/Reservation";
import { ReservationItem } from "../../src/entities/ReservationItem";
import { User, UserRole } from "../../src/entities/User";
import { buildAppSchema } from "../../src/schema";
import { createAccount } from "../../src/services/accounts";

export const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export async function openDb() {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
}

export async function closeDb() {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
}

/** Vide toutes les tables entre deux tests. */
export async function resetDb() {
  const tables = AppDataSource.entityMetadatas.map((m) => `"${m.tableName}"`).join(", ");
  await AppDataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
}

let counter = 0;
const unique = () => `${Date.now()}-${++counter}`;

export async function createUser(role: UserRole = UserRole.USER) {
  return createAccount({
    email: `user-${unique()}@test.dev`,
    passwordHash: "x",
    firstName: "Test",
    lastName: role,
    role,
  });
}

/** Un matériel avec ses tailles : createMaterial({ "160 cm": 2, "170 cm": 1 }). */
export async function createMaterial(stocks: Record<string, number>, dailyPriceCents = 1500) {
  const id = unique();
  const category = await AppDataSource.getRepository(Category).save({ name: `Cat ${id}`, slug: `cat-${id}` });
  const material = await AppDataSource.getRepository(Material).save({
    name: `Ski ${id}`,
    slug: `ski-${id}`,
    dailyPriceCents,
    isActive: true,
    category,
    variants: Object.entries(stocks).map(([size, stock], position) =>
      AppDataSource.getRepository(MaterialVariant).create({ size, stock, position }),
    ),
  });
  const variants = await AppDataSource.getRepository(MaterialVariant).find({
    where: { material: { id: material.id } },
    order: { position: "ASC" },
  });
  return { material, variants };
}

/** Insère directement une réservation dans un état donné. */
export async function insertReservation(opts: {
  user: User;
  variant: MaterialVariant;
  material: Material;
  start: string;
  end: string;
  quantity?: number;
  status: ReservationStatus;
  expiresAt?: Date | null;
}) {
  return AppDataSource.getRepository(Reservation).save({
    user: opts.user,
    startDate: opts.start,
    endDate: opts.end,
    status: opts.status,
    totalCents: 0,
    expiresAt: opts.expiresAt ?? null,
    billingFirstName: "A",
    billingLastName: "B",
    billingEmail: "a@b.dev",
    billingPhone: "0600000000",
    billingAddress: "1 rue",
    billingPostalCode: "73000",
    billingCity: "Chambéry",
    items: [
      AppDataSource.getRepository(ReservationItem).create({
        variant: opts.variant,
        material: opts.material,
        quantity: opts.quantity ?? 1,
        dailyPriceCents: opts.material.dailyPriceCents,
      }),
    ],
  });
}

export const billing = {
  firstName: "Camille",
  lastName: "Test",
  email: "camille@test.dev",
  phone: "06 00 00 00 00",
  address: "1 rue des Pistes",
  postalCode: "73000",
  city: "Chambéry",
};

let schema: GraphQLSchema | null = null;

/** Exécute une opération GraphQL comme le ferait le serveur, avec un utilisateur donné. */
export async function gql(source: string, variables: Record<string, unknown> = {}, user?: User | null) {
  schema ??= await buildAppSchema();
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };
  return graphql({
    schema,
    source,
    variableValues: variables,
    contextValue: { req: {}, res, user: user ? { sub: user.id, role: user.role } : null },
  });
}

export { ReservationStatus, UserRole };
