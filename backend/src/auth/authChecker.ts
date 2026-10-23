import type { AuthChecker } from "type-graphql";
import type { Context } from "./context";

// Utilisé par le décorateur @Authorized() de TypeGraphQL :
// - @Authorized()          → utilisateur connecté
// - @Authorized("ADMIN")   → utilisateur connecté avec le rôle ADMIN
// La vérification se fait côté serveur, à chaque requête, à partir du JWT signé.
export const authChecker: AuthChecker<Context> = ({ context }, roles) => {
  if (!context.user) return false;
  if (roles.length === 0) return true;
  return roles.includes(context.user.role);
};
