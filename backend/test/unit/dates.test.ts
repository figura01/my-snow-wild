import { countDays, isIsoDate, MAX_RENTAL_DAYS, parsePeriod } from "../../src/utils/dates";

// Dates relatives à aujourd'hui, pour que les tests ne vieillissent pas.
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

describe("isIsoDate", () => {
  it("accepte une date valide au format AAAA-MM-JJ", () => {
    expect(isIsoDate("2027-02-28")).toBe(true);
  });
  it("refuse une date impossible ou mal formée", () => {
    expect(isIsoDate("2027-02-30")).toBe(false);
    expect(isIsoDate("28/02/2027")).toBe(false);
    expect(isIsoDate("2027-2-8")).toBe(false);
  });
});

describe("countDays", () => {
  it("compte les jours bornes incluses", () => {
    expect(countDays("2027-01-10", "2027-01-12")).toBe(3);
    expect(countDays("2027-01-10", "2027-01-10")).toBe(1);
  });
  it("traverse correctement un changement d'heure", () => {
    expect(countDays("2027-03-27", "2027-03-29")).toBe(3);
  });
});

describe("parsePeriod", () => {
  it("renvoie null quand aucune date n'est fournie", () => {
    expect(parsePeriod(undefined, undefined)).toBeNull();
  });
  it("renvoie la période et sa durée", () => {
    expect(parsePeriod(inDays(10), inDays(12))).toEqual({ start: inDays(10), end: inDays(12), days: 3 });
  });
  it("exige les deux dates", () => {
    expect(() => parsePeriod(inDays(10), undefined)).toThrow("date de début et une date de fin");
  });
  it("refuse une date de début passée", () => {
    expect(() => parsePeriod(inDays(-1), inDays(2))).toThrow("passée");
  });
  it("refuse une fin avant le début", () => {
    expect(() => parsePeriod(inDays(12), inDays(10))).toThrow("après la date de début");
  });
  it(`limite la location à ${MAX_RENTAL_DAYS} jours`, () => {
    expect(() => parsePeriod(inDays(1), inDays(1 + MAX_RENTAL_DAYS))).toThrow(`${MAX_RENTAL_DAYS} jours`);
    expect(parsePeriod(inDays(1), inDays(MAX_RENTAL_DAYS))?.days).toBe(MAX_RENTAL_DAYS);
  });
});
