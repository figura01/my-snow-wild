import PDFDocument from "pdfkit";
import { env } from "../config/env";
import type { Invoice } from "../entities/Invoice";

// Couleurs du site (tokens « brand », « ink », « muted », « line »).
const BRAND = "#1d63d6";
const INK = "#0b1220";
const MUTED = "#5a6478";
const LINE = "#e3e8f0";
const SNOW = "#f6f8fb";

const PAGE = { width: 595.28, height: 841.89, margin: 48 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

/** 123456 → « 1 234,56 € ». Espaces ordinaires : les polices PDF standard n'ont pas l'espace fine insécable. */
export function formatEuros(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${euros},${String(abs % 100).padStart(2, "0")} €`;
}

/** « 2027-01-10 » → « 10/01/2027 ». */
const formatIsoDate = (iso: string) => iso.split("-").reverse().join("/");

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);

const formatRate = (bps: number) => `${(bps / 100).toLocaleString("fr-FR")} %`;

type Column = { title: string; width: number; align: "left" | "right" | "center" };
const COLUMNS: Column[] = [
  { title: "Désignation", width: 185, align: "left" },
  { title: "Taille", width: 70, align: "left" },
  { title: "Qté", width: 35, align: "right" },
  { title: "Jours", width: 40, align: "right" },
  { title: "Prix / jour TTC", width: 85, align: "right" },
  { title: "Total TTC", width: CONTENT_WIDTH - 185 - 70 - 35 - 40 - 85, align: "right" },
];

function drawLogo(doc: PDFKit.PDFDocument, x: number, y: number, size: number) {
  const scale = size / 64;
  doc.save();
  doc.translate(x, y).scale(scale);
  doc.roundedRect(0, 0, 64, 64, 16).fill(BRAND);
  doc.path("M8 48 L23 25 L31 36 L41 18 L56 48 Z").fill("#ffffff");
  doc.restore();
}

/** Facture au format PDF (A4), générée à partir des données figées de la facture. */
export function renderInvoicePdf(invoice: Invoice, options: { paidAt: Date | null; reservationId: string }): Promise<Buffer> {
  const company = env.company;
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.margin,
    bufferPages: true, // pour écrire le pied de page sur chaque page à la fin
    info: {
      Title: `Facture ${invoice.number}`,
      Author: company.name,
      Subject: `Location de matériel de ski du ${formatIsoDate(invoice.periodStart)} au ${formatIsoDate(invoice.periodEnd)}`,
    },
  });

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;

  // --- En-tête : marque à gauche, numéro et date à droite --------------------
  drawLogo(doc, left, PAGE.margin, 34);
  doc.font("Helvetica-Bold").fontSize(18).fillColor(INK).text("SNOW", left + 44, PAGE.margin + 8, { continued: true });
  doc.fillColor(BRAND).text("WILD");

  doc.font("Helvetica-Bold").fontSize(22).fillColor(INK).text("FACTURE", left, PAGE.margin, { width: CONTENT_WIDTH, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor(MUTED);
  doc.text(`N° ${invoice.number}`, left, PAGE.margin + 28, { width: CONTENT_WIDTH, align: "right" });
  doc.text(`Date : ${formatDate(invoice.issuedAt)}`, { width: CONTENT_WIDTH, align: "right" });

  // --- Émetteur et client ------------------------------------------------------
  const blockTop = PAGE.margin + 80;
  const half = (CONTENT_WIDTH - 20) / 2;

  doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("ÉMETTEUR", left, blockTop, { characterSpacing: 1 });
  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(company.name, left, blockTop + 14, { width: half });
  doc.font("Helvetica").fontSize(10).fillColor(INK);
  doc.text(company.address, { width: half });
  doc.text(`${company.postalCode} ${company.city}`, { width: half });
  doc.fillColor(MUTED).text(company.email, { width: half });
  doc.text(`TVA intracommunautaire : ${company.vatNumber}`, { width: half });

  const clientX = left + half + 20;
  doc.roundedRect(clientX, blockTop - 8, half, 92, 8).fill(SNOW);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("FACTURÉ À", clientX + 14, blockTop, { characterSpacing: 1 });
  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(invoice.customerName, clientX + 14, blockTop + 14, { width: half - 28 });
  doc.font("Helvetica").fontSize(10).fillColor(INK);
  doc.text(invoice.customerAddress, { width: half - 28 });
  doc.text(`${invoice.customerPostalCode} ${invoice.customerCity}`, { width: half - 28 });
  doc.fillColor(MUTED).text(invoice.customerEmail, { width: half - 28 });

  // --- Objet ---------------------------------------------------------------------
  const days = invoice.lines[0]?.days ?? 0;
  let y = blockTop + 110;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text("Location de matériel de ski", left, y);
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(
    `Du ${formatIsoDate(invoice.periodStart)} au ${formatIsoDate(invoice.periodEnd)} inclus (${days} jour${days > 1 ? "s" : ""})` +
      ` · Réservation ${options.reservationId.slice(0, 8).toUpperCase()}`,
    left,
    y + 15,
  );
  y += 44;

  // --- Tableau des lignes -----------------------------------------------------
  const drawHeader = () => {
    doc.rect(left, y, CONTENT_WIDTH, 22).fill(INK);
    let x = left;
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#ffffff");
    for (const column of COLUMNS) {
      doc.text(column.title, x + 6, y + 7, { width: column.width - 12, align: column.align, lineBreak: false });
      x += column.width;
    }
    y += 22;
  };
  drawHeader();

  doc.font("Helvetica").fontSize(9.5);
  invoice.lines.forEach((line, index) => {
    const cells = [
      line.label,
      line.size,
      String(line.quantity),
      String(line.days),
      formatEuros(line.unitPriceCents),
      formatEuros(line.totalCents),
    ];
    const rowHeight = Math.max(24, doc.heightOfString(line.label, { width: COLUMNS[0].width - 12 }) + 12);
    if (y + rowHeight > PAGE.height - 200) {
      doc.addPage();
      y = PAGE.margin;
      drawHeader();
      doc.font("Helvetica").fontSize(9.5);
    }
    if (index % 2 === 1) doc.rect(left, y, CONTENT_WIDTH, rowHeight).fill(SNOW);
    let x = left;
    cells.forEach((cell, i) => {
      doc.fillColor(i === 0 ? INK : i === 5 ? INK : MUTED).font(i === 5 ? "Helvetica-Bold" : "Helvetica");
      doc.text(cell, x + 6, y + 7, { width: COLUMNS[i].width - 12, align: COLUMNS[i].align });
      x += COLUMNS[i].width;
    });
    y += rowHeight;
  });
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(LINE).stroke();

  // --- Totaux ------------------------------------------------------------------------
  if (y + 150 > PAGE.height - 110) {
    doc.addPage();
    y = PAGE.margin;
  }
  y += 16;
  const totalsWidth = 220;
  const totalsX = right - totalsWidth;
  const totalRow = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10).fillColor(bold ? "#ffffff" : INK);
    doc.text(label, totalsX + 12, y, { width: 110 });
    doc.text(value, totalsX + 110, y, { width: totalsWidth - 122, align: "right" });
  };
  totalRow("Total HT", formatEuros(invoice.totalHtCents));
  y += 18;
  totalRow(`TVA ${formatRate(invoice.vatRateBps)}`, formatEuros(invoice.vatCents));
  y += 22;
  doc.roundedRect(totalsX, y - 8, totalsWidth, 30, 6).fill(BRAND);
  totalRow("Total TTC", formatEuros(invoice.totalTtcCents), true);
  y += 40;

  // Facture acquittée : payée par carte au moment de la commande.
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#15803d");
  doc.text(`Facture acquittée${options.paidAt ? ` le ${formatDate(options.paidAt)}` : ""} par carte bancaire.`, left, y);
  if (invoice.paymentReference) {
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(`Référence du paiement : ${invoice.paymentReference}`, left, y + 14);
  }

  // --- Mentions légales (bas de chaque page) ------------------------------------------
  const legal = [
    `${company.name} · ${company.legalForm} · ${company.rcs} · SIRET ${company.siret} · TVA ${company.vatNumber}`,
    `${company.address}, ${company.postalCode} ${company.city} · ${company.email}`,
    "Pas d'escompte pour paiement anticipé. En cas de retard de paiement, pénalités au taux légal majoré " +
      "et indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 du Code de commerce).",
  ];
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    // Le pied de page est dans la marge basse : sans cela, pdfkit ouvrirait une nouvelle page.
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const footerTop = PAGE.height - PAGE.margin - (company.demo ? 70 : 48);
    doc.moveTo(left, footerTop).lineTo(right, footerTop).lineWidth(0.8).strokeColor(LINE).stroke();
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
    doc.text(legal.join("\n"), left, footerTop + 8, { width: CONTENT_WIDTH, align: "center", lineGap: 1.5 });
    if (company.demo) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#b91c1c").text(
        "Document fictif généré par un projet de démonstration : sans valeur comptable ni fiscale.",
        left,
        PAGE.height - PAGE.margin - 12,
        { width: CONTENT_WIDTH, align: "center" },
      );
    }
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`${invoice.number} · page ${i - range.start + 1}/${range.count}`, left, PAGE.margin - 26, {
      width: CONTENT_WIDTH,
      align: "right",
    });
    doc.page.margins.bottom = bottomMargin;
  }

  doc.end();
  return done;
}
