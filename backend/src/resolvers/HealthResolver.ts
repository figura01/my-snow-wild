import { Authorized, Query, Resolver } from "type-graphql";

@Resolver()
export class HealthResolver {
  @Query(() => String, { description: "Vérifie que l'API répond." })
  health(): string {
    return "ok";
  }

  @Authorized("ADMIN")
  @Query(() => String, { description: "Réservé aux administrateurs (test des rôles)." })
  adminPing(): string {
    return "pong admin";
  }
}
