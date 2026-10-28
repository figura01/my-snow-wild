import type { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { Customer, CustomerSource } from "../entities/Customer";
import { User, UserRole } from "../entities/User";

export type NewAccount = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
};

/**
 * Crée un compte et sa fiche client, dans une même transaction.
 * L'inscription crée toujours une nouvelle fiche : une fiche importée avec la même
 * adresse n'est pas rattachée tant que l'adresse e-mail n'a pas été vérifiée
 * (sinon, s'inscrire avec l'e-mail de quelqu'un donnerait accès à ses coordonnées).
 */
export async function createAccount(data: NewAccount, manager?: EntityManager): Promise<User> {
  const run = async (m: EntityManager) => {
    const email = data.email.trim().toLowerCase();
    const customer = await m.getRepository(Customer).save(
      m.create(Customer, {
        email,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        source: CustomerSource.SIGNUP,
      }),
    );
    return m.getRepository(User).save(
      m.create(User, { email, passwordHash: data.passwordHash, role: data.role ?? UserRole.USER, customer }),
    );
  };
  return manager ? run(manager) : AppDataSource.transaction(run);
}

/** Compte avec sa fiche (chargée même si l'appelant ne l'avait pas). */
export async function customerOf(user: User): Promise<Customer> {
  if (user.customer) return user.customer;
  const loaded = await AppDataSource.getRepository(User).findOneOrFail({ where: { id: user.id }, relations: { customer: true } });
  return loaded.customer;
}
