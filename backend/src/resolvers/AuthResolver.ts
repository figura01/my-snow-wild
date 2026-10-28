import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import type { Context } from "../auth/context";
import { AUTH_COOKIE, cookieOptions, signToken } from "../auth/token";
import { badInput } from "../utils/errors";
import { LoginInput, PasswordInput, ProfileInput, RegisterInput } from "./auth.inputs";

const users = () => AppDataSource.getRepository(User);

function startSession(ctx: Context, user: User) {
  const token = signToken({ sub: user.id, role: user.role });
  ctx.res.cookie(AUTH_COOKIE, token, cookieOptions);
}

@Resolver(() => User)
export class AuthResolver {
  // Utilisateur connecté, ou null. Sert au front pour adapter l'interface.
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: Context): Promise<User | null> {
    if (!ctx.user) return null;
    return users().findOneBy({ id: ctx.user.sub });
  }

  @Mutation(() => User)
  async register(
    @Arg("data") data: RegisterInput,
    @Ctx() ctx: Context,
  ): Promise<User> {
    const email = data.email.trim().toLowerCase();
    if (await users().existsBy({ email })) {
      throw new GraphQLError("Un compte existe déjà avec cette adresse e-mail.", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Un compte créé depuis le site est toujours un client (USER) :
    // le rôle ADMIN ne s'obtient jamais par l'API publique.
    const user = users().create({
      email,
      passwordHash: await bcrypt.hash(data.password, 12),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: UserRole.USER,
    });
    await users().save(user);
    startSession(ctx, user);
    return user;
  }

  @Mutation(() => User)
  async login(
    @Arg("data") data: LoginInput,
    @Ctx() ctx: Context,
  ): Promise<User> {
    const email = data.email.trim().toLowerCase();
    const user = await users().findOneBy({ email });
    const valid = user ? await bcrypt.compare(data.password, user.passwordHash) : false;

    // Même message que l'e-mail existe ou non, pour ne pas révéler les comptes.
    if (!user || !valid) {
      throw new GraphQLError("Identifiants incorrects.", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    startSession(ctx, user);
    return user;
  }

  // --- Profil du client connecté ---------------------------------------------------

  @Authorized()
  @Mutation(() => User, { description: "Met à jour le nom et les coordonnées de facturation du compte." })
  async updateProfile(@Arg("data") data: ProfileInput, @Ctx() ctx: Context): Promise<User> {
    const user = await users().findOneByOrFail({ id: ctx.user!.sub });
    const clean = (value?: string | null) => value?.trim() || null;
    Object.assign(user, {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: clean(data.phone),
      address: clean(data.address),
      postalCode: clean(data.postalCode),
      city: clean(data.city),
    });
    return users().save(user);
  }

  @Authorized()
  @Mutation(() => Boolean)
  async changePassword(@Arg("data") data: PasswordInput, @Ctx() ctx: Context): Promise<boolean> {
    const user = await users().findOneByOrFail({ id: ctx.user!.sub });
    if (!(await bcrypt.compare(data.currentPassword, user.passwordHash))) {
      throw badInput("Mot de passe actuel incorrect.");
    }
    user.passwordHash = await bcrypt.hash(data.newPassword, 12);
    await users().save(user);
    return true;
  }

  @Mutation(() => Boolean)
  logout(@Ctx() ctx: Context): boolean {
    ctx.res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
    return true;
  }
}
