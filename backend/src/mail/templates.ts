import { env } from "../config/env";

/*
 * Modèles d'e-mails : HTML compatible avec les messageries (tableaux, styles en ligne,
 * pas d'image externe) et version texte. Toute donnée variable est échappée.
 */

const BRAND = "#1d63d6";
const INK = "#0b1220";
const MUTED = "#5a6478";
const LINE = "#e3e8f0";
const SNOW = "#f6f8fb";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const euros = (cents: number) =>
  `${String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${String(cents % 100).padStart(2, "0")} €`;
const frDate = (iso: string) => iso.split("-").reverse().join("/");

export type RenderedMail = { subject: string; html: string; text: string };

function layout(title: string, preheader: string, content: string): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${SNOW};font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SNOW};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:16px;">
<tr><td style="padding:24px 28px 8px;font-size:20px;font-weight:800;letter-spacing:-0.02em;">SNOW<span style="color:${BRAND};">WILD</span></td></tr>
<tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.55;">${content}</td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:${MUTED};text-align:center;">
Snow Wild · location de matériel de ski · projet de démonstration<br>
Cet e-mail vous est envoyé suite à une action sur votre compte.
</p>
</td></tr>
</table>
</body>
</html>`;
}

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="border-radius:999px;background:${BRAND};">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
</td></tr></table>`;

export type ConfirmationData = {
  firstName: string;
  reference: string;
  startDate: string;
  endDate: string;
  days: number;
  lines: { label: string; size: string; quantity: number; totalCents: number }[];
  totalCents: number;
  invoiceNumber: string | null;
};

export function reservationConfirmed(d: ConfirmationData): RenderedMail {
  const subject = `Réservation confirmée · du ${frDate(d.startDate)} au ${frDate(d.endDate)}`;
  const accountUrl = `${env.frontendUrl}/compte`;
  const period = `Du ${frDate(d.startDate)} au ${frDate(d.endDate)} inclus (${d.days} jour${d.days > 1 ? "s" : ""})`;
  const invoice = d.invoiceNumber
    ? `Votre facture <strong>${escapeHtml(d.invoiceNumber)}</strong> est jointe à cet e-mail ; elle reste téléchargeable depuis votre compte.`
    : "Votre facture sera disponible depuis votre compte.";

  const rows = d.lines
    .map(
      (l) => `<tr>
<td style="padding:10px 0;border-top:1px solid ${LINE};">${l.quantity} × ${escapeHtml(l.label)}<br><span style="font-size:13px;color:${MUTED};">Taille ${escapeHtml(l.size)}</span></td>
<td style="padding:10px 0;border-top:1px solid ${LINE};text-align:right;white-space:nowrap;">${euros(l.totalCents)}</td>
</tr>`,
    )
    .join("");

  const html = layout(
    subject,
    `${period}. Votre matériel vous attend.`,
    `<h1 style="margin:0 0 12px;font-size:22px;">Merci ${escapeHtml(d.firstName)}, c'est réservé !</h1>
<p style="margin:0 0 4px;">${period}</p>
<p style="margin:0 0 16px;color:${MUTED};font-size:13px;">Réservation ${escapeHtml(d.reference)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
${rows}
<tr><td style="padding:12px 0;border-top:2px solid ${INK};font-weight:800;">Total payé</td>
<td style="padding:12px 0;border-top:2px solid ${INK};text-align:right;font-weight:800;">${euros(d.totalCents)}</td></tr>
</table>
<p style="margin:16px 0 0;">${invoice}</p>
${button(accountUrl, "Voir ma réservation")}
<p style="margin:0;color:${MUTED};font-size:13px;">Le matériel est réglé à votre taille et à votre niveau au moment du retrait.</p>`,
  );

  const text = [
    `Merci ${d.firstName}, c'est réservé !`,
    "",
    period,
    `Réservation ${d.reference}`,
    "",
    ...d.lines.map((l) => `- ${l.quantity} × ${l.label} (taille ${l.size}) : ${euros(l.totalCents)}`),
    `Total payé : ${euros(d.totalCents)}`,
    "",
    d.invoiceNumber ? `Facture ${d.invoiceNumber} jointe à cet e-mail.` : "Facture disponible depuis votre compte.",
    `Voir ma réservation : ${accountUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export function passwordReset(d: { firstName: string; link: string; validityMinutes: number }): RenderedMail {
  const subject = "Choisissez un nouveau mot de passe";
  const html = layout(
    subject,
    `Lien valable ${d.validityMinutes} minutes.`,
    `<h1 style="margin:0 0 12px;font-size:22px;">Bonjour ${escapeHtml(d.firstName)},</h1>
<p style="margin:0;">Vous avez demandé à réinitialiser le mot de passe de votre compte Snow Wild. Ce lien est valable ${d.validityMinutes} minutes et ne fonctionne qu'une fois.</p>
${button(d.link, "Choisir un nouveau mot de passe")}
<p style="margin:0 0 8px;color:${MUTED};font-size:13px;">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br><span style="word-break:break-all;">${escapeHtml(d.link)}</span></p>
<p style="margin:0;color:${MUTED};font-size:13px;">Vous n'êtes pas à l'origine de cette demande ? Ignorez cet e-mail : votre mot de passe actuel reste valable.</p>`,
  );
  const text = [
    `Bonjour ${d.firstName},`,
    "",
    `Vous avez demandé à réinitialiser le mot de passe de votre compte Snow Wild. Ce lien est valable ${d.validityMinutes} minutes et ne fonctionne qu'une fois :`,
    d.link,
    "",
    "Vous n'êtes pas à l'origine de cette demande ? Ignorez cet e-mail : votre mot de passe actuel reste valable.",
  ].join("\n");
  return { subject, html, text };
}
