import { detectSeparator, parseCsv, toCsv } from "../../src/utils/csv";

describe("CSV", () => {
  it("détecte le séparateur d'Excel français (;) ou standard (,)", () => {
    expect(detectSeparator("nom;categorie;prix\nA;B;1")).toBe(";");
    expect(detectSeparator("nom,categorie,prix")).toBe(",");
  });

  it("gère guillemets, guillemets doublés, séparateur et retour à la ligne dans une cellule", () => {
    const text = '﻿nom;description\r\n"Ski ""Pro""";"Ligne 1\nLigne 2; suite"\r\nCasque;\n';
    expect(parseCsv(text)).toEqual([
      ["nom", "description"],
      ['Ski "Pro"', "Ligne 1\nLigne 2; suite"],
      ["Casque", ""],
    ]);
  });

  it("relit à l'identique ce qu'il écrit", () => {
    const rows = [["a;b", 'c"d', "e\nf"], ["", "x", "y"]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
