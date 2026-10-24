import { Arg, Authorized, Ctx, FieldResolver, ID, Int, Mutation, Query, Resolver, Root } from "type-graphql";
import type { Context } from "../auth/context";
import { AppDataSource } from "../data-source";
import { Reservation } from "../entities/Reservation";
import { User, UserRole } from "../entities/User";
import { badInput, notFound } from "../utils/errors";

const users = () => AppDataSource.getRepository(User);
const reservations = () => AppDataSource.getRepository(Reservation);

@Resolver(() => User)
export class UserAdminResolver {
  @FieldResolver(() => Int, { description: "Nombre de réservations du client." })
  reservationCount(@Root() user: User): Promise<number> {
    return reservations().countBy({ user: { id: user.id } });
  }

  @Authorized(UserRole.ADMIN)
  @Query(() => [User])
  adminUsers(): Promise<User[]> {
    return users().find({ order: { createdAt: "DESC" } });
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => User)
  async updateUserRole(
    @Arg("id", () => ID) id: string,
    @Arg("role", () => UserRole) role: UserRole,
    @Ctx() ctx: Context,
  ): Promise<User> {
    const user = await users().findOneBy({ id });
    if (!user) throw notFound("Utilisateur");

    // Garde-fous : on ne se retire pas ses propres droits, et il reste
    // toujours au moins un administrateur.
    if (role !== UserRole.ADMIN) {
      if (user.id === ctx.user!.sub) throw badInput("Tu ne peux pas retirer tes propres droits d'administrateur.");
      if (user.role === UserRole.ADMIN && (await users().countBy({ role: UserRole.ADMIN })) <= 1) {
        throw badInput("Il doit rester au moins un administrateur.");
      }
    }
    user.role = role;
    return users().save(user);
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => Boolean)
  async deleteUser(@Arg("id", () => ID) id: string, @Ctx() ctx: Context): Promise<boolean> {
    const user = await users().findOneBy({ id });
    if (!user) throw notFound("Utilisateur");
    if (user.id === ctx.user!.sub) throw badInput("Tu ne peux pas supprimer ton propre compte.");
    if (user.role === UserRole.ADMIN && (await users().countBy({ role: UserRole.ADMIN })) <= 1) {
      throw badInput("Il doit rester au moins un administrateur.");
    }
    // Les réservations du client sont conservées (historique et comptabilité) :
    // la relation passe à NULL, les informations de facturation restent.
    await users().remove(user);
    return true;
  }
}
