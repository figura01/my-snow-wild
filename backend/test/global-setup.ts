import { Client } from "pg";
import "./setup-env";

// Recrée la base de test à chaque lancement (en se connectant à la base « postgres ») :
// le schéma est alors toujours celui des entités actuelles, même après un changement de modèle.
export default async function globalSetup() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: "postgres",
  });
  await client.connect();
  const name = process.env.POSTGRES_DB!.replace(/"/g, "");
  if (!name.endsWith("_test")) throw new Error(`Base de test inattendue : ${name}`);
  await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  await client.query(`CREATE DATABASE "${name}"`);
  await client.end();
}
