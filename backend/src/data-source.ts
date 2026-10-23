import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { Category } from "./entities/Category";
import { Material } from "./entities/Material";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.database.host,
  port: env.database.port,
  username: env.database.user,
  password: env.database.password,
  database: env.database.name,
  entities: [User, Category, Material],
  // En développement, TypeORM aligne automatiquement les tables sur les entités.
  // En production, on passera par des migrations versionnées.
  synchronize: !env.isProd,
  logging: false,
});
