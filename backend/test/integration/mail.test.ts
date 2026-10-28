import bcrypt from "bcryptjs";
import { AppDataSource } from "../../src/data-source";
import { User } from "../../src/entities/User";
import { mailTransport, outbox } from "../../src/mail/mailer";
import { escapeHtml } from "../../src/mail/templates";
import { hashResetToken, requestPasswordReset, resetPassword } from "../../src/services/password-reset";
import { createPendingReservation, markPaid } from "../../src/services/reservations";
import { billing, closeDb, createMaterial, createUser, gql, inDays, openDb, resetDb } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(async () => {
  await resetDb();
  outbox.length = 0;
});

const users = () => AppDataSource.getRepository(User);
const tokenOf = (text: string) => /token=([A-Za-z0-9_-]{43})/.exec(text)?.[1] ?? null;

it("n'envoie jamais de vrai e-mail pendant les tests", () => {
  expect(mailTransport).toBe("test");
});

describe("confirmation de réservation", () => {
  it("part une seule fois au paiement, avec la facture PDF jointe", async () => {
    const user = await createUser();
    const { variants } = await createMaterial({ M: 2 }, 1500);
    const r = await createPendingReservation(user.id, inDays(5), inDays(6), [{ variantId: variants[0].id, quantity: 2 }], billing);
    expect(outbox).toHaveLength(0);

    await markPaid(r.id);
    await markPaid(r.id); // second appel (webhook + retour du navigateur) : rien de plus

    expect(outbox).toHaveLength(1);
    const [mail] = outbox;
    expect(mail.to).toBe(billing.email);
    expect(mail.subject).toMatch(/^Réservation confirmée/);
    expect(mail.text).toContain("2 × Ski");
    expect(mail.text).toContain("60,00 €"); // 2 × 15 € × 2 jours
    expect(mail.idempotencyKey).toBe(`reservation-confirmed/${r.id}`);
    expect(mail.attachments).toHaveLength(1);
    expect(mail.attachments![0].filename).toMatch(/^FA-\d{4}-0001\.pdf$/);
    expect(mail.attachments![0].content.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("échappe les données saisies par le client", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'co'`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;co&#39;");
  });
});

describe("mot de passe oublié", () => {
  it("ne révèle pas si un compte existe", async () => {
    await requestPasswordReset("inconnu@test.dev");
    expect(outbox).toHaveLength(0);
    const res = await gql(`mutation { requestPasswordReset(email: "inconnu@test.dev") }`);
    expect(res.data).toEqual({ requestPasswordReset: true });
  });

  it("envoie un lien ; seule l'empreinte du jeton est enregistrée ; le lien sert une fois", async () => {
    const user = await createUser();
    await requestPasswordReset(user.email.toUpperCase());
    expect(outbox).toHaveLength(1);
    const token = tokenOf(outbox[0].text)!;
    expect(token).not.toBeNull();
    expect(outbox[0].html).toContain("/mot-de-passe/nouveau?token=");

    const stored = await users().findOneByOrFail({ id: user.id });
    expect(stored.passwordResetTokenHash).toBe(hashResetToken(token));
    expect(JSON.stringify(stored)).not.toContain(token);

    const updated = await resetPassword(token, "nouveau-mot-de-passe");
    expect(updated.id).toBe(user.id);
    expect(await bcrypt.compare("nouveau-mot-de-passe", (await users().findOneByOrFail({ id: user.id })).passwordHash)).toBe(true);

    await expect(resetPassword(token, "encore-un-autre")).rejects.toThrow(/plus valable/);
  });

  it("refuse un lien expiré ou inventé", async () => {
    const user = await createUser();
    await requestPasswordReset(user.email);
    const token = tokenOf(outbox[0].text)!;
    await users().update(user.id, { passwordResetExpiresAt: new Date(Date.now() - 1000) });
    await expect(resetPassword(token, "nouveau-mot-de-passe")).rejects.toThrow(/plus valable/);
    await expect(resetPassword("x".repeat(43), "nouveau-mot-de-passe")).rejects.toThrow(/plus valable/);
    await expect(resetPassword("pas-un-jeton", "nouveau-mot-de-passe")).rejects.toThrow(/plus valable/);
  });

  it("n'envoie pas un deuxième e-mail dans les 2 minutes", async () => {
    const user = await createUser();
    await requestPasswordReset(user.email);
    await requestPasswordReset(user.email);
    expect(outbox).toHaveLength(1);
    await requestPasswordReset(user.email, new Date(Date.now() + 3 * 60_000));
    expect(outbox).toHaveLength(2);
    // Seul le dernier lien est valable.
    await expect(resetPassword(tokenOf(outbox[0].text)!, "nouveau-mot-de-passe")).rejects.toThrow(/plus valable/);
  });

  it("connecte le client après le changement (GraphQL)", async () => {
    const user = await createUser();
    await requestPasswordReset(user.email);
    const token = tokenOf(outbox[0].text)!;
    const res = await gql(
      `mutation($data: ResetPasswordInput!) { resetPassword(data: $data) { email } }`,
      { data: { token, newPassword: "nouveau-mot-de-passe" } },
    );
    expect(res.errors).toBeUndefined();
    expect(res.data).toEqual({ resetPassword: { email: user.email } });
  });
});
