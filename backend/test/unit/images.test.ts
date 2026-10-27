import { detectImageType } from "../../src/services/images";

const bytes = (...values: number[]) => Buffer.from(values);

describe("detectImageType (signature réelle du fichier)", () => {
  it("reconnaît JPEG, PNG et WebP", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe("png");
    expect(detectImageType(Buffer.from("RIFF\x00\x00\x00\x00WEBPVP8 ", "latin1"))).toBe("webp");
  });

  it("refuse le reste, y compris un SVG ou un script renommé", () => {
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(detectImageType(Buffer.from("GIF89a"))).toBeNull();
    expect(detectImageType(Buffer.from("%PDF-1.7"))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});
