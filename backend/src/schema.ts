import { buildSchema } from "type-graphql";
import { authChecker } from "./auth/authChecker";
import { AuthResolver } from "./resolvers/AuthResolver";
import { CartResolver } from "./resolvers/CartResolver";
import { CatalogResolver } from "./resolvers/CatalogResolver";
import { CategoryResolver } from "./resolvers/CategoryResolver";
import { HealthResolver } from "./resolvers/HealthResolver";
import { MaterialResolver } from "./resolvers/MaterialResolver";
import { ReservationResolver } from "./resolvers/ReservationResolver";
import { UserAdminResolver } from "./resolvers/UserAdminResolver";

// Schéma GraphQL de l'application, partagé par le serveur et les tests.
export const buildAppSchema = () =>
  buildSchema({
    resolvers: [
      HealthResolver,
      AuthResolver,
      CategoryResolver,
      MaterialResolver,
      CatalogResolver,
      CartResolver,
      ReservationResolver,
      UserAdminResolver,
    ],
    authChecker,
    validate: true,
  });
