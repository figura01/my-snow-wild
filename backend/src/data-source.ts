import "reflect-metadata";
import path from "node:path";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { Category } from "./entities/Category";
import { Maintenance } from "./entities/Maintenance";
import { Material } from "./entities/Material";
import { MaterialVariant } from "./entities/MaterialVariant";
import { Reservation } from "./entities/Reservation";
import { ReservationItem } from "./entities/ReservationItem";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.database.host,
  port: env.database.port,
  username: env.database.user,
  password: env.database.password,
  database: env.database.name,
  entities: [User, Category, Material, MaterialVariant, Maintenance, Reservation, ReservationItem],
  // En développement, TypeORM aligne automatiquement les tables sur les entités.
  // En production, jamais : le schéma évolue uniquement par des migrations
  // versionnées (src/migrations), appliquées au démarrage de l'API.
  synchronize: !env.isProd,
  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
  migrationsRun: env.isProd,
  logging: false,
});
