import { checkImageUrl, isPublicIp } from "../../src/services/remote-image";

describe("photos par adresse : protection contre les adresses internes", () => {
  it.each(["127.0.0.1", "10.0.0.5", "172.20.1.1", "192.168.1.10", "169.254.169.254", "100.64.0.1", "::1", "fd00::1", "::ffff:127.0.0.1"])(
    "refuse l'adresse privée %s",
    (ip) => expect(isPublicIp(ip)).toBe(false),
  );

  it.each(["8.8.8.8", "151.101.1.1", "2606:4700::6810:85e5"])("accepte l'adresse publique %s", (ip) => {
    expect(isPublicIp(ip)).toBe(true);
  });

  it("n'accepte que des adresses https publiques, sans identifiants ni port exotique", () => {
    expect(checkImageUrl("https://images.exemple.com/ski.jpg").hostname).toBe("images.exemple.com");
    expect(() => checkImageUrl("http://exemple.com/ski.jpg")).toThrow("https");
    expect(() => checkImageUrl("file:///etc/passwd")).toThrow("https");
    expect(() => checkImageUrl("https://192.168.1.1/x.jpg")).toThrow("privée");
    expect(() => checkImageUrl("https://exemple.com:8443/x.jpg")).toThrow("port");
    expect(() => checkImageUrl("https://user:pass@exemple.com/x.jpg")).toThrow("identifiants");
    expect(() => checkImageUrl("pas une adresse")).toThrow("invalide");
  });
});
