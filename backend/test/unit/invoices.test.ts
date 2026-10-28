import { formatEuros } from "../../src/services/invoice-pdf";
import { formatInvoiceNumber, invoiceYear, splitVat } from "../../src/services/invoices";

describe("factures : calculs", () => {
  it("déduit le HT et la TVA d'un prix TTC, au centime près", () => {
    expect(splitVat(12000)).toEqual({ totalHtCents: 10000, vatCents: 2000, totalTtcCents: 12000 });
    expect(splitVat(4500)).toEqual({ totalHtCents: 3750, vatCents: 750, totalTtcCents: 4500 });
    // 1 € TTC : 0,83 € HT + 0,17 € de TVA ; la somme retombe toujours sur le TTC.
    expect(splitVat(100)).toEqual({ totalHtCents: 83, vatCents: 17, totalTtcCents: 100 });
    for (const ttc of [1, 99, 1999, 123457]) {
      const { totalHtCents, vatCents } = splitVat(ttc);
      expect(totalHtCents + vatCents).toBe(ttc);
    }
  });

  it("numérote FA-AAAA-NNNN", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("FA-2026-0001");
    expect(formatInvoiceNumber(2027, 1234)).toBe("FA-2027-1234");
    expect(formatInvoiceNumber(2027, 12345)).toBe("FA-2027-12345");
  });

  it("prend l'année à l'heure de Paris", () => {
    // 31/12/2026 à 23 h 30 UTC : déjà le 1er janvier 2027 à Paris.
    expect(invoiceYear(new Date("2026-12-31T23:30:00Z"))).toBe(2027);
    expect(invoiceYear(new Date("2026-12-31T22:30:00Z"))).toBe(2026);
  });

  it("formate les montants en euros avec des espaces ordinaires", () => {
    expect(formatEuros(0)).toBe("0,00 €");
    expect(formatEuros(1505)).toBe("15,05 €");
    expect(formatEuros(123456789)).toBe("1 234 567,89 €");
  });
});
