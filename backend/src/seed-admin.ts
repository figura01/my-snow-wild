import bcrypt from "bcryptjs";
import { env } from "./config/env";
import { AppDataSource } from "./data-source";
import { User, UserRole } from "./entities/User";

// Crée le premier administrateur à partir des variables ADMIN_EMAIL et
// ADMIN_PASSWORD, uniquement s'il n'existe encore aucun admin.
// Aucun identifiant n'est écrit en dur dans le code.
export async function ensureAdmin() {
  const repo = AppDataSource.getRepository(User);
  if (await repo.existsBy({ role: UserRole.ADMIN })) return;

  const { email, password } = env.admin;
  if (!email || !password) {
    console.warn("[seed] Aucun admin : définis ADMIN_EMAIL et ADMIN_PASSWORD pour en créer un.");
    return;
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD doit contenir au moins 12 caractères.");
  }

  await repo.save(
    repo.create({
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      firstName: "Admin",
      lastName: "Snow Wild",
      role: UserRole.ADMIN,
    }),
  );
  console.log(`[seed] Administrateur créé : ${email}`);
}
