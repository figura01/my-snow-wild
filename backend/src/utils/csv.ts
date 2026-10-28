// Lecture et écriture de CSV (RFC 4180), sans dépendance.
// Séparateur détecté automatiquement : « ; » (Excel en français) ou « , ».

export function detectSeparator(text: string): ";" | "," {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const count = (sep: string) => firstLine.split(sep).length - 1;
  return count(";") >= count(",") && count(";") > 0 ? ";" : ",";
}

/** Découpe un texte CSV en lignes de cellules ; gère guillemets, "" échappés et retours à la ligne dans une cellule. */
export function parseCsv(input: string, separator = detectSeparator(input)): string[][] {
  const text = input.replace(/^﻿/, ""); // BOM ajouté par Excel
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"' && cell === "") {
      quoted = true;
    } else if (c === separator) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map(restoreCell));
}

/*
 * Injection de formules : un tableur exécute une cellule qui commence par = + - @
 * (ou une tabulation / un retour chariot). Les noms, adresses… sont saisis par les
 * clients : à l'écriture, ces cellules sont précédées d'une apostrophe, que le tableur
 * affiche comme du texte. À la relecture, l'apostrophe est retirée : un aller-retour
 * export → import rend exactement les mêmes valeurs.
 */
const FORMULA_START = /^[=+\-@\t\r]/;
export const neutralizeCell = (value: string) => (FORMULA_START.test(value) ? `'${value}` : value);
const restoreCell = (value: string) => (value.startsWith("'") && FORMULA_START.test(value.slice(1)) ? value.slice(1) : value);

/** « Code postal » → « code_postal », « Catégorie » → « categorie » : en-têtes tolérants. */
export const normalizeHeader = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[\s/-]+/g, "_").replace(/_+/g, "_");

const escapeCell = (value: string, separator: string) =>
  /["\r\n]/.test(value) || value.includes(separator) ? `"${value.replace(/"/g, '""')}"` : value;

/** Écrit un CSV (séparateur « ; », BOM pour qu'Excel lise bien les accents). */
export function toCsv(rows: string[][], separator = ";"): string {
  return "﻿" + rows.map((r) => r.map((v) => escapeCell(neutralizeCell(v), separator)).join(separator)).join("\r\n") + "\r\n";
}
