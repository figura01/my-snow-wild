import { env } from "../config/env";

export type Attachment = { filename: string; content: Buffer };

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
  /** Même clé = même e-mail : Resend n'envoie pas deux fois (nouvelle tentative, double appel). */
  idempotencyKey?: string;
};

/**
 * Envoi des e-mails, avec trois « transports » :
 * - resend : production (RESEND_API_KEY définie), API REST appelée directement ;
 * - log    : développement, l'e-mail est affiché dans les logs du backend au lieu d'être envoyé ;
 * - test   : tests automatisés, les e-mails sont gardés en mémoire (outbox), jamais envoyés.
 */
export const mailTransport: "resend" | "log" | "test" =
  process.env.NODE_ENV === "test" ? "test" : env.mail.resendApiKey ? "resend" : "log";

/** E-mails « envoyés » pendant les tests. */
export const outbox: Mail[] = [];

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

export async function sendMail(mail: Mail): Promise<void> {
  if (mailTransport === "test") {
    outbox.push(mail);
    return;
  }

  if (mailTransport === "log") {
    const attachments = mail.attachments?.map((a) => `${a.filename} (${Math.round(a.content.length / 1024)} Ko)`).join(", ");
    // En production sans clé, on ne journalise jamais le contenu (il peut contenir un lien de connexion).
    const body = env.isProd ? "[contenu masqué : RESEND_API_KEY absente]" : mail.text;
    console.log(
      `[mail] → ${mail.to} · ${mail.subject}${attachments ? ` · pièces jointes : ${attachments}` : ""}\n${body}\n[mail] ——`,
    );
    return;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.mail.resendApiKey}`,
    "Content-Type": "application/json",
  };
  if (mail.idempotencyKey) headers["Idempotency-Key"] = mail.idempotencyKey;

  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      from: env.mail.from,
      to: [mail.to],
      reply_to: env.mail.replyTo ?? undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
    }),
  });
  if (!response.ok) {
    // Le message d'erreur de Resend ne contient pas la clé ; on le garde pour le diagnostic.
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend a refusé l'e-mail (${response.status}) : ${detail.slice(0, 300)}`);
  }
}

/** Un e-mail qui ne part pas ne doit jamais faire échouer l'action qui l'a déclenché. */
export async function sendMailSafely(mail: Mail, context: string): Promise<boolean> {
  try {
    await sendMail(mail);
    return true;
  } catch (error) {
    console.error(`[mail] échec (${context}) :`, error instanceof Error ? error.message : error);
    return false;
  }
}
