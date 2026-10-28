import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { env } from "../config/env";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { sendMailSafely } from "../mail/mailer";
import { passwordReset } from "../mail/templates";
import { badInput } from "../utils/errors";

export const RESET_VALIDITY_MINUTES = 60;
// Une nouvelle demande moins de 2 minutes après la précédente n'envoie pas de nouvel e-mail.
const RESEND_COOLDOWN_MS = 2 * 60_000;
const INVALID_LINK = "Ce lien n'est plus valable : demandez-en un nouveau.";

const users = () => AppDataSource.getRepository(User);
export const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Envoie un lien de réinitialisation si un compte existe avec cette adresse.
 * Ne dit jamais si l'adresse est connue : la réponse est la même dans tous les cas.
 * Le jeton (256 bits aléatoires) n'est conservé que sous forme d'empreinte.
 */
export async function requestPasswordReset(email: string, now = new Date()): Promise<void> {
  const user = await users().findOneBy({ email: email.trim().toLowerCase() });
  if (!user) return;

  const lastRequest = user.passwordResetExpiresAt ? user.passwordResetExpiresAt.getTime() - RESET_VALIDITY_MINUTES * 60_000 : 0;
  if (now.getTime() - lastRequest < RESEND_COOLDOWN_MS) return;

  const token = randomBytes(32).toString("base64url");
  await users().update(user.id, {
    passwordResetTokenHash: hashResetToken(token),
    passwordResetExpiresAt: new Date(now.getTime() + RESET_VALIDITY_MINUTES * 60_000),
  });

  const link = `${env.frontendUrl}/mot-de-passe/nouveau?token=${token}`;
  await sendMailSafely(
    { to: user.email, ...passwordReset({ firstName: user.customer.firstName, link, validityMinutes: RESET_VALIDITY_MINUTES }) },
    "mot de passe oublié",
  );
}

/** Change le mot de passe avec un jeton valide ; le jeton est consommé (une seule utilisation). */
export async function resetPassword(token: string, newPassword: string): Promise<User> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw badInput(INVALID_LINK);

  // Consommation atomique : deux envois simultanés du même lien, un seul réussit.
  const claimed = await users()
    .createQueryBuilder()
    .update()
    .set({ passwordResetTokenHash: null, passwordResetExpiresAt: null })
    .where(`"passwordResetTokenHash" = :hash AND "passwordResetExpiresAt" > now()`, { hash: hashResetToken(token) })
    .returning(["id"])
    .execute();
  const id = (claimed.raw as { id: string }[])[0]?.id;
  if (!id) throw badInput(INVALID_LINK);

  await users().update(id, { passwordHash: await bcrypt.hash(newPassword, 12) });
  return users().findOneByOrFail({ id });
}
