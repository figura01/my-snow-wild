import { Client } from "pg";
import "./setup-env";

// Crée la base de test au besoin, en se connectant à la base « postgres ».
export default async function globalSetup() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: "postgres",
  });
  await client.connect();
  const name = process.env.POSTGRES_DB!;
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${name.replace(/"/g, "")}"`);
  await client.end();
}
