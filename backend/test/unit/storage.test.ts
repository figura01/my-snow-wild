import { cloudinarySignature, cloudinaryStorage, parseCloudinaryUrl } from "../../src/services/storage";

describe("Cloudinary", () => {
  it("lit CLOUDINARY_URL", () => {
    expect(parseCloudinaryUrl("cloudinary://123456:abc-DEF@snow-wild")).toEqual({
      apiKey: "123456",
      apiSecret: "abc-DEF",
      cloudName: "snow-wild",
    });
    expect(parseCloudinaryUrl(undefined)).toBeNull();
    expect(() => parseCloudinaryUrl("https://exemple.fr")).toThrow("CLOUDINARY_URL invalide");
  });

  it("signe les paramètres triés suivis du secret (SHA-1)", () => {
    // Exemple de la documentation Cloudinary : « eager=w_400,h_300,c_pad|w_260,h_200,c_crop&public_id=sample_image&timestamp=1315060510abcd »
    expect(
      cloudinarySignature({ timestamp: "1315060510", public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" }, "abcd"),
    ).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("construit les adresses des deux formats, en format et qualité automatiques", () => {
    const storage = cloudinaryStorage({ cloudName: "demo", apiKey: "k", apiSecret: "s" });
    expect(storage.url("snow-wild/materials/abc", "thumb")).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_640,h_480,f_auto,q_auto/snow-wild/materials/abc",
    );
    expect(storage.url("snow-wild/materials/abc", "large")).toContain("/c_limit,w_1600,h_1200,f_auto,q_auto/");
  });
});
