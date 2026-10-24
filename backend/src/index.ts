import "reflect-metadata";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { buildSchema } from "type-graphql";
import { authChecker } from "./auth/authChecker";
import { buildContext, type Context } from "./auth/context";
import { env } from "./config/env";
import { AppDataSource } from "./data-source";
import { AuthResolver } from "./resolvers/AuthResolver";
import { CartResolver } from "./resolvers/CartResolver";
import { ReservationResolver } from "./resolvers/ReservationResolver";
import { UserAdminResolver } from "./resolvers/UserAdminResolver";
import { stripeWebhookRouter } from "./stripe-webhook";
import { paymentMode } from "./services/payment";
import { CatalogResolver } from "./resolvers/CatalogResolver";
import { CategoryResolver } from "./resolvers/CategoryResolver";
import { MaterialResolver } from "./resolvers/MaterialResolver";
import { HealthResolver } from "./resolvers/HealthResolver";
import { ensureAdmin } from "./seed-admin";

async function main() {
  await AppDataSource.initialize();
  console.log("[db] Connecté à PostgreSQL");
  await ensureAdmin();

  const schema = await buildSchema({
    resolvers: [HealthResolver, AuthResolver, CategoryResolver, MaterialResolver, CatalogResolver, CartResolver, ReservationResolver, UserAdminResolver],
    authChecker,
    validate: true,
  });

  const server = new ApolloServer<Context>({
    schema,
    introspection: !env.isProd,
  });
  await server.start();

  const app = express();
  app.disable("x-powered-by");
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Avant express.json() : le webhook Stripe a besoin du corps brut.
  app.use(stripeWebhookRouter());

  app.use(
    "/graphql",
    cors({ origin: env.frontendUrl, credentials: true }),
    cookieParser(),
    express.json({ limit: "1mb" }),
    expressMiddleware(server, { context: buildContext }),
  );

  app.listen(env.port, () => {
    console.log(`[api] Prêt sur http://localhost:${env.port}/graphql (paiement : ${paymentMode})`);
  });
}

main().catch((error) => {
  console.error("[api] Échec du démarrage :", error);
  process.exit(1);
});
