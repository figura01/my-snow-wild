import { slugify } from "../../src/utils/slugify";

describe("slugify", () => {
  it("supprime les accents, la casse et la ponctuation", () => {
    expect(slugify("Bâtons de ski — Édition 2027 !")).toBe("batons-de-ski-edition-2027");
  });
  it("ne laisse pas de tiret au début ou à la fin", () => {
    expect(slugify("  --Casque--  ")).toBe("casque");
  });
  it("tronque à 80 caractères", () => {
    expect(slugify("a".repeat(200))).toHaveLength(80);
  });
});
